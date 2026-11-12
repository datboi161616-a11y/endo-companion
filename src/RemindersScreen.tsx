import React, {useEffect, useRef, useState} from 'react';
import {Platform, Pressable, ScrollView, Switch, Text, TextInput, View} from 'react-native';
import {usePalette, type Palette} from './ui';
import {useTranslation} from './i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {AndroidImportance} from 'expo-notifications';
import {applyReminders, notificationId, parseReminders, parseTime, REMINDERS_KEY, type Reminder} from './reminders';

if (Platform.OS !== 'web') Notifications.setNotificationHandler({handleNotification: async () => ({shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false})});
const scheduler = {
  schedule: async (reminder: Reminder) => {
    await Notifications.scheduleNotificationAsync({identifier: notificationId(reminder.id), content: {title: 'Endolog', body: reminder.title, sound: 'default'}, trigger: {type: Notifications.SchedulableTriggerInputTypes.DAILY, ...parseTime(reminder.time), channelId: 'endolog-reminders'}});
  },
  cancel: (id: string) => Notifications.cancelScheduledNotificationAsync(id),
};
export default function RemindersScreen({onClose, colors}: {onClose: () => void; colors?: Palette}) {
  const {t} = useTranslation();
  const systemColors = usePalette('system');
  const palette = colors ?? systemColors;
  const dark = palette.bg === '#18181d';
  const c = {...palette, accent: '#ef416e'};
  const [rows, setRows] = useState<Reminder[]>([]);
  const saved = useRef<Reminder[]>([]);
  const lock = useRef(false);
  const [busy, setBusy] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState(t('Medication'));
  const [time, setTime] = useState('09:00');
  useEffect(() => {let alive = true; void AsyncStorage.getItem(REMINDERS_KEY).then(raw => {const data = parseReminders(raw); if (alive) {saved.current = data; setRows(data); setLoaded(true);}}).catch(() => {if (alive) setMessage('Saved reminders could not be loaded. Close and reopen this screen to try again.');}).finally(() => {if (alive) setBusy(false);}); return () => {alive = false;};}, []);
  const save = async (next: Reminder[]) => {
    if (lock.current || !loaded) return;
    lock.current = true; setBusy(true); setMessage('');
    try {
      if (Platform.OS === 'web') throw Error('Local reminders are available in the installed iPhone or Android app.');
      if (next.some(row => row.enabled)) {
        if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('endolog-reminders', {name: 'Reminders', importance: AndroidImportance.DEFAULT});
        let permission = await Notifications.getPermissionsAsync();
        if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
        if (!permission.granted) throw Error('Notifications are off. Allow notifications for Endolog in device settings, then try again.');
      }
      await applyReminders(saved.current, next, scheduler, raw => AsyncStorage.setItem(REMINDERS_KEY, raw));
      saved.current = next; setRows(next); setMessage('Reminders saved.');
    } catch (error) {setMessage(error instanceof Error ? error.message : 'Unable to save reminders. Please try again.');}
    finally {lock.current = false; setBusy(false);}
  };
  const inputStyle = {color: c.ink, backgroundColor: c.bg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: dark ? '#493c50' : '#ece3ef'};

  return <View style={{flex: 1, backgroundColor: c.bg, paddingTop: 12}}>
    <View style={{paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}><Text style={{fontSize: 27, fontWeight: '700', color: c.ink}}>{t('Reminders')}</Text><Pressable accessibilityRole="button" disabled={busy} onPress={onClose} style={{padding: 12}}><Text style={{color: c.accent}}>{t('Done')}</Text></Pressable></View>
    <ScrollView contentContainerStyle={{padding: 24, gap: 18, paddingBottom: 60}} keyboardShouldPersistTaps="handled">
      <Text style={{color: c.muted, lineHeight: 21}}>{t('Reminders repeat daily at your device’s local time.')}</Text>
      {Platform.OS === 'web' && <Text style={{color: c.muted}}>{t('Install the app on your phone to receive local notifications.')}</Text>}
      {rows.map(row => <View key={row.id} style={{backgroundColor: c.card, padding: 18, borderRadius: 22, gap: 12}}>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12}}><Text style={{color: c.ink, fontSize: 17, fontWeight: '600', flex: 1}}>{row.id === 'checkin' ? t(row.title) : row.title}</Text><Switch accessibilityLabel={`${t('Enabled')}: ${row.title}`} disabled={busy} value={row.enabled} trackColor={{true: c.accent}} onValueChange={enabled => {void save(rows.map(item => item.id === row.id ? {...item, enabled} : item));}} /></View>
        <TextInput accessibilityLabel={`${row.title}: ${t('Time, 24-hour format')}`} placeholder="HH:MM" placeholderTextColor={c.muted} value={row.time} editable={!busy} maxLength={5} onChangeText={value => setRows(current => current.map(item => item.id === row.id ? {...item, time: value} : item))} style={inputStyle} />
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}><ReminderButton disabled={busy || !loaded} color={c.accent} label={t('Save time')} onPress={() => {void save(rows);}} /><ReminderButton disabled={busy || !loaded} color={c.accent} label={t('Remove')} onPress={() => {void save(rows.filter(item => item.id !== row.id));}} /></View>
      </View>)}
      <View style={{backgroundColor: c.card, padding: 18, borderRadius: 22, gap: 12}}>
        <Text style={{color: c.ink, fontSize: 18, fontWeight: '600'}}>{t('Add a reminder')}</Text>
        <TextInput accessibilityLabel={t('Reminder name')} placeholder={t('Medication or custom reminder')} placeholderTextColor={c.muted} value={title} onChangeText={setTitle} maxLength={80} editable={!busy} style={inputStyle} />
        <TextInput accessibilityLabel={t('New reminder time, 24-hour format')} placeholder="HH:MM" placeholderTextColor={c.muted} value={time} onChangeText={setTime} maxLength={5} editable={!busy} style={inputStyle} />
        <ReminderButton disabled={busy || !loaded} color={c.accent} label={t('Add reminder')} onPress={() => {if (!title.trim()) {setMessage('Enter a name for your reminder.'); return;} void save([...rows, {id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: title.trim(), time, enabled: true}]);}} />
      </View>
      <Text accessibilityLiveRegion="polite" style={{color: c.muted, lineHeight: 21}}>{t(busy ? 'Saving…' : message)}</Text>
      <Text style={{color: c.muted, fontSize: 12}}>{t('Notifications can appear on your lock screen. Reminder schedules stay on this device and are not included in diary backups.')}</Text>
    </ScrollView>
  </View>;
}

function ReminderButton({label, onPress, disabled, color}: {label: string; onPress: () => void; disabled: boolean; color: string}) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={{paddingVertical: 12, opacity: disabled ? 0.4 : 1}}><Text style={{color, fontWeight: '600'}}>{label}</Text></Pressable>;
}
