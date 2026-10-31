import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { CaptureState, Output } from '../domain/capture/controller';
import { initialComparison, updateComparison } from '../domain/filters/previewComparison';
import { CameraAction, FrameCorners } from './CameraControls';
import { CameraIcon } from './CameraIcon';
import { cameraTheme as theme } from './cameraTheme';

export function ResultPhotoComparison({ output, state, width, enabled, locked, filterName, onPrepare }: {
  output: Output; state: CaptureState; width: number; enabled: boolean; locked: boolean;
  filterName: string; onPrepare(): void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [imageStatus, setImageStatus] = useState<{ key: string; loaded: boolean }>();
  const imageKey = `${state.original?.uri ?? ''}/${attempt}`;
  const ready = !!state.original && imageStatus?.key === imageKey && imageStatus.loaded;
  const failed = imageStatus?.key === imageKey && !imageStatus.loaded;
  // Changing availability invalidates held/pinned intent immediately, including app background.
  const context = `${output.uri}/${locked}/${ready}/${attempt}`;
  const [comparison, setComparison] = useState(() => initialComparison(context));
  useEffect(() => {
    if (locked) setComparison(initialComparison(context));
  }, [context, locked]);
  const available = enabled && ready && !locked;
  const pinned = available && comparison.context === context && comparison.pinned;
  const active = available && comparison.context === context && (comparison.held || comparison.pinned);
  const change = (action: 'hold' | 'release' | 'toggle') => {
    if (!available && action !== 'release') return;
    setComparison(current => updateComparison(current, context, action));
  };
  return <View style={styles.group}>
    <View accessible accessibilityRole="image"
      accessibilityLabel={active ? '필터 적용 전 원본 비교 사진' : `${filterName} 적용 사진`}
      style={[styles.frame, { width, aspectRatio: output.width / output.height }]}>
      {enabled && state.original ? <Image key={imageKey} source={{ uri: state.original.uri }}
        style={[StyleSheet.absoluteFill, !active && styles.hidden]} resizeMode="contain" resizeMethod="resize" fadeDuration={0} accessible={false}
        onLoad={() => setImageStatus({ key: imageKey, loaded: true })}
        onError={() => setImageStatus({ key: imageKey, loaded: false })} /> : null}
      <Image source={{ uri: output.uri }}
        style={[StyleSheet.absoluteFill, active && styles.hidden]} resizeMode="contain"
        resizeMethod="resize" fadeDuration={0} accessible={false} />
      <FrameCorners />
      {enabled ? <Text style={styles.badge}>{active ? '원본' : '필터 결과'}</Text> : null}
    </View>
    {enabled ? <View style={styles.controls}>
      {!state.original ? <CameraAction
        icon="compare" label={state.preparingOriginal ? '원본 준비 중…' : state.originalError ? '원본 비교 다시 시도' : '원본 비교'}
        disabled={locked} onPress={onPrepare} /> : failed ? <CameraAction label="비교 이미지 다시 열기"
        disabled={locked} onPress={() => setAttempt(value => value + 1)} /> : <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel="누르는 동안 원본 비교"
          accessibilityHint="옆의 원본 유지 스위치로도 비교할 수 있어요."
          disabled={!available || pinned} accessibilityState={{ disabled: !available || pinned }}
          onPressIn={() => change('hold')} onPressOut={() => change('release')}
          style={[styles.button, (!available || pinned) && styles.disabled]}>
          <CameraIcon name="compare" size={20} /><Text style={styles.label}>원본 비교</Text>
        </Pressable>
        <Pressable accessibilityRole="switch" accessibilityLabel="원본 보기 유지"
          accessibilityState={{ checked: pinned, disabled: !available }} disabled={!available}
          onPress={() => change('toggle')} style={[styles.button, styles.pin, pinned && styles.selected, !available && styles.disabled]}>
          <CameraIcon name="pin" size={21} color={pinned ? theme.accent : theme.secondary} />
        </Pressable>
      </View>}
      <Text accessibilityLiveRegion="polite" style={styles.note}>
        {state.originalError ?? (failed ? '비교 이미지를 열지 못했어요. 저장할 사진은 유지돼요.'
          : state.original && !ready ? '비교 이미지를 불러오고 있어요…'
          : active ? '원본 비교 중 · 저장하면 필터 결과가 저장돼요.' : state.original ? '누르는 동안 원본 · 핀을 누르면 비교 유지' : '원본과 같은 구도로 비교할 수 있어요.')}
      </Text>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  group: { gap: 12 }, frame: { alignSelf: 'center', backgroundColor: theme.photoMatte, borderRadius: 18, overflow: 'hidden' },
  hidden: { opacity: 0 }, badge: { position: 'absolute', top: 16, left: 16, color: theme.onPhoto,
    backgroundColor: theme.photoOverlay, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, fontSize: 12 },
  controls: { gap: 8 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 48, minWidth: 48, flexGrow: 1, flexDirection: 'row', gap: 8, padding: 12, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: theme.line, borderRadius: 14 },
  pin: { width: 48, flexGrow: 0 },
  selected: { borderColor: theme.accent, backgroundColor: theme.accentSoft }, disabled: { opacity: 0.4 },
  label: { color: theme.text, fontSize: 13 }, note: { color: theme.secondary, fontSize: 12, lineHeight: 18 },
});
