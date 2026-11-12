import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import {File, Paths} from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import TodayScreen from './src/TodayScreen';
import LogEditor from './src/LogEditor';
import ReportScreen from './src/ReportScreen';
import {HealthScreen, LogDetails, months, OptionEditor, SettingsScreen, YearScreen, type OptionCategory} from './src/DiaryScreens';
import {createLog, defaultOptions, logTitles, migrateEntries, parseDiary, parseOptions, saveLog, type DiaryOptions, type Log, type LogKind} from './src/diary';
import {localDate, parseBackup} from './src/model';
import {accent, RoundButton, Row, styles as ui, usePalette} from './src/ui';

const DIARY_KEY = 'endo-companion-diary-v2';
const OPTIONS_KEY = 'endo-companion-options-v2';
const PREVIOUS_KEY = 'endo-companion-v1';

const tabs = [['Today', '▦'], ['Year', '▤'], ['Health', '♡'], ['Settings', '⚙']] as const;
type Tab = typeof tabs[number][0];
type Screen = {kind: 'add' | 'month' | 'filter' | 'report' | 'appearance'}
  | {kind: 'edit' | 'details'; log: Log}
  | {kind: 'options'; category: OptionCategory};
const choices: [LogKind, string][] = [
  ['pain', 'Log Pain'], ['period', 'Log Period'], ['food', 'Log Food'],
  ['bowel', 'Log Bowel Movement'], ['heat', 'Log Heating Pad'], ['tens', 'Log TENS'],
];

function parseImport(raw: string): Log[] {
  const value: unknown = JSON.parse(raw);
  if (value && typeof value === 'object' && 'logs' in value) {
    return parseDiary(JSON.stringify(value.logs));
  }
  return migrateEntries(parseBackup(raw));
}

function flash(title: string, message: string) {
  if (Platform.OS === 'web') globalThis.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
}

export default function App() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [options, setOptions] = useState(defaultOptions);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [tab, setTab] = useState<Tab>('Today');
  const [date, setDate] = useState(localDate);
  const [month, setMonth] = useState(() => new Date());
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [screen, setScreen] = useState<Screen | null>(null);
  const [filter, setFilter] = useState<LogKind[]>([]);
  const [busy, setBusy] = useState(false);
  const writing = useRef(false);
  const colors = usePalette(options.theme);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const raw = await AsyncStorage.getItem(DIARY_KEY);
        const storedOptions = await AsyncStorage.getItem(OPTIONS_KEY);
        const previous = raw === null ? await AsyncStorage.getItem(PREVIOUS_KEY) : null;
        const loaded = raw !== null ? parseDiary(raw) : previous ? migrateEntries(parseBackup(previous)) : [];
        if (!active) return;
        setLogs(loaded);
        if (storedOptions) setOptions(parseOptions(storedOptions));
        setStatus('ready');
      } catch {
        if (active) setStatus('error');
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  function selectDate(value: string) {
    setDate(value);
    setMonth(new Date(value + 'T12:00:00'));
  }

  function openMonth(selectedYear: number, selectedMonth: number) {
    const first = new Date(selectedYear, selectedMonth, 1);
    setMonth(first);
    setDate(localDate(first) <= localDate() ? localDate(first) : localDate());
    setScreen(null);
    setTab('Today');
  }

  function openEditor(kind: LogKind) {
    const existing = kind === 'note' && logs.find(log => log.kind === kind && log.date === date);
    setScreen({kind: 'edit', log: existing || createLog(kind, date)});
  }

  async function persist(next: Log[]) {
    if (writing.current) throw new Error('Diary is busy');
    writing.current = true;
    try {
      await AsyncStorage.setItem(DIARY_KEY, JSON.stringify(next));
      setLogs(next);
    } finally {
      writing.current = false;
    }
  }

  async function commit(log: Log) {
    await persist(saveLog(logs, log));
    selectDate(log.date);
    setTab('Today');
    setScreen(null);
  }

  function remove(log: Log) {
    async function discard() {
      try {
        await persist(logs.filter(item => item.id !== log.id));
        setScreen(null);
      } catch {
        flash('Could not delete the log', 'Try again.');
      }
    }
    if (Platform.OS === 'web') {
      if (globalThis.confirm('Delete this log?')) void discard();
    } else {
      Alert.alert('Delete this log?', 'This cannot be undone.', [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', style: 'destructive', onPress: discard},
      ]);
    }
  }

  async function storeOptions(next: DiaryOptions) {
    try {
      await AsyncStorage.setItem(OPTIONS_KEY, JSON.stringify(next));
      setOptions(next);
    } catch {
      flash('Could not save settings', 'Try again.');
    }
  }

  async function backup() {
    if (busy) return;
    setBusy(true);
    try {
      const name = 'endolog-diary-' + localDate() + '.json';
      const raw = JSON.stringify({version: 2, logs}, null, 2);
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([raw], {type: 'application/json'}));
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        const file = new File(Paths.cache, name);
        file.write(raw);
        await Sharing.shareAsync(file.uri, {mimeType: 'application/json', UTI: 'public.json'});
      }
    } catch {
      flash('Could not export the diary', 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    if (busy) return;
    setBusy(true);
    try {
      const selected = await DocumentPicker.getDocumentAsync({type: 'application/json', copyToCacheDirectory: true});
      if (selected.canceled) return;
      const {uri} = selected.assets[0];
      const raw = Platform.OS === 'web' ? await (await fetch(uri)).text() : await new File(uri).text();
      const incoming = parseImport(raw);
      await persist(incoming.reduce(saveLog, logs));
      flash('Diary imported', `${incoming.length} logs imported.`);
    } catch {
      flash('Could not import the diary', 'Choose a valid diary backup and try again.');
    } finally {
      setBusy(false);
    }
  }

  function close() { setScreen(null); }
  function report() { setScreen({kind: 'report'}); }
  function detail(log: Log) { setScreen({kind: 'details', log}); }

  const pageStyle = [ui.safe, {backgroundColor: colors.bg}];
  const dark = colors.bg === '#18181d';
  const statusBar = <StatusBar style={dark ? 'light' : 'dark'} />;
  if (status !== 'ready') return (
    <SafeAreaView style={pageStyle}>{statusBar}
      {status === 'loading' ? <ActivityIndicator accessibilityLabel="Loading diary" />
        : <Text style={[ui.content, {color: colors.ink}]}>Could not open your saved diary. Restart the app and try again.</Text>}
    </SafeAreaView>
  );

  if (screen?.kind === 'edit') return (
    <SafeAreaView style={pageStyle}>{statusBar}
      <LogEditor key={screen.log.id} log={screen.log} options={options} onSave={commit} onClose={close} />
    </SafeAreaView>
  );
  if (screen?.kind === 'report') return (
    <SafeAreaView style={pageStyle}>{statusBar}
      <ReportScreen logs={logs} onClose={close} />
    </SafeAreaView>
  );
  if (screen?.kind === 'details') {
    const {log} = screen;
    return <SafeAreaView style={pageStyle}>{statusBar}
      <View style={styles.back}><RoundButton label="Back" icon="‹" onPress={close} colors={colors} /></View>
      <LogDetails log={log} colors={colors} edit={() => setScreen({kind: 'edit', log})} remove={() => remove(log)} />
    </SafeAreaView>;
  }

  if (screen) return (
    <SafeAreaView style={pageStyle}>{statusBar}
      <View style={styles.back}><RoundButton label="Back" icon="‹" onPress={close} colors={colors} /></View>
      <ScrollView keyboardShouldPersistTaps="handled">
        {screen.kind === 'options' && <OptionEditor category={screen.category} items={options[screen.category]} colors={colors}
          onChange={items => storeOptions({...options, [screen.category]: items})} />}
        {screen.kind === 'appearance' && <View style={ui.content}>
          <Text style={[ui.heading, {color: colors.ink}]}>Appearance</Text>
          <View style={[ui.card, {backgroundColor: colors.card}]}>
            {(['system', 'light', 'dark'] as const).map(theme =>
              <Row key={theme} label={theme[0].toUpperCase() + theme.slice(1)} value={options.theme === theme ? '✓' : undefined}
                colors={colors} onPress={() => storeOptions({...options, theme})} />
            )}
          </View>
        </View>}
        {screen.kind === 'add' && <View style={ui.content}>
          <Text style={[ui.heading, {color: colors.ink}]}>Add Log</Text>
          <View style={[ui.card, {backgroundColor: colors.card}]}>
            {choices.map(([kind, label]) => <Row key={kind} label={label} colors={colors} onPress={() => openEditor(kind)} />)}
            <Row label="Daily Note" colors={colors} onPress={() => openEditor('note')} />
          </View>
        </View>}
        {screen.kind === 'month' && <View style={ui.content}>
          <View style={ui.split}>
            <RoundButton label="Previous year" icon="‹" onPress={() => setYear(year - 1)} colors={colors} />
            <Text style={[ui.heading, {color: colors.ink}]}>{year}</Text>
            <RoundButton label="Next year" icon="›" onPress={() => setYear(year + 1)} colors={colors} />
          </View>
          <View style={[ui.card, {backgroundColor: colors.card}]}>
            {months.map((name, index) => <Row key={name} label={name} colors={colors} onPress={() => openMonth(year, index)} />)}
          </View>
        </View>}
        {screen.kind === 'filter' && <View style={ui.content}>
          <Text style={[ui.heading, {color: colors.ink}]}>Filter Logs</Text>
          <View style={[ui.card, {backgroundColor: colors.card}]}>
            <Row label="All logs" colors={colors} value={filter.length ? undefined : '✓'} onPress={() => setFilter([])} />
            {(Object.keys(logTitles) as LogKind[]).map(kind =>
              <Row key={kind} label={logTitles[kind]} colors={colors} value={filter.includes(kind) ? '✓' : undefined}
                onPress={() => setFilter(current => current.includes(kind) ? current.filter(item => item !== kind) : [...current, kind])} />
            )}
          </View>
          <Pressable accessibilityRole="button" style={ui.button} onPress={close}><Text style={ui.buttonText}>Done</Text></Pressable>
        </View>}
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={pageStyle}>{statusBar}
      <View style={ui.flex}>
      <ScrollView style={ui.flex} contentContainerStyle={[styles.content, tab === 'Today' && styles.todayContent]}>
        {tab === 'Today' && <TodayScreen date={date} logs={logs} visibleKinds={filter} month={month} colors={colors}
          selectDate={selectDate} openMonth={() => { setYear(month.getFullYear()); setScreen({kind: 'month'}); }}
          openReport={report} openNote={() => openEditor('note')}
          openLog={detail} openFilter={() => setScreen({kind: 'filter'})} />}
        {tab === 'Year' && <YearScreen year={year} logs={logs} colors={colors} changeYear={setYear} openMonth={openMonth} />}
        {tab === 'Health' && <HealthScreen logs={logs} colors={colors} openReport={report} openLog={detail} />}
        {tab === 'Settings' && <SettingsScreen options={options} colors={colors} openReport={report} backup={backup} restore={restore}
          showOptions={category => setScreen({kind: 'options', category})} showAppearance={() => setScreen({kind: 'appearance'})} />}
      </ScrollView>
      {tab === 'Today' && <View pointerEvents="box-none" style={styles.floating}>
        <Pressable accessibilityRole="button" accessibilityLabel="Add log" onPress={() => setScreen({kind: 'add'})}
          style={[styles.add, {backgroundColor: colors.card, borderColor: colors.edge}]}>
          <Text style={styles.plus}>+</Text>
        </Pressable>
      </View>}
      </View>
      <View style={[styles.tabs, {backgroundColor: colors.card, borderColor: colors.edge}]}>
        {tabs.map(([name, icon]) => (
          <Pressable key={name} accessibilityRole="tab" accessibilityState={{selected: name === tab}}
            style={[styles.tab, name === tab && {backgroundColor: colors.edge}]} onPress={() => setTab(name)}>
            <Text style={[styles.tabIcon, {color: name === tab ? accent : colors.ink}]}>{icon}</Text>
            <Text style={[styles.tabText, {color: name === tab ? accent : colors.ink}]}>{name}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {flexGrow: 1, width: '100%', maxWidth: 700, alignSelf: 'center'},
  todayContent: {paddingBottom: 76},
  floating: {position: 'absolute', width: '100%', maxWidth: 700, alignSelf: 'center', bottom: 8, paddingRight: 16, alignItems: 'flex-end'},
  add: {width: 56, height: 56, borderRadius: 28, borderWidth: 1, justifyContent: 'center', alignItems: 'center'},
  plus: {color: accent, fontSize: 34, lineHeight: 38, fontWeight: '500'},
  back: {paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start'},
  tabs: {marginHorizontal: 20, marginVertical: 6, borderRadius: 40, borderWidth: 1, padding: 3, flexDirection: 'row'},
  tab: {flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 34, paddingVertical: 6, minHeight: 48},
  tabIcon: {fontSize: 23, lineHeight: 25, fontWeight: '600'},
  tabText: {fontSize: 11, fontWeight: '600', paddingTop: 2},
});
