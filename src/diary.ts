import {localDate, type Entry} from './model.ts';

export const logTitles = {
  pain: 'Flare-up',
  food: 'Food',
  bowel: 'Bowel movement',
  period: 'Period',
  heat: 'Heating pad',
  tens: 'TENS',
  note: 'Daily note',
};
export type LogKind = keyof typeof logTitles;
export type Log = {
  id: string;
  kind: LogKind;
  date: string;
  time: string;
  fields: Record<string, string | number | string[]>;
  notes: string;
  attachment?: string;
  voiceNote?: string;
};

export type DiaryOptions = {
  locations: string[];
  descriptors: string[];
  symptoms: string[];
  medications: string[];
  food: string[];
  theme: 'system' | 'light' | 'dark';
  language: string;
  bowelDescriptors: string[];
  showStoolImages: boolean;
  showStoolTypeBadge: boolean;
};

export const defaultOptions: DiaryOptions = {
  locations: ['Abdomen', 'Pelvis', 'Lower back', 'Upper back', 'Hip', 'Legs', 'Bladder', 'Bowel'],
  descriptors: ['Cramping', 'Aching', 'Stabbing', 'Sharp', 'Burning', 'Pressure', 'Throbbing', 'Pulling'],
  symptoms: ['Bloating', 'Fatigue', 'Nausea', 'Headache', 'Brain fog', 'Mood swings', 'Painful urination', 'Pain with sex'],
  medications: [],
  food: ['Fast Food', 'Soda', 'Vegetables', 'Chicken', 'Dairy', 'Fruit', 'Grains', 'Coffee'],
  theme: 'system',
  language: 'en',
  bowelDescriptors: ['Cramping', 'Sharp', 'Burning', 'Pressure', 'Straining', 'Incomplete evacuation'],
  showStoolImages: true,
  showStoolTypeBadge: true,
};

export function isLocalDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && localDate(new Date(date + 'T12:00:00')) === date;
}

export function localTime(now = new Date()) {
  return [now.getHours(), now.getMinutes()].map(value => String(value).padStart(2, '0')).join(':');
}

export function createLog(kind: LogKind, date = localDate(), time = localTime()): Log {
  return {id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2), kind, date, time, fields: {}, notes: ''};
}

function byMostRecent(first: Log, second: Log) {
  return second.date.localeCompare(first.date) || second.time.localeCompare(first.time);
}

export function saveLog(logs: Log[], log: Log) {
  return [...logs.filter(item => item.id !== log.id), log].sort(byMostRecent);
}

function isLog(value: unknown): value is Log {
  if (!value || typeof value !== 'object') return false;
  const log = value as Log;
  return typeof log.id === 'string' && !!log.id
    && typeof log.kind === 'string' && Object.hasOwn(logTitles, log.kind)
    && typeof log.date === 'string' && isLocalDate(log.date)
    && typeof log.time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(log.time)
    && typeof log.notes === 'string'
    && (log.attachment === undefined || typeof log.attachment === 'string')
    && (log.voiceNote === undefined || typeof log.voiceNote === 'string')
    && !!log.fields && typeof log.fields === 'object' && !Array.isArray(log.fields)
    && Object.values(log.fields).every(field =>
      typeof field === 'string' || (typeof field === 'number' && Number.isFinite(field))
      || (Array.isArray(field) && field.every(item => typeof item === 'string'))
    );
}

export function parseDiary(raw: string): Log[] {
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every(isLog) || new Set(value.map(log => log.id)).size !== value.length) {
    throw new Error('Invalid diary');
  }
  return value.sort(byMostRecent);
}

export function parseOptions(raw: string): DiaryOptions {
  const value = JSON.parse(raw) as Partial<DiaryOptions>;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid settings');
  const result = {...defaultOptions};
  for (const key of ['locations', 'descriptors', 'symptoms', 'medications', 'food', 'bowelDescriptors'] as const) {
    const list = value[key];
    if (Array.isArray(list) && list.every(item => typeof item === 'string')) result[key] = list;
  }
  if (value.theme === 'dark' || value.theme === 'light') result.theme = value.theme;
  if (typeof value.language === 'string' && /^[a-z]{2}(-[A-Z]{2})?$/.test(value.language)) result.language = value.language;
  if (typeof value.showStoolImages === 'boolean') result.showStoolImages = value.showStoolImages;
  if (typeof value.showStoolTypeBadge === 'boolean') result.showStoolTypeBadge = value.showStoolTypeBadge;
  return result;
}

export function migrateEntries(entries: Entry[]): Log[] {
  return entries.flatMap(entry => {
    const pain: Log = {
      id: 'previous-pain-' + entry.date, kind: 'pain', date: entry.date, time: '12:00',
      fields: {intensity: entry.pain, symptoms: entry.symptoms, medications: entry.medications, mood: entry.mood, sleep: entry.sleep},
      notes: entry.notes,
    };
    if (entry.flow === 'None') return [pain];
    const period: Log = {
      id: 'previous-period-' + entry.date, kind: 'period', date: entry.date, time: '12:00',
      fields: {flow: entry.flow}, notes: '',
    };
    return [pain, period];
  }).sort(byMostRecent);
}
