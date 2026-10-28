import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cameraTheme as theme } from './cameraTheme';

export function CameraAction({ label, accessibilityLabel, onPress, disabled = false, primary = false }: {
  label: string; accessibilityLabel?: string; onPress(): void; disabled?: boolean; primary?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.action, primary && styles.primary, pressed && styles.pressed, disabled && styles.disabled]}>
    <Text style={[styles.actionText, primary && styles.primaryText]}>{label}</Text>
  </Pressable>;
}

export function ShutterButton({ disabled, busy, onPress }: { disabled: boolean; busy: boolean; onPress(): void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={busy ? '사진 처리 중' : '사진 촬영'}
    accessibilityState={{ disabled, busy }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.shutterRing, pressed && styles.pressed, disabled && styles.disabled]}>
    <View style={styles.shutterCore}>{busy ? <View style={styles.busyMark} /> : null}</View>
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
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.line,
    backgroundColor: theme.surface, borderRadius: 6 },
  actionText: { color: theme.text, fontSize: 15, fontWeight: '500', textAlign: 'center' },
  primary: { backgroundColor: theme.text, borderColor: theme.text },
  primaryText: { color: theme.background, fontWeight: '600' },
  pressed: { opacity: 0.7 }, disabled: { opacity: 0.4 },
  shutterRing: { width: 84, height: 84, borderRadius: 42, borderWidth: 1,
    borderColor: theme.secondary, alignItems: 'center', justifyContent: 'center' },
  shutterCore: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.text,
    alignItems: 'center', justifyContent: 'center' },
  busyMark: { width: 20, height: 20, borderRadius: 4, backgroundColor: theme.background },
  corner: { position: 'absolute', width: 14, height: 14, borderColor: theme.text, opacity: 0.75 },
  topLeft: { top: 10, left: 10, borderTopWidth: 1, borderLeftWidth: 1 },
  topRight: { top: 10, right: 10, borderTopWidth: 1, borderRightWidth: 1 },
  bottomLeft: { bottom: 10, left: 10, borderBottomWidth: 1, borderLeftWidth: 1 },
  bottomRight: { bottom: 10, right: 10, borderBottomWidth: 1, borderRightWidth: 1 },
});
