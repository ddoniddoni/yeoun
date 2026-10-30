import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraIcon, type CameraIconName } from './CameraIcon';
import { cameraTheme as theme } from './cameraTheme';

export function CameraAction({ label, accessibilityLabel, onPress, disabled = false, primary = false, icon }: {
  label: string; accessibilityLabel?: string; onPress(): void; disabled?: boolean; primary?: boolean; icon?: CameraIconName;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.action, primary && styles.primary, pressed && styles.pressed, disabled && styles.disabled]}>
    {icon ? <CameraIcon name={icon} size={20} color={primary ? theme.background : theme.text} /> : null}
    <Text style={[styles.actionText, primary && styles.primaryText]}>{label}</Text>
  </Pressable>;
}

export function IconButton({ icon, label, hint, onPress, disabled = false, selected = false, badge }: {
  icon: CameraIconName; label: string; hint?: string; onPress(): void;
  disabled?: boolean; selected?: boolean; badge?: string;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint}
    accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.iconButton, selected && styles.iconSelected,
      pressed && styles.pressed, disabled && styles.disabled]}>
    <CameraIcon name={icon} color={selected ? theme.light : theme.text} />
    {badge ? <Text style={styles.iconBadge}>{badge}</Text> : null}
  </Pressable>;
}

export function ShutterButton({ disabled, busy, onPress }: { disabled: boolean; busy: boolean; onPress(): void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={busy ? '사진 처리 중' : '사진 촬영'}
    accessibilityState={{ disabled, busy }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.shutterRing, pressed && styles.pressed, disabled && styles.disabled]}>
    <View style={styles.shutterCore}>{busy ? <ActivityIndicator color={theme.background} /> : null}</View>
  </Pressable>;
}

// Frame boundaries only: these do not imply autofocus or a level sensor.
export function FrameCorners() {
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    <View style={[styles.corner, styles.topLeft]} /><View style={[styles.corner, styles.topRight]} />
    <View style={[styles.corner, styles.bottomLeft]} /><View style={[styles.corner, styles.bottomRight]} />
  </View>;
}

const styles = StyleSheet.create({
  action: { minHeight: 48, minWidth: 48, paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.line,
    backgroundColor: theme.surface, borderRadius: 14 },
  actionText: { color: theme.text, fontSize: 15, fontWeight: '600', textAlign: 'center', flexShrink: 1 },
  primary: { backgroundColor: theme.text, borderColor: theme.text },
  primaryText: { color: theme.background, fontWeight: '600' },
  pressed: { opacity: 0.7 }, disabled: { opacity: 0.4 },
  shutterRing: { width: 80, height: 80, borderRadius: 28, borderWidth: 1,
    borderColor: theme.secondary, alignItems: 'center', justifyContent: 'center' },
  shutterCore: { width: 66, height: 66, borderRadius: 22, borderWidth: 2, borderColor: '#D8D5CE', backgroundColor: theme.text,
    alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  iconSelected: { backgroundColor: theme.surface },
  iconBadge: { position: 'absolute', right: 2, top: 2, color: theme.light, fontSize: 10, fontWeight: '700' },
  corner: { position: 'absolute', width: 14, height: 14, borderColor: theme.text, opacity: 0.75 },
  topLeft: { top: 10, left: 10, borderTopWidth: 1, borderLeftWidth: 1 },
  topRight: { top: 10, right: 10, borderTopWidth: 1, borderRightWidth: 1 },
  bottomLeft: { bottom: 10, left: 10, borderBottomWidth: 1, borderLeftWidth: 1 },
  bottomRight: { bottom: 10, right: 10, borderBottomWidth: 1, borderRightWidth: 1 },
});
