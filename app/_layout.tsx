import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/lib/auth';
import { TemaProvider, useTema } from '@/lib/tema';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Con sesión → mapa; sin sesión → pantallas de bienvenida/login/registro.
function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const screen = segments[1] as string | undefined;
    const enPublica = !screen || screen === 'index' || screen === 'login' || screen === 'registro';
    const destino = session && enPublica ? '/(tabs)/mapa' : !session && !enPublica ? '/' : null;
    if (!destino) return;

    // Si la sesión ya está lista al montar, el navegador puede no estarlo todavía: se reintenta.
    let temporizador: ReturnType<typeof setTimeout>;
    const intentar = (n = 0) => {
      try {
        router.replace(destino);
      } catch {
        if (n < 40) temporizador = setTimeout(() => intentar(n + 1), 50);
      }
    };
    intentar();
    return () => clearTimeout(temporizador);
  }, [session, loading, segments, router]);

  return null;
}

export default function RootLayout() {
  return (
    <TemaProvider>
      <RootNavigation />
    </TemaProvider>
  );
}

function RootNavigation() {
  const { colores } = useTema();

  return (
    <ThemeProvider value={colores.oscuro ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        {/* Después del Stack: sus efectos deben correr cuando el navegador ya está montado. */}
        <AuthGate />
      </AuthProvider>
      <StatusBar style={colores.oscuro ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
