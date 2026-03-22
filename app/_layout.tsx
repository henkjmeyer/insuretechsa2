import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Redirect, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import 'react-native-url-polyfill/auto'
import 'react-native-reanimated'

import { AuthProvider, useAuth } from '@/context/auth-context'
import { Colors } from '@/constants/theme'

const InsureTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.accent,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
  },
}

function RootNavigator() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    )
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      {!session && <Redirect href="/(auth)/login" />}
      {session && <Redirect href="/(tabs)" />}
      <StatusBar style="light" />
    </>
  )
}

export default function RootLayout() {
  return (
    <ThemeProvider value={InsureTheme}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  )
}
