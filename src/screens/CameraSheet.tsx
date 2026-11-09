import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from './CameraControls';
import { cameraTheme as theme } from './cameraTheme';

/** A control surface over the live preview; it never owns or restarts the camera. */
export function CameraSheet({ title, children, onClose }: {
  title: string; children: ReactNode; onClose(): void;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable accessible={false} importantForAccessibility="no" style={StyleSheet.absoluteFill} onPress={onClose} />
      <View accessibilityViewIsModal style={[styles.sheet, {
        maxHeight: height - insets.top - 32, paddingBottom: Math.max(insets.bottom, 16),
        paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20),
      }]}>
        <View style={styles.handle} />
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <IconButton icon="close" label={`${title} 닫기`} onPress={onClose} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
          contentContainerStyle={styles.content}>{children}</ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.scrim },
  sheet: { width: '100%', flexShrink: 1, backgroundColor: theme.surface, borderTopWidth: 1, borderColor: theme.line,
    borderTopLeftRadius: theme.panelRadius, borderTopRightRadius: theme.panelRadius },
  handle: { alignSelf: 'center', width: 36, height: 4, backgroundColor: theme.line, marginTop: 12, borderRadius: 2 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 12 },
  title: { color: theme.text, fontSize: 22, fontWeight: '600', flexShrink: 1 },
  content: { gap: 20, paddingBottom: 12 },
});
