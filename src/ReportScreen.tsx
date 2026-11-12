import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { isLocalDate, logTitles, type Log } from './diary';
import { localDate } from './model';
import { buildReport, createReportPdf, type ReportRange } from './report';

type Props = { logs: Log[]; onClose: () => void };

function recentRange(days: number): ReportRange {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return { start: localDate(start), end: localDate(end) };
}

export default function ReportScreen({ logs, onClose }: Props) {
  const [range, setRange] = useState<ReportRange>({ start: '', end: '' });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const { start, end } = range;
  const error = (start && !isLocalDate(start)) || (end && !isLocalDate(end))
    ? 'Enter dates in YYYY-MM-DD format.'
    : start && end && start > end ? 'Choose an end date on or after the start date.' : '';
  const report = useMemo(() => buildReport(logs, range, logTitles), [logs, range]);

  async function exportPdf() {
    if (error || exporting) return;
    setExporting(true);
    setExportError('');
    try {
      const bytes = createReportPdf(report);
      const filename = 'endometriosis-diary-report.pdf';
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        if (!await Sharing.isAvailableAsync()) {
          setExportError('PDF sharing is unavailable on this device.');
          return;
        }
        const file = new File(Paths.cache, filename);
        file.write(bytes);
        try {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'application/pdf',
            UTI: 'com.adobe.pdf',
            dialogTitle: 'Export diary report',
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
          <Text style={styles.closeText}>‹  Back</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>Report</Text>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Date range</Text>
          <View style={styles.presets}>
            <Pressable accessibilityRole="button" onPress={() => setRange({ start: '', end: '' })} style={styles.preset}>
              <Text style={styles.presetText}>All dates</Text>
            </Pressable>
            {[30, 90].map((days) => (
              <Pressable key={days} accessibilityRole="button" onPress={() => setRange(recentRange(days))} style={styles.preset}>
                <Text style={styles.presetText}>Last {days} days</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.dates}>
            {(['start', 'end'] as const).map((field) => {
              const label = field === 'start' ? 'Start date' : 'End date';
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
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        </View>

        <Text accessibilityRole="header" style={styles.previewTitle}>Preview</Text>
        {!error && report.map(({ title, blocks }) => (
          <View key={title} style={styles.card}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
            {blocks.map(({ heading, lines }, index) => (
              <View key={index} style={index > 0 && styles.entry}>
                {heading ? <Text style={styles.entryHeading}>{heading}</Text> : null}
                {lines.map((line, lineIndex) => <Text key={lineIndex} style={styles.body}>{line}</Text>)}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        {exportError ? <Text accessibilityRole="alert" style={styles.error}>{exportError}</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !!error || exporting, busy: exporting }}
          disabled={!!error || exporting}
          onPress={exportPdf}
          style={[styles.exportButton, (!!error || exporting) && styles.disabled]}
        >
          <Text style={styles.exportText}>{exporting ? 'Exporting…' : 'Export PDF'}</Text>
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
