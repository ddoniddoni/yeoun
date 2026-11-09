import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraIcon, type CameraIconName } from './CameraIcon';
import { useCameraTheme, createThemedStyles } from './ThemeProvider';

export function CameraAction({ label, accessibilityLabel, onPress, disabled = false, primary = false, icon }: {
  label: string; accessibilityLabel?: string; onPress(): void; disabled?: boolean; primary?: boolean; icon?: CameraIconName;
}) {
  const theme = useCameraTheme();
  const styles = useStyles();
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.action, primary && styles.primary, pressed && styles.pressed, disabled && styles.disabled]}>
    {icon ? <CameraIcon name={icon} size={20} color={primary ? theme.onAccent : theme.text} /> : null}
    <Text style={[styles.actionText, primary && styles.primaryText]}>{label}</Text>
  </Pressable>;
}

export function IconButton({ icon, label, hint, onPress, disabled = false, selected = false, badge }: {
  icon: CameraIconName; label: string; hint?: string; onPress(): void;
  disabled?: boolean; selected?: boolean; badge?: string;
}) {
  const theme = useCameraTheme();
  const styles = useStyles();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint}
    accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.iconButton, selected && styles.iconSelected,
      pressed && styles.pressed, disabled && styles.disabled]}>
    <CameraIcon name={icon} color={selected ? theme.accent : theme.text} />
    {badge ? <Text style={styles.iconBadge}>{badge}</Text> : null}
  </Pressable>;
}

export function ShutterButton({ status, onPress }: {
  status: 'ready' | 'preparing' | 'unavailable' | 'processing'; onPress(): void;
}) {
  const theme = useCameraTheme();
  const styles = useStyles();
  const disabled = status !== 'ready';
  const busy = status === 'processing';
  // Preparing a selected look must block capture without changing the shutter's appearance.
  return <Pressable accessibilityRole="button" accessibilityLabel={busy ? '사진 처리 중' : status === 'preparing' ? '색감 준비 중' : '사진 촬영'}
    accessibilityState={{ disabled, busy: busy || status === 'preparing' }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.shutterRing, pressed && styles.pressed, (status === 'unavailable' || busy) && styles.disabled]}>
    <View style={styles.shutterCore}>{busy ? <ActivityIndicator color={theme.onShutter} /> : null}</View>
  </Pressable>;
}

// Frame boundaries only: these do not imply autofocus or a level sensor.
export function FrameCorners() {
  const styles = useStyles();
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    <View style={[styles.corner, styles.topLeft]} /><View style={[styles.corner, styles.topRight]} />
    <View style={[styles.corner, styles.bottomLeft]} /><View style={[styles.corner, styles.bottomRight]} />
  </View>;
}

const useStyles = createThemedStyles(theme => StyleSheet.create({
  action: { minHeight: 48, minWidth: 48, paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.line,
    backgroundColor: theme.surface, borderRadius: theme.controlRadius },
  actionText: { color: theme.text, fontSize: 15, fontWeight: '500', textAlign: 'center', flexShrink: 1 },
  primary: { backgroundColor: theme.accent, borderColor: theme.accent },
  primaryText: { color: theme.onAccent, fontWeight: '600' },
  pressed: { opacity: 0.7 }, disabled: { opacity: 0.4 },
  shutterRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 2,
    backgroundColor: theme.surface, borderColor: theme.accent, alignItems: 'center', justifyContent: 'center' },
  shutterCore: { width: 66, height: 66, borderRadius: 33, borderWidth: 2, borderColor: theme.surface, backgroundColor: theme.shutter,
    alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: 48, height: 48, borderRadius: theme.controlRadius, alignItems: 'center', justifyContent: 'center' },
  iconSelected: { backgroundColor: theme.accentSoft },
  iconBadge: { position: 'absolute', right: 2, top: 2, color: theme.accent, fontSize: 12, fontWeight: '600' },
  corner: { position: 'absolute', width: 14, height: 14, borderColor: theme.onPhoto, opacity: 0.75 },
  topLeft: { top: 10, left: 10, borderTopWidth: 1, borderLeftWidth: 1 },
  topRight: { top: 10, right: 10, borderTopWidth: 1, borderRightWidth: 1 },
  bottomLeft: { bottom: 10, left: 10, borderBottomWidth: 1, borderLeftWidth: 1 },
  bottomRight: { bottom: 10, right: 10, borderBottomWidth: 1, borderRightWidth: 1 },
}));
