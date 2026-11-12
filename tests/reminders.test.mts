import assert from 'node:assert/strict';
import {test} from 'node:test';
import {applyReminders, notificationId, parseReminders, parseTime} from '../src/reminders.ts';
test('validates daily wall clock time and saved reminder identity', () => {
  assert.deepEqual(parseTime('00:00'), {hour: 0, minute: 0});
  assert.deepEqual(parseTime('23:59'), {hour: 23, minute: 59});
  for (const time of ['24:00', '12:60', '9:00', 'NaN']) assert.throws(() => parseTime(time));
  assert.equal(parseReminders(null)[0].enabled, false);
  const reminder = parseReminders(null)[0];
  assert.throws(() => parseReminders(JSON.stringify([reminder, reminder])));
});
test('repeated saves replace a stable schedule; disabling removes it', async () => {
  const active = {...parseReminders(null)[0], enabled: true};
  const os = new Map();
  const scheduler = {schedule: async (r: typeof active) => {os.set(notificationId(r.id), r.time);}, cancel: async (id: string) => {os.delete(id);}};
  await applyReminders([], [active], scheduler, async () => {});
  await applyReminders([active], [active], scheduler, async () => {});
  assert.equal(os.size, 1);
  await applyReminders([active], [{...active, enabled: false}], scheduler, async () => {});
  assert.equal(os.size, 0);
});
test('storage failure restores the previous schedule', async () => {
  const active = {...parseReminders(null)[0], enabled: true};
  const os = new Map([[notificationId(active.id), active.time]]);
  const scheduler = {schedule: async (r: typeof active) => {os.set(notificationId(r.id), r.time);}, cancel: async (id: string) => {os.delete(id);}};
  await assert.rejects(applyReminders([active], [{...active, time: '09:00'}], scheduler, async () => {throw Error('disk');}));
  assert.equal(os.get(notificationId(active.id)), '20:00');
});
test('partial OS failure removes a newly scheduled reminder and does not persist', async () => {
  const first = {...parseReminders(null)[0], enabled: true};
  const second = {...first, id: 'second'};
  const os = new Map<string, string>();
  let persisted = false;
  const scheduler = {schedule: async (r: typeof first) => {if (r.id === 'second') throw Error('OS failure'); os.set(notificationId(r.id), r.time);}, cancel: async (id: string) => {os.delete(id);}};
  await assert.rejects(applyReminders([], [first, second], scheduler, async () => {persisted = true;}));
  assert.equal(os.size, 0);
  assert.equal(persisted, false);
});
