import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AppState, Platform, Pressable, Text, View} from 'react-native';
import {AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState} from 'expo-audio';
import {File, Paths} from 'expo-file-system';
import {useTranslation} from './i18n';

type Props = {readOnly?: boolean; onBusyChange?: (busy: boolean) => void; value?: string; onChange: (uri: string | undefined) => void; colors?: {card: string; ink: string; muted: string; accent?: string}};
export default function VoiceNote({value, onChange, readOnly = false, onBusyChange, colors = {card: '#f8f2fa', ink: '#302339', muted: '#807184', accent: '#b06cb6'}}: Props) {
  const {t} = useTranslation();
  const busyChange = useRef(onBusyChange); useLayoutEffect(() => {busyChange.current = onBusyChange;}, [onBusyChange]);
  const finishRef = useRef<() => Promise<void>>(async () => {});
  const recorder = useAudioRecorder(
    {...RecordingPresets.HIGH_QUALITY, bitRate: 32000, numberOfChannels: 1},
    status => {if (status.isFinished) void finishRef.current();},
  );
  const state = useAudioRecorderState(recorder, 250);
  const player = useAudioPlayer(null);
  const playback = useAudioPlayerStatus(player);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const active = useRef(false);
  useEffect(() => {busyChange.current?.(busy || state.isRecording || active.current);}, [busy, state.isRecording]);
  const mounted = useRef(true);
  const changing = useRef(false);
  const change = useRef(onChange); useLayoutEffect(() => {change.current = onChange;}, [onChange]);
  useEffect(() => {
    let cache: File | undefined;
    try {
      player.pause();
      if (value?.startsWith('data:audio/') && Platform.OS !== 'web') {
        const separator = value.indexOf(',');
        const extension = value.startsWith('data:audio/webm') ? 'webm' : value.startsWith('data:audio/ogg') ? 'ogg' : 'm4a';
        cache = new File(Paths.cache, `voice-play-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`);
        cache.write(value.slice(separator + 1), {encoding: 'base64'});
        player.replace(cache.uri);
      } else player.replace(value ?? null);
    } catch {queueMicrotask(() => {if (mounted.current) setMessage('This voice note could not be opened.');});}
    return () => {try {player.pause(); if (cache?.exists) cache.delete();} catch {}};
  }, [value, player]);
  const finish = async () => {
    if (!active.current || changing.current) return;
    changing.current = true; active.current = false; setBusy(true);
    try {
      if (recorder.isRecording) await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw Error('No recording was captured.');
      let data: string;
      if (Platform.OS === 'web') {
        const blob = await (await fetch(uri)).blob();
        data = await new Promise<string>((resolve, reject) => {const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob);});
        if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
      } else {
        const file = new File(uri);
        data = `data:audio/mp4;base64,${await file.base64()}`;
        file.delete();
      }
      if (mounted.current) {change.current(data); setMessage('Voice note ready. Save this log to keep it.');}
    } catch {if (mounted.current) setMessage('Could not save the recording. Please try again.');}
    finally {await setAudioModeAsync({allowsRecording: false}).catch(() => {}); changing.current = false; if (mounted.current) setBusy(false);}
  };
  useLayoutEffect(() => {finishRef.current = finish;});
  useEffect(() => {
    mounted.current = true;
    const listener = AppState.addEventListener('change', next => {if (next !== 'active') {player.pause(); void finishRef.current();}});
    return () => {
      mounted.current = false; busyChange.current?.(false); listener.remove(); active.current = false;
      try {player.pause(); if (recorder.isRecording) void recorder.stop().catch(() => {});} catch {}
      void setAudioModeAsync({allowsRecording: false}).catch(() => {});
    };
  }, [recorder, player]);
  useEffect(() => {if (active.current && state.durationMillis >= 179500) void finishRef.current();}, [state.durationMillis]);
  const start = async () => {
    if (changing.current || readOnly) return;
    changing.current = true; setBusy(true); setMessage('');
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {if (mounted.current) setMessage('Microphone access is off. Allow it in device settings to record a voice note.'); return;}
      if (!mounted.current || AppState.currentState === 'background') return;
      player.pause();
      await setAudioModeAsync({allowsRecording: true, playsInSilentMode: true, shouldPlayInBackground: false});
      await recorder.prepareToRecordAsync();
      if (!mounted.current || AppState.currentState === 'background' || AppState.currentState === 'inactive') {
        await recorder.stop().catch(() => {});
        await setAudioModeAsync({allowsRecording: false});
        return;
      }
      active.current = true; recorder.record({forDuration: 180});
    } catch {active.current = false; if (mounted.current) setMessage('Recording could not start. Check microphone access and try again.'); await setAudioModeAsync({allowsRecording: false}).catch(() => {});}
    finally {changing.current = false; if (mounted.current) setBusy(false);}
  };

  return <View style={{gap: 10}}>
    <Text style={{color: colors.ink, fontWeight: '600'}}>{t('Voice note')}</Text>
    <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
      {!readOnly && <VoiceAction busy={busy} colors={colors} label={state.isRecording ? `■ ${t('Stop recording')} · ${Math.floor(state.durationMillis / 1000)}s` : value ? `● ${t('Replace recording')}` : `● ${t('Start recording')}`} onPress={() => {void (active.current ? finish() : start());}} />}
      {!!value && !state.isRecording && <>
        <VoiceAction busy={busy} colors={colors} label={playback.playing ? t('Pause') : `▶ ${t('Play')}`} onPress={() => {void (async () => {try {if (playback.playing) player.pause(); else {if (playback.didJustFinish || playback.currentTime >= playback.duration) await player.seekTo(0); player.play();}} catch {setMessage('This recording could not be played.');}})();}} />
        {!readOnly && <VoiceAction busy={busy} colors={colors} label={t('Remove')} onPress={() => {player.pause(); onChange(undefined); setMessage('');}} />}
      </>}
    </View>
    <Text accessibilityLiveRegion="polite" style={{fontSize: 12, color: colors.muted}}>{t(message || (state.isRecording ? 'Recording now. Stops automatically at 3 minutes.' : 'Up to 3 minutes. Stored only on this device and in your exported backup.'))}</Text>
  </View>;
}

function VoiceAction({label, onPress, busy, colors}: {label: string; onPress: () => void; busy: boolean; colors: NonNullable<Props['colors']>}) {
  return <Pressable accessibilityRole="button" disabled={busy} onPress={onPress} style={{paddingVertical: 12, paddingHorizontal: 15, borderRadius: 18, backgroundColor: colors.card, opacity: busy ? 0.5 : 1}}><Text style={{color: colors.accent ?? colors.ink, fontWeight: '600'}}>{label}</Text></Pressable>;
}
