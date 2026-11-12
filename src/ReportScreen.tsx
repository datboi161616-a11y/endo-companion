import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { File } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { isLocalDate, logTitles, type Log } from './diary';
import { useTranslation } from './i18n';
import { localDate } from './model';
import { buildReport, createReportHtml, type ReportRange } from './report';

type Props = { logs: Log[]; onClose: () => void };

function recentRange(days: number): ReportRange {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return { start: localDate(start), end: localDate(end) };
}

export default function ReportScreen({ logs, onClose }: Props) {
  const { t } = useTranslation();
  const [range, setRange] = useState<ReportRange>({ start: '', end: '' });
  const [patient, setPatient] = useState({ name: '', dob: '' });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const { start, end } = range;
  const error = patient.dob && !isLocalDate(patient.dob) ? 'Enter date of birth in YYYY-MM-DD format.' : (start && !isLocalDate(start)) || (end && !isLocalDate(end))
    ? 'Enter dates in YYYY-MM-DD format.'
    : start && end && start > end ? 'Choose an end date on or after the start date.' : '';
  const report = useMemo(() => buildReport(logs, range, logTitles, patient), [logs, range, patient]);

  async function exportPdf() {
    if (error || exporting) return;
    setExporting(true);
    setExportError('');
    try {
      const html = createReportHtml(report);
      if (Platform.OS === 'web') {
        const frame = document.createElement('iframe');
        frame.style.position = 'fixed'; frame.style.width = '1px'; frame.style.height = '1px'; frame.style.border = '0';
        document.body.appendChild(frame);
        await new Promise<void>((resolve, reject) => {
          frame.onload = () => {
            if (!frame.contentWindow) { frame.remove(); reject(new Error('Print window unavailable')); return; }
            frame.contentWindow.focus();
            frame.contentWindow.print();
            setTimeout(() => frame.remove(), 60000);
            resolve();
          };
          frame.srcdoc = html;
        });
      } else {
        if (!await Sharing.isAvailableAsync()) {
          setExportError('PDF sharing is unavailable on this device.');
          return;
        }
        const result = await Print.printToFileAsync({ html });
        const file = new File(result.uri);
        try {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'application/pdf',
            UTI: 'com.adobe.pdf',
            dialogTitle: t('Export diary report'),
          });
        } finally {
          if (file.exists) file.delete();
        }
      }
    } catch {
      setExportError('The PDF could not be exported. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>{t('‹  Back')}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>{t('Report')}</Text>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>{t('Patient information')}</Text>
          <Text style={styles.body}>{t('Optional details included only in this report.')}</Text>
          <Text style={styles.label}>{t('Name')}</Text>
          <TextInput accessibilityLabel={t('Patient name')} style={styles.input} placeholder={t('Name (optional)')} value={patient.name} onChangeText={name => setPatient(previous => ({ ...previous, name }))} />
          <Text style={styles.label}>{t('Date of birth')}</Text>
          <TextInput accessibilityLabel={t('Date of birth')} style={styles.input} placeholder={t('YYYY-MM-DD (optional)')} value={patient.dob} maxLength={10} onChangeText={dob => setPatient(previous => ({ ...previous, dob: dob.trim() }))} />
        </View>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>{t('Date range')}</Text>
          <View style={styles.presets}>
            <Pressable accessibilityRole="button" onPress={() => setRange({ start: '', end: '' })} style={styles.preset}>
              <Text style={styles.presetText}>{t('All dates')}</Text>
            </Pressable>
            {[30, 90].map((days) => (
              <Pressable key={days} accessibilityRole="button" onPress={() => setRange(recentRange(days))} style={styles.preset}>
                <Text style={styles.presetText}>{t(`Last ${days} days`)}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.dates}>
            {(['start', 'end'] as const).map((field) => {
              const label = t(field === 'start' ? 'Start date' : 'End date');
              return (
                <View key={field} style={styles.date}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput
                    accessibilityLabel={label}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={10}
                    onChangeText={(value) => setRange((previous) => ({ ...previous, [field]: value.trim() }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#60626b"
                    style={styles.input}
                    value={range[field]}
                  />
                </View>
              );
            })}
          </View>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{t(error)}</Text> : null}
        </View>

        <Text accessibilityRole="header" style={styles.previewTitle}>{t('Preview')}</Text>
        {!error && report.map(({ title, blocks, trend }) => (
          <View key={title} style={styles.card}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{t(title)}</Text>
            {trend && trend.length > 0 ? <View>
              <Text style={styles.entryHeading}>{t('Pain intensity over time')}</Text>
              <Text style={styles.body}>{t('Daily averages · 0–10')}</Text>
              {trend.map(point => <View key={point.date} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 3 }}>
                <Text style={{ width: 85, fontSize: 12, color: '#555' }}>{point.date}</Text>
                <View style={{ flex: 1, backgroundColor: point.period ? '#ffe1e8' : '#eee', height: 10, borderRadius: 5 }}><View style={{ width: `${point.pain * 10}%`, backgroundColor: '#e85d80', height: 10, borderRadius: 5 }} /></View>
                <Text style={{ width: 30, fontSize: 12 }}>{point.pain}</Text>
              </View>)}
              <Text style={styles.body}>{t('Pink background: logged period day. Missing days have no score.')}</Text>
            </View> : null}
            {blocks.map(({ heading, lines }, index) => (
              <View key={index} style={index > 0 && styles.entry}>
                {heading ? <Text style={styles.entryHeading}>{t(heading)}</Text> : null}
                {lines.map((line, lineIndex) => <Text key={lineIndex} style={styles.body}>{line}</Text>)}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        {exportError ? <Text accessibilityRole="alert" style={styles.error}>{t(exportError)}</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !!error || exporting, busy: exporting }}
          disabled={!!error || exporting}
          onPress={exportPdf}
          style={[styles.exportButton, (!!error || exporting) && styles.disabled]}
        >
          <Text style={styles.exportText}>{t(exporting ? 'Exporting…' : Platform.OS === 'web' ? 'Print / Save PDF' : 'Export PDF')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f0f0f5' },
  scroll: { flex: 1 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: 18, paddingBottom: 32, gap: 12 },
  close: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  closeText: { color: '#b51d4e', fontSize: 17, fontWeight: '600' },
  title: { color: '#111b22', fontSize: 32, fontWeight: '700' },
  previewTitle: { color: '#111b22', fontSize: 21, fontWeight: '700', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 8 },
  sectionTitle: { color: '#111b22', fontSize: 17, fontWeight: '700' },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: { minHeight: 44, backgroundColor: '#fce7ee', borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center' },
  presetText: { color: '#97163f', fontSize: 14, fontWeight: '600' },
  dates: { flexDirection: 'row', gap: 12 },
  date: { flex: 1 },
  label: { color: '#313740', fontSize: 13, marginBottom: 4, fontWeight: '600' },
  input: { minHeight: 44, paddingHorizontal: 10, color: '#111b22', backgroundColor: '#f0f0f5', borderRadius: 9 },
  body: { color: '#313740', fontSize: 14, lineHeight: 21 },
  entry: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#dbdbe3', paddingTop: 8 },
  entryHeading: { color: '#111b22', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  error: { color: '#a21e41', fontSize: 14, lineHeight: 20 },
  footer: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 10, gap: 8 },
  exportButton: { minHeight: 50, backgroundColor: '#ef416e', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.55 },
  exportText: { color: '#25101a', fontSize: 16, fontWeight: '700' },
});
