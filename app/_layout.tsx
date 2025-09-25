import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { NavigationWrapper } from '@/components/NavigationWrapper';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <NavigationWrapper>
        <View style={styles.container}>
          <View style={styles.statusBarSpace} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="(doctor)" />
            <Stack.Screen name="(patient)" />

            {/* Hidden screens - now outside tabs */}
            <Stack.Screen name="sos" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="records" />

            <Stack.Screen name="+not-found" />
          </Stack>
        </View>
        <StatusBar style="dark" backgroundColor="#000000" />
      </NavigationWrapper>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  statusBarSpace: {
    height: 44, // Standard status bar height for most devices
    backgroundColor: '#000000',
  },
});
