// components/ScreenWrapper.tsx
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';

type ScreenWrapperProps = React.PropsWithChildren<{
  scrollable?: boolean;
}>;

export default function ScreenWrapper({ children, scrollable = true }: ScreenWrapperProps) {
  const Container = scrollable ? ScrollView : View;

  return (
    <Container
      style={styles.container}
      contentContainerStyle={scrollable ? styles.contentContainer : undefined}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // or your default bg
  },
  contentContainer: {
    paddingBottom: 110, // ≈ height of your floating nav bar
  },
});
