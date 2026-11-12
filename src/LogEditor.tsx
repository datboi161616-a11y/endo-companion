import { useRef, useState, type ReactNode } from 'react';
import {
  Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View, useColorScheme,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { isLocalDate, logTitles, type DiaryOptions, type Log } from './diary';

const questions = {
  pain: ['When did you feel pain?', 'Where did it hurt?', 'How did it hurt?', 'How painful is it?', 'Any other symptoms?', 'Anything else?'],
  food: ['When did you eat?', 'What did you eat?', 'What did you notice after?'],
  bowel: ['Bowel movement'],
  period: ['Did you have flow?'],
  heat: ['Heating pad session'],
  tens: ['TENS session'],
  note: ['Daily note'],
};

const painDescriptions = [
  'Pain free', 'Very minor annoyance', 'Minor annoyance',
  'Annoying enough to be distracting', 'Can be ignored when focused',
  'Can’t be ignored for more than 30 minutes', 'Can’t be ignored for any length of time',
  'Makes it difficult to concentrate or sleep', 'Physical activity severely limited',
  'Unable to do most activities', 'Worst pain imaginable',
];
const painColors = ['#25825d', '#2d9561', '#639e38', '#98b42d', '#d8b735', '#eda52b', '#f58b21', '#ec651e', '#e44430', '#d82a32', '#b92635'];
const bristolOptions = [
  ['Severe constipation', 'Separate hard lumps', '•••'],
  ['Mild constipation', 'Lumpy sausage', '●●'],
  ['Normal', 'Sausage with surface cracks', '▬'],
  ['Normal', 'Smooth, soft snake', '━'],
  ['Lacking fibre', 'Soft blobs with clear edges', '••'],
  ['Diarrhea', 'Fluffy pieces, mushy', '≈'],
  ['Severe diarrhea', 'Watery, no solid pieces', '≋'],
];
const timeOptions = ['Morning', 'Afternoon', 'Evening', 'Night'];

export default function LogEditor({ log, options, onSave, onClose }: {
  log: Log;
  options: DiaryOptions;
  onSave: (log: Log) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(log);
  const [step, setStep] = useState(0);
  const [editingDate, setEditingDate] = useState(false);
  const [showScale, setShowScale] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const scheme = useColorScheme();
  const dark = options.theme === 'dark' || (options.theme === 'system' && scheme === 'dark');
  const colors = dark
    ? { canvas: '#211f26', card: '#2f2b35', well: '#3b3643', ink: '#f8f6fb', muted: '#c9c1ce', accent: '#f46c96' }
    : { canvas: '#f1eff5', card: '#ffffff', well: '#f1eff5', ink: '#211d29', muted: '#665e70', accent: '#eb4678' };

  const { kind, fields } = draft;
  const pages = questions[kind];
  const last = step === pages.length - 1;
  const green = kind === 'pain' || kind === 'food';
  const selectedColor = green ? '#c5e679' : colors.accent;
  const selectedText = green ? '#253911' : '#25121a';

  function setField(key: string, value: Log['fields'][string]) {
    setDraft(current => ({ ...current, fields: { ...current.fields, [key]: value } }));
    setError('');
  }

  function setMeta<K extends 'date' | 'time' | 'notes' | 'attachment'>(key: K, value: Log[K]) {
    setDraft(current => ({ ...current, [key]: value }));
    setError('');
  }

  function card(label: string, children: ReactNode) {
    return <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      {children}
    </View>;
  }

  function input(label: string, value: string, onChangeText: (value: string) => void, multiline = false, numeric = false) {
    return <TextInput
      accessibilityLabel={label}
      style={[styles.input, multiline && styles.multiline, { color: colors.ink, backgroundColor: colors.well }]}
      placeholder={label}
      placeholderTextColor={colors.muted}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      inputMode={numeric ? 'numeric' : undefined}
      autoCapitalize={multiline ? 'sentences' : 'none'}
    />;
  }

  function button(label: string, action: () => void) {
    return <Pressable accessibilityRole="button" onPress={action} style={[styles.chip, { backgroundColor: colors.well }]}>
      <Text style={[styles.buttonText, { color: colors.ink }]}>{label}</Text>
    </Pressable>;
  }

  function choices(key: string, label: string, available: readonly string[], multi = false, rows = false) {
    const previous = fields[key];
    const selected = Array.isArray(previous) ? previous : typeof previous === 'string' && previous ? [previous] : [];
    const values = Array.from(new Set([...available, ...selected]));
    return card(label, <View style={rows ? styles.stack : styles.chips}>
      {values.map(value => {
        const active = selected.includes(value);
        return <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: active }}
          onPress={() => setField(key, multi
            ? active ? selected.filter(item => item !== value) : [...selected, value]
            : active ? '' : value)}
          style={[styles.chip, rows && styles.choiceRow, { backgroundColor: active ? selectedColor : colors.well }]}>
          <Text style={[styles.buttonText, { color: active ? selectedText : colors.ink }]}>
            {key === 'flow' ? (value === 'No Flow' ? '⊖   ' : '♦   ') : ''}{value}
          </Text>
        </Pressable>;
      })}
      {values.length === 0 && <Text style={{ color: colors.muted }}>Add options in Settings.</Text>}
    </View>);
  }

  function dateTime() {
    return card('Date and time', <View style={styles.stack}>
      <Text style={{ color: colors.muted }}>Use YYYY-MM-DD and 24-hour HH:MM.</Text>
      <View style={styles.row}>
        <View style={styles.flex}>{input('YYYY-MM-DD', draft.date, value => setMeta('date', value))}</View>
        <View style={styles.flex}>{input('HH:MM', draft.time, value => setMeta('time', value))}</View>
      </View>
    </View>);
  }

  function notes() {
    return card('Add note', input('Add any additional notes…', draft.notes, value => setMeta('notes', value), true));
  }

  async function addPhoto() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*', copyToCacheDirectory: true, base64: Platform.OS === 'web',
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const data = Platform.OS === 'web' ? asset.base64 : await new File(asset.uri).base64();
      if (!data) throw new Error('Photo data unavailable');
      setMeta('attachment', data.startsWith('data:') ? data : 'data:' + (asset.mimeType || 'image/jpeg') + ';base64,' + data);
    } catch {
      setError('Could not add this photo.');
    }
  }

  function painScale() {
    const value = typeof fields.intensity === 'number' ? Math.min(10, Math.max(0, Math.round(fields.intensity))) : 0;
    return <View style={styles.scale}>
      <View style={[styles.circle, { backgroundColor: painColors[value] }]}><Text style={styles.score}>{value}</Text></View>
      <Text style={[styles.scaleDescription, { color: colors.ink }]}>{painDescriptions[value]}</Text>
      <View style={styles.scaleBar}>
        {painColors.map((color, score) => <Pressable key={color}
          accessibilityRole="button" accessibilityLabel={'Pain ' + score + ' of 10'}
          accessibilityState={{ selected: score === value }}
          style={[styles.scaleCell, { backgroundColor: color }, score === value && styles.activeScore]}
          onPress={() => setField('intensity', score)}
        ><Text style={styles.scaleNumber}>{score}</Text></Pressable>)}
      </View>
      <View style={[styles.spread, { alignSelf: 'stretch' }]}>
        <Text style={[styles.label, { color: colors.ink }]}>Normal</Text>
        <Text style={[styles.label, { color: colors.ink }]}>Very painful</Text>
      </View>
      {button('View pain scale', () => setShowScale(true))}
    </View>;
  }

  function bristol() {
    return card('Bristol stool type', <View style={styles.stack}>
      {bristolOptions.map(([label, description, glyph], index) => {
        const active = String(fields.bristolType) === String(index + 1);
        return <Pressable key={index} accessibilityRole="button" accessibilityState={{ selected: active }}
          accessibilityLabel={['Type ' + (index + 1), label, description].join(', ')}
          onPress={() => setField('bristolType', index + 1)}
          style={[styles.bristol, { backgroundColor: active ? selectedColor : colors.well }]}>
          <Text style={styles.bristolIcon}>{glyph}</Text>
          <View style={styles.flex}>
            <View style={[styles.row, styles.wrap]}>
              <Text style={[styles.buttonText, { color: active ? selectedText : colors.ink }]}>{label}</Text>
              <Text style={[styles.typeTag, { backgroundColor: index === 2 || index === 3 ? '#dcf4d9' : '#f9dedb' }]}>Type {index + 1}</Text>
            </View>
            <Text style={{ color: active ? selectedText : colors.muted }}>{description}</Text>
          </View>
        </Pressable>;
      })}
    </View>);
  }

  function content() {
    switch (kind) {
      case 'pain':
        return [
          () => choices('timeOfDay', 'Time of day', timeOptions),
          () => choices('locations', 'Pain locations', options.locations, true),
          () => choices('descriptors', 'Pain descriptors', options.descriptors, true),
          painScale,
          () => choices('symptoms', 'Symptoms', options.symptoms, true),
          () => <>{choices('medications', 'Treatments or medications', options.medications, true)}{notes()}</>,
        ][step]();
      case 'food':
        return [
          () => choices('timeOfDay', 'Time of day', timeOptions),
          () => <>{choices('foods', 'Food and drinks', options.food, true)}
            {card('Meal details', input('Describe your meal', String(fields.meal ?? ''), value => setField('meal', value), true))}
            {card('Photo', <View style={styles.stack}>
              {draft.attachment && <Image source={{ uri: draft.attachment }} style={styles.photo} accessibilityLabel="Meal photo" />}
              <View style={styles.chips}>
                {button(draft.attachment ? 'Replace photo' : 'Add a photo', addPhoto)}
                {draft.attachment && button('Remove photo', () => setMeta('attachment', undefined))}
              </View>
            </View>)}
          </>,
          () => <>{choices('feeling', 'How you felt', ['Good', 'Okay', 'Uncomfortable', 'Very uncomfortable'])}
            {choices('symptoms', 'Symptoms', options.symptoms, true)}{notes()}</>,
        ][step]();
      case 'bowel':
        return <>{bristol()}{choices('urgency', 'Urgency', ['None', 'Mild', 'Moderate', 'Urgent'])}
          {choices('pain', 'Pain', ['None', 'Mild', 'Moderate', 'Severe'])}{notes()}</>;
      case 'period':
        return <>{choices('flow', 'Flow level', ['No Flow', 'Spotting', 'Light', 'Medium', 'Heavy'], false, true)}{notes()}</>;
      case 'heat':
      case 'tens':
        return <>{card('Session details', <View style={styles.stack}>
          {input('Duration in minutes', String(fields.duration ?? ''), value => setField('duration', value), false, true)}
          {input(kind === 'tens' ? 'Electrode placement' : 'Heating pad placement',
            String(fields.placement ?? ''), value => setField('placement', value))}
          {input(kind === 'tens' ? 'Intensity or setting' : 'Heat setting', String(fields.setting ?? ''), value => setField('setting', value))}
        </View>)}
          {choices('relief', 'Relief', ['None', 'A little', 'Moderate', 'A lot', 'Complete'])}{notes()}</>;
      case 'note':
        return notes();
    }
  }

  async function next() {
    if (!last) {
      if (kind === 'pain' && step === 3 && fields.intensity === undefined) setField('intensity', 0);
      setStep(step + 1);
      return;
    }
    if (saveLock.current) return;
    if (!isLocalDate(draft.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)) {
      setEditingDate(true);
      setError('Enter a valid date and time.');
      return;
    }
    if (kind === 'bowel' && !bristolOptions[Number(fields.bristolType) - 1]) {
      setError('Choose a Bristol type to save this entry.');
      return;
    }
    if (kind === 'period' && !fields.flow) {
      setError('Choose a flow level to save this entry.');
      return;
    }
    if ((kind === 'heat' || kind === 'tens') && fields.duration &&
        (!/^\d+$/.test(String(fields.duration)) || Number(fields.duration) < 1 || !Number.isSafeInteger(Number(fields.duration)))) {
      setError('Enter a whole number of minutes greater than zero.');
      return;
    }
    if (kind === 'note' && !draft.notes.trim()) {
      setError('Add a note to save this entry.');
      return;
    }

    setSaving(true);
    saveLock.current = true;
    setError('');
    try {
      await onSave(draft);
    } catch {
      setError('Could not save this entry. Please try again.');
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    style={[styles.flex, { backgroundColor: colors.canvas }, green && !dark && styles.gradient]}>
    <View style={styles.editor}>
      <View style={styles.toolbar}>
        {step > 0
          ? <Pressable accessibilityRole="button" accessibilityLabel="Previous step" style={[styles.round, { backgroundColor: colors.card }]}
              onPress={() => { setStep(step - 1); setError(''); }}>
              <Text style={[styles.toolbarIcon, { color: colors.ink }]}>‹</Text>
            </Pressable>
          : <View style={styles.round} />}
        <Pressable accessibilityRole="button" accessibilityLabel="Edit date and time" style={[styles.chip, { backgroundColor: colors.card }]}
          onPress={() => setEditingDate(value => !value)}>
          <Text style={[styles.buttonText, { color: colors.ink }]}>{draft.date}  ·  {draft.time}  ⌄</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Close editor" style={[styles.round, { backgroundColor: colors.card }]}
          disabled={saving} onPress={onClose}>
          <Text style={[styles.toolbarIcon, { color: colors.ink }]}>×</Text>
        </Pressable>
      </View>
      <ScrollView key={step} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {editingDate && dateTime()}
        {pages.length > 1 && <Text style={[styles.progress, { color: colors.ink }]}>{logTitles[kind]} · {step + 1} of {pages.length}</Text>}
        <Text accessibilityRole="header" style={[styles.heading, { color: colors.ink }]}>{pages[step]}</Text>
        {content()}
      </ScrollView>
      <View style={styles.footer}>
        {!!error && <Text accessibilityRole="alert" style={[styles.error, { color: dark ? '#ffb7c7' : '#891733' }]}>{error}</Text>}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving }}
          disabled={saving} onPress={next} style={[styles.primary, { backgroundColor: green ? '#285922' : '#cc285d' }]}>
          <Text style={styles.primaryText}>{saving ? 'Saving…' : last ? 'Save' : 'Next'}</Text>
        </Pressable>
      </View>
    </View>
    <Modal visible={showScale} animationType="slide" onRequestClose={() => setShowScale(false)}>
      <View style={[styles.flex, styles.modal, { backgroundColor: colors.card }]}>
        <View style={styles.spread}>
          <Text accessibilityRole="header" style={[styles.heading, { color: colors.ink }]}>The Pain Scale</Text>
          {button('Close', () => setShowScale(false))}
        </View>
        <ScrollView>
          {painDescriptions.map((description, value) => <View key={value} style={[styles.bristol, { borderBottomWidth: 1, borderColor: colors.well }]}>
            <View style={[styles.round, { backgroundColor: painColors[value] }]}><Text style={styles.scaleNumber}>{value}</Text></View>
            <Text style={[styles.flex, styles.buttonText, { color: colors.ink }]}>{description}</Text>
          </View>)}
        </ScrollView>
      </View>
    </Modal>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  editor: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: 600 },
  gradient: { backgroundColor: '#e2f7b2', experimental_backgroundImage: 'linear-gradient(180deg, #edfbcf 0%, #c9ec82 54%, #a9dd58 100%)' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 14 },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18, gap: 8 },
  round: { height: 42, width: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  toolbarIcon: { fontSize: 26, lineHeight: 30, fontWeight: '500' },
  progress: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  heading: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  card: { padding: 14, borderRadius: 20, gap: 9 },
  label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  input: { borderRadius: 13, padding: 12, fontSize: 15, minHeight: 46 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrap: { flexWrap: 'wrap' },
  spread: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stack: { gap: 7 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderRadius: 20, minHeight: 42, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  choiceRow: { borderRadius: 12 },
  buttonText: { fontSize: 14, fontWeight: '700' },
  primary: { minHeight: 49, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  error: { fontSize: 14, fontWeight: '600' },
  bristol: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 10, borderRadius: 13 },
  bristolIcon: { color: '#943b46', minWidth: 28, textAlign: 'center', fontSize: 19, fontWeight: '800' },
  typeTag: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10, fontWeight: '700', color: '#452e37', borderRadius: 8 },
  photo: { width: '100%', aspectRatio: 1.6, borderRadius: 14 },
  scale: { alignItems: 'center', gap: 16, paddingVertical: 10 },
  circle: { width: 145, height: 145, borderRadius: 80, justifyContent: 'center', alignItems: 'center' },
  score: { fontSize: 60, fontWeight: '800', color: 'white' },
  scaleDescription: { fontSize: 17, textAlign: 'center', fontWeight: '700', minHeight: 42 },
  scaleBar: { flexDirection: 'row', alignSelf: 'stretch', borderRadius: 12, overflow: 'hidden' },
  scaleCell: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  activeScore: { borderWidth: 2, borderColor: '#fff', borderRadius: 7 },
  scaleNumber: { color: 'white', fontSize: 12, fontWeight: '800', textShadowColor: '#2a3229', textShadowRadius: 2 },
  modal: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 64 : 30, gap: 14 },
});
