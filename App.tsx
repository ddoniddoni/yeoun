import { StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { EditRecoveryGate } from './src/screens/EditRecoveryGate';
import { cameraTheme as theme } from './src/screens/cameraTheme';
export default function App() {
  return <SafeAreaProvider><SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    <StatusBar barStyle="dark-content" />
    <EditRecoveryGate />
  </SafeAreaView></SafeAreaProvider>;
}
