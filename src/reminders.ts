export type Reminder = {id: string; title: string; time: string; enabled: boolean};
export const REMINDERS_KEY = 'endolog.local-reminders.v1';
export const notificationId = (id: string) => `endolog-reminder-${id}`;
export function parseTime(time: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Enter a time in 24-hour format, such as 20:30.');
  const [hour, minute] = time.split(':').map(Number);
  return {hour, minute};
}
export function parseReminders(raw: string | null): Reminder[] {
  if (!raw) return [{id: 'checkin', title: 'Daily check-in', time: '20:00', enabled: false}];
  const rows: unknown = JSON.parse(raw);
  if (!Array.isArray(rows) || rows.length > 32) throw new Error('Unable to read saved reminders.');
  const ids = new Set<string>();
  return rows.map(row => {
    if (!row || typeof row.id !== 'string' || !row.id || ids.has(row.id) || typeof row.title !== 'string' || !row.title.trim() || typeof row.enabled !== 'boolean' || typeof row.time !== 'string') throw new Error('Unable to read saved reminders.');
    parseTime(row.time); ids.add(row.id);
    return {id: row.id, title: row.title, time: row.time, enabled: row.enabled};
  });
}
export type ReminderScheduler = {schedule: (reminder: Reminder) => Promise<void>; cancel: (id: string) => Promise<void>};
// Stable identifiers replace existing OS requests, including after a retry.
export async function applyReminders(previous: Reminder[], next: Reminder[], scheduler: ReminderScheduler, persist: (raw: string) => Promise<void>) {
  parseReminders(JSON.stringify(next));
  const apply = async (from: Reminder[], to: Reminder[]) => {
    for (const reminder of to.filter(item => item.enabled)) await scheduler.schedule(reminder);
    for (const id of new Set([...from, ...to].map(item => item.id))) {
      if (!to.some(item => item.id === id && item.enabled)) await scheduler.cancel(notificationId(id));
    }
  };
  try { await apply(previous, next); await persist(JSON.stringify(next)); }
  catch (error) {
    try { await apply(next, previous); }
    catch { throw new Error('Reminder update failed and schedules could not be restored. Reopen Reminders to retry.'); }
    throw error;
  }
}
