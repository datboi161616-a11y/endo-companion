import React from 'react';
import {Pressable, StyleSheet, Text, View, useColorScheme} from 'react-native';
import type {DiaryOptions} from './diary';

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
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      style={[styles.round, {backgroundColor: colors.card, borderColor: colors.edge}]}>
      <Text style={[styles.symbol, {color: highlighted ? accent : colors.muted}]}>{icon}</Text>
    </Pressable>
  );
}

export function Row({label, value, onPress, colors, danger = false}: {
  label: string; value?: string; onPress?: () => void; colors: Palette; danger?: boolean;
}) {
  const content = <><Text style={[styles.rowLabel, {color: danger ? accent : colors.ink}]}>{label}</Text>
    {!!value && <Text style={{color: colors.muted, flexShrink: 1, textAlign: 'right'}}>{value}</Text>}
    {!!onPress && <Text style={{color: colors.muted, fontSize: 22}}>›</Text>}</>;
  const rowStyle = [styles.row, {borderBottomColor: colors.edge}];
  return onPress
    ? <Pressable style={rowStyle} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>{content}</Pressable>
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
