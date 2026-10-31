import { useEffect, useState } from 'react';
import { StatusBar, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { M0CameraScreen } from './src/screens/M0CameraScreen';
import { clearPreviousSession } from './src/platform/files/drafts';
import { clearExpiredSharedPhotos } from './src/platform/files/sharedPhotos';
import { FilterFavoritesProvider } from './src/screens/FilterFavorites';
import { cameraTheme as theme } from './src/screens/cameraTheme';
export default function App() {
  const [startup, setStartup] = useState<'loading' | 'ready' | 'failed'>('loading');
  useEffect(() => {
    try { clearPreviousSession(); clearExpiredSharedPhotos(); setStartup('ready'); }
    catch { setStartup('failed'); }
  }, []);
  return <SafeAreaProvider><SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    <StatusBar barStyle="dark-content" />
    {startup === 'ready' ? <FilterFavoritesProvider><M0CameraScreen /></FilterFavoritesProvider> : <Text style={{ color: theme.text, padding: 24 }}>
      {startup === 'loading' ? '카메라 준비 중' : '임시 저장 공간을 준비하지 못했어요. 공간을 확보하고 앱을 다시 열어 주세요.'}
    </Text>}
  </SafeAreaView></SafeAreaProvider>;
}
