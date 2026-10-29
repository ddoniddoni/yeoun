import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cameraSettings, cameraSettingsKey, copyCameraSettings, type CameraSettings } from '../domain/filters/cameraSettings';
import { CameraAction } from './CameraControls';
import { FilterAdjustmentPanel } from './FilterControls';
import { cameraTheme as theme } from './cameraTheme';

export function ResultFilterEditor({ settings, disabled, applying, error, onApply, onClose }: {
  settings: CameraSettings; disabled: boolean; applying: boolean; error?: string;
  onApply(settings: CameraSettings): Promise<boolean>; onClose(): void;
}) {
  // Unapplied choices stay here. Neither the camera settings nor the accepted output changes.
  const [draft, setDraft] = useState(() => copyCameraSettings(settings));
  const [attempted, setAttempted] = useState(false);
  const submitting = useRef(false);
  const changed = cameraSettingsKey(draft) !== cameraSettingsKey(settings);
  const apply = async () => {
    if (disabled || submitting.current || !changed) return;
    submitting.current = true;
    setAttempted(true);
    try { if (await onApply(draft)) onClose(); }
    finally { submitting.current = false; }
  };
  return <View style={styles.panel}>
    <Text accessibilityRole="header" style={styles.title}>이 순간의 색감 바꾸기</Text>
    <Text style={styles.note}>위 사진은 마지막으로 적용한 모습이에요. 색감을 고른 뒤 적용하면 사진이 바뀌어요.</Text>
    <FilterAdjustmentPanel settings={draft} disabled={disabled}
      onSelect={id => { if (id !== draft.filterId) setDraft(cameraSettings(id)); }}
      onIntensity={intensity => setDraft(current => copyCameraSettings({ ...current, intensity }))}
      onTexture={(control, value) => setDraft(current => copyCameraSettings({ ...current, [control]: value }))}
      onDateStamp={dateStamp => setDraft(current => copyCameraSettings({ ...current, dateStamp }))}
      onReset={() => setDraft(cameraSettings(draft.filterId))} />
    {attempted && error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <Text accessibilityLiveRegion="polite" style={styles.note}>{applying
      ? '원본 사진에 새 색감을 적용하고 있어요…'
      : changed ? '선택한 설정을 적용하면 저장할 사진이 바뀌어요.' : '필터나 조절값을 바꾸어 보세요.'}</Text>
    <CameraAction primary label={applying ? '색감 적용 중…' : attempted && error ? '선택한 색감 다시 적용' : '선택한 색감 적용'}
      disabled={disabled || !changed} onPress={() => { void apply(); }} />
    <CameraAction label="취소 · 현재 사진 유지" disabled={disabled} onPress={onClose} />
  </View>;
}

const styles = StyleSheet.create({
  panel: { gap: 16, padding: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line },
  title: { color: theme.text, fontSize: 17, fontWeight: '500' },
  note: { color: theme.secondary, fontSize: 13, lineHeight: 20 },
  error: { color: theme.error, fontSize: 14, lineHeight: 22 },
});
