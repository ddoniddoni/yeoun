import { StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { EditRecoveryGate } from './src/screens/EditRecoveryGate';
import { ThemeProvider, useCameraTheme } from './src/screens/ThemeProvider';
export default function App() {
  return <SafeAreaProvider><ThemeProvider><AppContent /></ThemeProvider></SafeAreaProvider>;
}
function AppContent() {
  const theme = useCameraTheme();
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
    <EditRecoveryGate />
  </SafeAreaView>;
}
