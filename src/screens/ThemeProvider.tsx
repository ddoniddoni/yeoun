import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { AppearanceStore, resolveAppearance } from '../domain/settings/appearance';
import { appearanceRepository } from '../storage/appearanceRepository';
import { lightTheme, darkTheme, type CameraTheme } from './cameraTheme';

const ThemeContext = createContext<CameraTheme>(lightTheme);
const AppearanceContext = createContext<AppearanceStore | null>(null);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new AppearanceStore(appearanceRepository));
  // Only the preference changes this provider; saving/error state stays in settings.
  const preference = useSyncExternalStore(store.subscribe, store.getPreference, store.getPreference);
  const system = useColorScheme();
  useEffect(() => { void store.load(); }, [store]);
  useEffect(() => {
    Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  }, [preference]);
  const theme = resolveAppearance(preference, system) === 'dark' ? darkTheme : lightTheme;
  return <AppearanceContext.Provider value={store}><ThemeContext.Provider value={theme}>
    {children}
  </ThemeContext.Provider></AppearanceContext.Provider>;
}
export function useCameraTheme(): CameraTheme { return useContext(ThemeContext); }
export function useAppearanceStore(): AppearanceStore {
  const store = useContext(AppearanceContext);
  if (!store) throw new Error('ThemeProvider is missing');
  return store;
}
/** Styles are built once per palette, not on every camera frame or render. */
export function createThemedStyles<T>(create: (theme: CameraTheme) => T): () => T {
  const light = create(lightTheme), dark = create(darkTheme);
  return function useStyles() { return useCameraTheme().dark ? dark : light; };
}
