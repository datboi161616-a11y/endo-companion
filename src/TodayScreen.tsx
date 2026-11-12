import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {calendarDates, localDate} from './model';
import {logTitles, type Log, type LogKind} from './diary';
import {accent, RoundButton, styles as ui, type Palette} from './ui';

const painColors = ['#268853', '#4b9851', '#7fad42', '#afcb39', '#efc348', '#e8a03b',
  '#f18a2b', '#ed6228', '#e54c37', '#e43d46', '#c92746'];
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function logTime(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

export function dayIntensity(logs: Log[], date: string) {
  return logs.reduce((highest, log) => log.kind === 'pain' && log.date === date
    ? Math.max(highest, Math.min(10, Math.max(0, Math.round(Number(log.fields.intensity) || 0))))
    : highest, 0);
}

function DayRing({pain, flow, colors}: {pain: number; flow: boolean; colors: Palette}) {
  if (pain === 0 && !flow) return null;
  const color = flow ? accent : painColors[pain];
  const angle = (pain || 10) * 36;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.rightHalf}>
        <View style={[styles.ringFill, {right: 0, borderTopColor: color, borderLeftColor: color,
          transform: [{rotate: (Math.min(angle, 180) - 45) + 'deg'}]}]} />
      </View>
      {angle > 180 && (
        <View style={styles.leftHalf}>
          <View style={[styles.ringFill, {left: 0, borderTopColor: color, borderLeftColor: color,
            transform: [{rotate: (angle - 45) + 'deg'}]}]} />
        </View>
      )}
      <View style={[styles.ringCenter, {backgroundColor: colors.bg}]} />
    </View>
  );
}

const kindIcons: Record<LogKind, string> = {pain: '⚡', food: '🍎', bowel: '●', period: '💧', heat: '♨', tens: 'ϟ', note: '✎'};

export function logSummary(log: Log) {
  const value = log.fields.locations ?? log.fields.foods ?? log.fields.flow ?? log.fields.bristolType
    ?? log.fields.placement ?? log.fields.duration ?? log.notes;
  return Array.isArray(value) ? value.join(' · ') : String(value);
}

export default function TodayScreen({date, logs, visibleKinds, month, colors, selectDate, openMonth, openNote, openReport, openLog, openFilter}: {
  date: string; logs: Log[]; visibleKinds: LogKind[]; month: Date; colors: Palette;
  selectDate: (date: string) => void; openMonth: () => void; openNote: () => void;
  openReport: () => void; openLog: (log: Log) => void; openFilter: () => void;
}) {
  const today = localDate();
  const selected = logs.filter(log => log.date === date && (!visibleKinds.length || visibleKinds.includes(log.kind)));
  const dates = calendarDates(month.getFullYear(), month.getMonth());
  const heading = date === today ? 'Today' : new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long', month: 'short', day: 'numeric',
  });

  return (
    <View style={styles.screen}>
      <View style={ui.split}>
        <Text style={[ui.title, {color: colors.ink, flexShrink: 1}]}>🍓 Endolog</Text>
        <View style={styles.actions}>
          <RoundButton label="Calendar" icon="▦" colors={colors} onPress={openMonth} />
          <RoundButton label="Share report" icon="↗" colors={colors} onPress={openReport} />
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Choose a month" onPress={openMonth} style={styles.month}>
        <Text style={[styles.monthText, {color: colors.ink}]}>{month.toLocaleDateString(undefined, {month: 'long', year: 'numeric'})}</Text>
        <Text style={{color: colors.muted, fontSize: 21}}>⌄</Text>
      </Pressable>
      <View style={styles.grid}>
        {weekdays.map(day => <Text key={day} style={[styles.weekday, {color: colors.muted}]}>{day}</Text>)}
        {dates.map(day => {
          const pain = dayIntensity(logs, day);
          const flow = logs.some(log => log.date === day && log.kind === 'period' && !['No Flow', 'None', ''].includes(String(log.fields.flow ?? '')));
          const isFuture = day > today;
          const dimmed = isFuture || Number(day.slice(5, 7)) !== month.getMonth() + 1;
          return (
            <View key={day} style={styles.dayCell}>
              <Pressable accessibilityLabel={pain ? `${day}, pain ${pain} out of 10` : day} accessibilityRole="button"
                accessibilityState={{selected: day === date, disabled: isFuture}}
                disabled={isFuture} onPress={() => selectDate(day)}
                style={[styles.dayRing, {backgroundColor: colors.edge}, day === date && {borderColor: pain ? painColors[pain] : accent, borderWidth: 1}]}>
                <View style={[styles.ringCenter, {backgroundColor: colors.bg}]} />
                <DayRing pain={pain} flow={flow} colors={colors} />
                <Text style={[styles.dayText, {color: day === today ? accent : dimmed ? colors.muted : colors.ink}]}>{Number(day.slice(-2))}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
      <View style={[ui.split, styles.logHeader]}>
        <Text style={[ui.heading, {color: colors.ink, flexShrink: 1}]}>{heading}</Text>
        <View style={styles.actions}>
          <RoundButton label="Daily note" icon="✎" colors={colors} onPress={openNote} />
          <RoundButton label="Filter logs" icon="☷" colors={colors} onPress={openFilter} />
        </View>
      </View>
      {selected.map(log => {
        const score = Math.min(10, Math.max(0, Math.round(Number(log.fields.intensity) || 0)));
        const summary = logSummary(log);
        return (
          <Pressable key={log.id} accessibilityRole="button" onPress={() => openLog(log)}
            style={[styles.entry, {backgroundColor: colors.card, borderColor: colors.edge}]}>
            <View style={[styles.score, {backgroundColor: log.kind === 'pain' ? painColors[score] : colors.bg}]}>
              <Text style={[styles.scoreText, {color: log.kind === 'pain' ? '#342713' : colors.ink}]}>{log.kind === 'pain' ? score : kindIcons[log.kind]}</Text>
            </View>
            <View style={styles.entryContent}>
              <Text style={{color: colors.muted, fontWeight: '600'}}>{logTime(log.time)}</Text>
              <Text style={[styles.entryTitle, {color: colors.ink}]}>{logTitles[log.kind]}</Text>
              {!!summary && <Text numberOfLines={1} style={[styles.entryTag, {color: colors.ink, backgroundColor: colors.bg}]}>{summary}</Text>}
            </View>
            <Text style={{fontSize: 25, color: colors.muted}}>›</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flexGrow: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12},
  actions: {flexDirection: 'row', gap: 8},
  month: {flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: 16, marginBottom: 12},
  monthText: {fontSize: 19, fontWeight: '700'},
  grid: {flexDirection: 'row', flexWrap: 'wrap'},
  weekday: {width: '14.2857%', textAlign: 'center', fontSize: 14, marginBottom: 8},
  dayCell: {width: '14.2857%', height: 48, alignItems: 'center', justifyContent: 'center'},
  dayRing: {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
  dayText: {fontWeight: '600', fontSize: 14},
  rightHalf: {position: 'absolute', top: 0, bottom: 0, right: 0, width: 20, overflow: 'hidden'},
  leftHalf: {position: 'absolute', top: 0, bottom: 0, left: 0, width: 20, overflow: 'hidden'},
  ringCenter: {position: 'absolute', top: 5, left: 5, right: 5, bottom: 5, borderRadius: 20},
  ringFill: {width: 40, height: 40, borderRadius: 20, position: 'absolute', borderWidth: 5, borderRightColor: 'transparent', borderBottomColor: 'transparent'},
  logHeader: {marginTop: 76, marginBottom: 8},
  entry: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginBottom: 10, borderRadius: 24, borderWidth: 1, minHeight: 96},
  score: {width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center'},
  scoreText: {fontWeight: '800', fontSize: 22},
  entryContent: {flex: 1, alignItems: 'flex-start', gap: 4},
  entryTitle: {fontWeight: '800', fontSize: 20},
  entryTag: {fontWeight: '600', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12},
});
