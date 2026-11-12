import React, {useState} from 'react';
import {Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {calendarDates, localDate} from './model';
import {logTitles, type DiaryOptions, type Log} from './diary';
import {dayIntensity, logTime} from './TodayScreen';
import {accent, RoundButton, Row, styles as ui, type Palette} from './ui';

export const months = Array.from({length: 12}, (_, i) =>
  new Date(2026, i, 1).toLocaleDateString(undefined, {month: 'long'})
);

function Section({title, colors, children}: React.PropsWithChildren<{title: string; colors: Palette}>) {
  return (
    <>
      <Text style={[ui.caption, {color: colors.muted}]}>{title}</Text>
      <View style={[ui.card, {backgroundColor: colors.card}]}>{children}</View>
    </>
  );
}

export function YearScreen({year, logs, colors, changeYear, openMonth}: {
  year: number; logs: Log[]; colors: Palette; changeYear: (year: number) => void; openMonth: (year: number, month: number) => void;
}) {
  return (
    <View style={ui.content}>
      <View style={ui.split}>
        <Text style={[ui.title, {color: colors.ink}]}>{year}</Text>
        <View style={s.actions}>
          <RoundButton label="Previous year" icon="‹" colors={colors} onPress={() => changeYear(year - 1)} />
          <RoundButton label="Next year" icon="›" colors={colors} onPress={() => changeYear(year + 1)} />
        </View>
      </View>
      <View style={s.yearGrid}>
        {months.map((name, month) => (
          <Pressable key={name} accessibilityRole="button" accessibilityLabel={`${name} ${year}`}
            style={[s.yearMonth, {backgroundColor: colors.card}]}
            onPress={() => openMonth(year, month)}>
            <Text style={{color: colors.ink, fontWeight: '700', marginBottom: 7}}>{name.slice(0, 3)}</Text>
            <View style={s.miniGrid}>
              {calendarDates(year, month).map(date => {
                const inMonth = Number(date.slice(5, 7)) === month + 1;
                const period = logs.some(log => log.date === date && log.kind === 'period' && !['None', 'No Flow', ''].includes(String(log.fields.flow ?? '')));
                const pain = dayIntensity(logs, date);
                return <View key={date} style={s.miniCell}><View style={[s.miniDot, {
                  backgroundColor: !inMonth ? 'transparent' : period ? accent : pain ? pain >= 7 ? '#e85b41' : '#e8a03b' : colors.edge,
                }]} /></View>;
              })}
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function HealthScreen({logs, colors, openReport, openLog}: {
  logs: Log[]; colors: Palette; openReport: () => void; openLog: (log: Log) => void;
}) {
  const first = new Date();
  first.setDate(first.getDate() - 29);
  const recent = logs.filter(log => log.date >= localDate(first));
  const pains = recent.filter(log => log.kind === 'pain' && typeof log.fields.intensity === 'number');
  const average = pains.length ? (pains.reduce((sum, log) => sum + Number(log.fields.intensity), 0) / pains.length).toFixed(1) : '—';
  const lastPeriod = logs.find(log => log.kind === 'period' && !['No Flow', 'None', ''].includes(String(log.fields.flow ?? '')));
  const symptoms = new Map<string, number>();
  for (const log of pains) {
    if (!Array.isArray(log.fields.symptoms)) continue;
    for (const symptom of log.fields.symptoms) symptoms.set(symptom, (symptoms.get(symptom) ?? 0) + 1);
  }
  const mostFrequent = [...symptoms.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <View style={ui.content}>
      <View style={ui.split}>
        <Text style={[ui.title, {color: colors.ink}]}>Health</Text>
        <RoundButton label="Share report" icon="↗" colors={colors} onPress={openReport} />
      </View>
      <Section title="Last 30 days" colors={colors}>
        <Row label="Days logged" value={String(new Set(recent.map(log => log.date)).size)} colors={colors} />
        <Row label="Average pain" value={average} colors={colors} />
        <Row label="Highest pain" value={pains.length ? String(Math.max(...pains.map(log => Number(log.fields.intensity)))) : '—'} colors={colors} />
        <Row label="Last period log" value={lastPeriod?.date ?? '—'} colors={colors} onPress={lastPeriod ? () => openLog(lastPeriod) : undefined} />
      </Section>
      {!!mostFrequent.length && <Section title="Symptoms" colors={colors}>
        {mostFrequent.map(([symptom, count]) => <Row key={symptom} label={symptom} value={String(count)} colors={colors} />)}
      </Section>}
      <Section title="Logs" colors={colors}>
        {Object.entries(logTitles).map(([kind, label]) =>
          <Row key={kind} label={label} value={String(recent.filter(log => log.kind === kind).length)} colors={colors} />
        )}
      </Section>
      <Pressable accessibilityRole="button" onPress={openReport} style={ui.button}><Text style={ui.buttonText}>PDF Report</Text></Pressable>
    </View>
  );
}

const optionTitles = {locations: 'Pain Locations', descriptors: 'Pain Descriptors', symptoms: 'Symptoms', medications: 'Medications', food: 'Food'};
export type OptionCategory = keyof typeof optionTitles;

export function SettingsScreen({options, colors, showOptions, showAppearance, openReport, backup, restore}: {
  options: DiaryOptions; colors: Palette; showOptions: (key: OptionCategory) => void; showAppearance: () => void;
  openReport: () => void; backup: () => void; restore: () => void;
}) {
  return (
    <View style={ui.content}>
      <Text style={[ui.title, {color: colors.ink}]}>Settings</Text>
      <Section title="Logging options" colors={colors}>
        {(Object.keys(optionTitles) as OptionCategory[]).map(key =>
          <Row key={key} label={optionTitles[key]} colors={colors} onPress={() => showOptions(key)} />
        )}
      </Section>
      <Section title="Preferences" colors={colors}>
        <Row label="Appearance" value={options.theme[0].toUpperCase() + options.theme.slice(1)} colors={colors} onPress={showAppearance} />
      </Section>
      <Section title="Reports and data" colors={colors}>
        <Row label="PDF Report" colors={colors} onPress={openReport} />
        <Row label="Export diary backup" colors={colors} onPress={backup} />
        <Row label="Import diary backup" colors={colors} onPress={restore} />
      </Section>
    </View>
  );
}

export function OptionEditor({category, items, colors, onChange}: {
  category: OptionCategory; items: string[]; colors: Palette; onChange: (items: string[]) => void;
}) {
  const [value, setValue] = useState('');
  function add() {
    const item = value.trim();
    if (!item || items.some(existing => existing.toLowerCase() === item.toLowerCase())) return;
    onChange([...items, item]);
    setValue('');
  }

  return (
    <View style={ui.content}>
      <Text style={[ui.heading, {color: colors.ink}]}>{optionTitles[category]}</Text>
      <View style={ui.split}>
        <TextInput accessibilityLabel="New option" placeholder="Add an option" placeholderTextColor={colors.muted}
          value={value} onChangeText={setValue} onSubmitEditing={add} maxLength={60}
          style={[s.input, {backgroundColor: colors.card, color: colors.ink}]} />
        <RoundButton label="Add option" icon="+" onPress={add} colors={colors} highlighted />
      </View>
      <View style={[ui.card, {backgroundColor: colors.card}]}>
        {items.map(item => (
          <View key={item} style={ui.split}>
            <Text style={{padding: 14, flex: 1, color: colors.ink}}>{item}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item}`} style={s.removeOption} onPress={() => onChange(items.filter(entry => entry !== item))}>
              <Text style={{fontSize: 21, color: accent}}>−</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

const fieldNames: Record<string, string> = {
  intensity: 'Pain score', locations: 'Pain locations', descriptors: 'Pain descriptors', symptoms: 'Symptoms',
  medications: 'Medication', foods: 'What you ate', timeOfDay: 'Time of day', feeling: 'How you felt',
  bristolType: 'Bristol stool type', flow: 'Flow level', duration: 'Duration', placement: 'Placement',
  urgency: 'Urgency', relief: 'Relief', sleep: 'Sleep (hours)', mood: 'Mood',
};

export function LogDetails({log, colors, edit, remove}: {log: Log; colors: Palette; edit: () => void; remove: () => void}) {
  return (
    <ScrollView contentContainerStyle={ui.content}>
      <View style={ui.split}>
        <Text style={[ui.heading, {color: colors.ink}]}>{logTitles[log.kind]}</Text>
        <RoundButton label="Edit log" icon="✎" onPress={edit} colors={colors} />
      </View>
      <Text style={{color: colors.muted}}>{log.date} · {logTime(log.time)}</Text>
      {!!log.attachment && <Image accessibilityLabel="Log photo" style={s.photo} resizeMode="contain" source={{uri: log.attachment}} />}
      <View style={[ui.card, {backgroundColor: colors.card}]}>
        {Object.entries(log.fields).map(([key, value]) => {
          const display = Array.isArray(value) ? value.join(', ') : String(value);
          return display ? <Row key={key} label={fieldNames[key] ?? key} value={display} colors={colors} /> : null;
        })}
        {!!log.notes && <View style={s.notes}>
          <Text style={{color: colors.muted, fontSize: 13}}>NOTES</Text>
          <Text style={{color: colors.ink, fontSize: 16}}>{log.notes}</Text>
        </View>}
      </View>
      <View style={[ui.card, {backgroundColor: colors.card}]}><Row label="Delete log" onPress={remove} colors={colors} danger /></View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  actions: {flexDirection: 'row', gap: 8},
  yearGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10},
  yearMonth: {width: '32%', minHeight: 103, borderRadius: 14, padding: 8},
  miniGrid: {flexDirection: 'row', flexWrap: 'wrap'},
  miniCell: {width: '14.2857%', height: 11, alignItems: 'center', justifyContent: 'center'},
  miniDot: {width: 6, height: 6, borderRadius: 3},
  input: {flex: 1, borderRadius: 14, padding: 14, fontSize: 16},
  removeOption: {minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center'},
  photo: {width: '100%', height: 220, borderRadius: 18},
  notes: {padding: 14, gap: 6},
});
