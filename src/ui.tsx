import React from 'react';
import {Pressable, StyleSheet, Text, View, useColorScheme} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {useTranslation} from './i18n';
import type {DiaryOptions} from './diary';

const iconNames = {
  '▦': 'calendar-outline', '▤': 'apps-outline', '♡': 'heart-outline', '⚙': 'settings-outline',
  '↗': 'share-social-outline', '✎': 'create-outline', '☷': 'options-outline',
  '‹': 'chevron-back', '›': 'chevron-forward', '+': 'add', '×': 'close', '⌄': 'chevron-down',
} as const;

export function Icon({symbol, size = 22, color}: {symbol: string; size?: number; color: string}) {
  const name = iconNames[symbol as keyof typeof iconNames] ?? 'ellipse-outline';
  return <Ionicons name={name} size={size} color={color} />;
}

export const accent = '#ef416e';
export const light = {bg: '#f0f0f5', card: '#ffffff', ink: '#111b22', muted: '#85858e', edge: '#dcdce2'};
export type Palette = typeof light;

export function usePalette(theme: DiaryOptions['theme']): Palette {
  const system = useColorScheme();
  return (theme === 'system' ? system : theme) === 'dark'
    ? {bg: '#18181d', card: '#26262d', ink: '#fafafa', muted: '#aeafb7', edge: '#3f3f48'}
    : light;
}

export function RoundButton({label, icon, onPress, colors, highlighted = false}: {
  label: string;
  icon: string;
  onPress: () => void;
  colors: Palette;
  highlighted?: boolean;
}) {
  const {t} = useTranslation();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t(label)} onPress={onPress}
      style={[styles.round, {backgroundColor: colors.card, borderColor: colors.edge}]}>
      <Icon symbol={icon} color={highlighted ? accent : colors.muted} />
    </Pressable>
  );
}

export function Row({label, value, onPress, colors, danger = false}: {
  label: string; value?: string; onPress?: () => void; colors: Palette; danger?: boolean;
}) {
  const {t} = useTranslation();
  const content = <><Text style={[styles.rowLabel, {color: danger ? accent : colors.ink}]}>{t(label)}</Text>
    {!!value && <Text style={{color: colors.muted, flexShrink: 1, textAlign: 'right'}}>{value}</Text>}
    {!!onPress && <Text style={{color: colors.muted, fontSize: 22}}>›</Text>}</>;
  const rowStyle = [styles.row, {borderBottomColor: colors.edge}];
  return onPress
    ? <Pressable style={rowStyle} onPress={onPress} accessibilityRole="button" accessibilityLabel={t(label)}>{content}</Pressable>
    : <View style={rowStyle}>{content}</View>;
}

export const styles = StyleSheet.create({
  safe: {flex: 1},
  flex: {flex: 1},
  content: {padding: 16, paddingBottom: 28, gap: 14},
  title: {fontSize: 32, fontWeight: '800'},
  heading: {fontSize: 23, fontWeight: '700'},
  caption: {fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: 8, marginTop: 8},
  card: {borderRadius: 18, overflow: 'hidden'},
  round: {width: 38, height: 38, borderRadius: 19, borderWidth: 1, justifyContent: 'center', alignItems: 'center'},
  symbol: {fontSize: 22, fontWeight: '600'},
  row: {paddingHorizontal: 16, paddingVertical: 12, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth},
  rowLabel: {fontSize: 16, flex: 1, fontWeight: '500'},
  split: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
  button: {borderRadius: 16, padding: 14, backgroundColor: accent, alignItems: 'center'},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '700'},
});
