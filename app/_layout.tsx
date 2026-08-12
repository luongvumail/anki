import { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Image, Animated } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Colors } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';
import { OfflineBanner } from '../components/ui/OfflineBanner';

export default function RootLayout() {
  const setUserId = useStore(s => s.setUserId);
  const [showSplash, setShowSplash] = useState(true);
  
  // Animation refs
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;

  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const startTime = Date.now();

    // 1. Start intro logo animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 30,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Listen to authentication state changes
    const unsub = onAuthStateChanged(auth, async (user) => {
      const isLoggingIn = prevUserIdRef.current === null && user !== null;
      const isLoggingOut = prevUserIdRef.current !== null && prevUserIdRef.current !== undefined && user === null;

      prevUserIdRef.current = user ? user.uid : null;

      if (isLoggingIn || isLoggingOut) {
        // Ensure splash is visible and reset animation values during auth transitions
        setShowSplash(true);
        splashOpacity.setValue(1);
        logoOpacity.setValue(1);
        logoScale.setValue(1);
      }

      if (user) {
        setUserId(user.uid);
        try {
          // Pre-fetch decks and user progress (XP, badges) inside RootLayout
          await Promise.all([
            useStore.getState().fetchDecks(),
            useStore.getState().fetchUserProgress(),
          ]);
        } catch (e) {
          console.warn("[RootLayout] Initial data fetch failed:", e);
        }
        router.replace('/(tabs)');
      } else {
        setUserId(null);
        router.replace('/auth');
      }

      if (isLoggingOut) {
        // Fast fade-out transition on logout
        setTimeout(() => {
          Animated.timing(splashOpacity, {
            toValue: 0,
            duration: APP_CONFIG.LOGOUT_FADE_MS,
            useNativeDriver: true,
          }).start(() => {
            setShowSplash(false);
          });
        }, APP_CONFIG.LOGOUT_SPLASH_DELAY_MS);
      } else {
        // Guarantee minimum splash display duration
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, APP_CONFIG.SPLASH_MIN_DISPLAY_MS - elapsed);

        setTimeout(() => {
          Animated.timing(splashOpacity, {
            toValue: 0,
            duration: APP_CONFIG.SPLASH_FADE_MS,
            useNativeDriver: true,
          }).start(() => {
            setShowSplash(false);
          });
        }, remainingTime);
      }
    });

    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <OfflineBanner />
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.duolingo.bg },
            animation: "fade",
          }}
        >
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="study/[deckId]"
            options={{
              presentation: 'fullScreenModal',
              contentStyle: { backgroundColor: Colors.bg.primary },
            }}
          />
          <Stack.Screen name="deck/[id]" />
          <Stack.Screen name="card/[id]" />
        </Stack>

        {showSplash && (
          <Animated.View style={[styles.splashOverlay, { opacity: splashOpacity }]} pointerEvents="none">
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                },
              ]}
            >
              <View style={styles.glowRing}>
                <View style={styles.appIconBox}>
                  <Image
                    source={require('../assets/adaptive-icon.png')}
                    style={styles.appIconImage}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  splashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    width: 106,
    height: 106,
    borderRadius: 28,
    backgroundColor: Colors.accent.indigoDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(94, 106, 210, 0.25)',
    // Soft shadow for native platforms supporting it
    shadowColor: Colors.accent.indigo,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
  },
  appIconBox: {
    width: 86,
    height: 86,
    borderRadius: 22,
    overflow: 'hidden',
  },
  appIconImage: {
    width: 86,
    height: 86,
  },
});
