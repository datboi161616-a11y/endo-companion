import {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from './i18n';
import Svg, {Path} from 'react-native-svg';
import {bodyRegions, toggleBodyRegion, type BodySide} from './bodyRegions';

export default function BodyMap({selected, onChange, colors, readOnly = false}: {
  readOnly?: boolean; selected: string[]; onChange: (values: string[]) => void;
  colors: {ink: string; muted: string; card: string; well: string};
}) {
  const {t} = useTranslation();
  const [side, setSide] = useState<BodySide>('front');
  const regions = bodyRegions.filter(region => region.side === side);
  return <View style={[styles.card, {backgroundColor: colors.card}]}>
    <View style={[styles.tabs, {backgroundColor: colors.well}]}>
      {(['front', 'back'] as const).map(value => <Pressable key={value} accessibilityRole="tab"
        accessibilityState={{selected: side === value}} onPress={() => setSide(value)}
        style={[styles.tab, side === value && {backgroundColor: colors.card}]}>
        <Text style={{color: colors.ink, fontWeight: '600'}}>{t(value === 'front' ? 'Front' : 'Back')}</Text>
      </Pressable>)}
    </View>
    <Text style={[styles.hint, {color: colors.muted}]}>{t(readOnly ? 'Recorded pain locations' : 'Tap the areas where you feel pain')}</Text>
    <Svg width="100%" height={330} viewBox="0 0 200 370">
      {regions.map(region => <Path key={region.name} d={region.path}
        fill={selected.includes(region.name) ? '#ee668b' : '#e4dfdb'} stroke={selected.includes(region.name) ? '#c83e65' : '#b9b0aa'}
        strokeWidth={1.3} accessibilityLabel={region.name}
        onPress={readOnly ? undefined : () => onChange(toggleBodyRegion(selected, region.name))} />)}
    </Svg>
    {!readOnly && <View style={styles.choices}>{regions.map(region => <Pressable key={region.name} accessibilityRole="button"
      accessibilityState={{selected: selected.includes(region.name)}} onPress={() => onChange(toggleBodyRegion(selected, region.name))}
      style={[styles.choice, {backgroundColor: selected.includes(region.name) ? '#f9d6e1' : colors.well}]}>
      <Text style={{color: selected.includes(region.name) ? '#6b1632' : colors.ink, fontSize: 12}}>{t(region.name)}</Text>
    </Pressable>)}</View>}
  </View>;
}
const styles = StyleSheet.create({
  card: {borderRadius: 22, padding: 16, gap: 12}, tabs: {flexDirection: 'row', borderRadius: 24, padding: 4, alignSelf: 'center'},
  tab: {paddingVertical: 10, paddingHorizontal: 30, borderRadius: 20}, hint: {textAlign: 'center', fontSize: 13},
  choices: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center'}, choice: {paddingHorizontal: 11, paddingVertical: 10, borderRadius: 18},
});
