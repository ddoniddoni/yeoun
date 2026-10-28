import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cameraTheme as theme } from './cameraTheme';

/** A control surface over the live preview; it never owns or restarts the camera. */
export function CameraSheet({ title, children, onClose }: {
  title: string; children: ReactNode; onClose(): void;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
    <View style={styles.overlay}>
      <Pressable accessible={false} importantForAccessibility="no" style={StyleSheet.absoluteFill} onPress={onClose} />
      <View accessibilityViewIsModal style={[styles.sheet, {
        maxHeight: height - insets.top - 32, paddingBottom: Math.max(insets.bottom, 16),
        paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20),
      }]}>
        <View style={styles.handle} />
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`${title} 닫기`} onPress={onClose}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
            <Text style={styles.closeText}>닫기 ×</Text>
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>{children}</ScrollView>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { width: '100%', backgroundColor: theme.surface, borderTopWidth: 1, borderColor: theme.line,
    borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  handle: { alignSelf: 'center', width: 32, height: 3, backgroundColor: theme.line, marginTop: 10, borderRadius: 2 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 8 },
  title: { color: theme.text, fontSize: 20, fontWeight: '600', flexShrink: 1 },
  close: { minWidth: 56, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  closeText: { color: theme.secondary, fontSize: 14 }, content: { gap: 20, paddingBottom: 12 },
  pressed: { opacity: 0.6 },
});
