import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { M0CameraScreen } from './src/screens/M0CameraScreen';
import { clearPreviousSession } from './src/platform/files/drafts';
export default function App() {
  const [startup, setStartup] = useState<'loading' | 'ready' | 'failed'>('loading');
  useEffect(() => {
    try { clearPreviousSession(); setStartup('ready'); }
    catch { setStartup('failed'); }
  }, []);
  return <SafeAreaProvider><SafeAreaView style={{ flex: 1, backgroundColor: '#171717' }}>
    {startup === 'ready' ? <M0CameraScreen /> : <Text style={{ color: 'white', padding: 24 }}>
      {startup === 'loading' ? '카메라 준비 중' : '임시 저장 공간을 준비하지 못했어요. 공간을 확보하고 앱을 다시 열어 주세요.'}
    </Text>}
  </SafeAreaView></SafeAreaProvider>;
}
