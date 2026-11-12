import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {supportedLanguages, useTranslation} from './i18n';

export default function LanguageScreen({value, onChange, onClose}: {
  value: string; onChange: (value: string) => void; onClose: () => void;
}) {
  const {t} = useTranslation();
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" onPress={onClose} style={styles.back}>
      <Text style={styles.backText}>‹  {t('Back')}</Text>
    </Pressable>
    <Text accessibilityRole="header" style={styles.title}>{t('Language')}</Text>
    <View style={styles.card}>
      {supportedLanguages.map(({code, name}, index) => <Pressable key={code}
        accessibilityRole="radio" accessibilityState={{selected: value === code}}
        onPress={() => onChange(code)} style={[styles.row, index > 0 && styles.separator]}>
        <Text style={styles.name}>{name}</Text>
        {value === code && <Text style={styles.check}>✓</Text>}
      </Pressable>)}
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f0f0f5'},
  content: {width: '100%', maxWidth: 680, alignSelf: 'center', padding: 18, gap: 16},
  back: {minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start'},
  backText: {color: '#b51d4e', fontSize: 17, fontWeight: '600'},
  title: {fontSize: 32, fontWeight: '700', color: '#111b22'},
  card: {backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden'},
  row: {minHeight: 56, paddingHorizontal: 18, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  separator: {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#dedee5'},
  name: {fontSize: 17, color: '#111b22'},
  check: {fontSize: 22, color: '#b51d4e', fontWeight: '700'},
});
