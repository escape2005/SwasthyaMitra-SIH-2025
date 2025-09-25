import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, FileText, Menu, Home } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export function NavigationBubble() {
  const [isExpanded, setIsExpanded] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const toggleExpansion = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);

    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const navigateToProfile = () => {
    router.push('/profile');
    toggleExpansion();
  };

  const navigateToRecords = () => {
    router.push('/records');
    toggleExpansion();
  };

  const navigateToToday = () => {
    router.push('/(patient)/today');
    toggleExpansion();
  };

  const bubbleScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const bubbleTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  const profileOpacity = animation;
  const profileTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 70],
  });

  const recordsOpacity = animation;
  const recordsTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 130],
  });

  const todayOpacity = animation;
  const todayTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 190],
  });

  return (
    <View style={styles.container}>
      {/* Records Button */}
      <Animated.View
        style={[
          styles.navButton,
          {
            opacity: recordsOpacity,
            transform: [
              { translateY: recordsTranslateY },
              { scale: animation.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
            ],
          },
        ]}
      >
        <TouchableOpacity style={styles.button} onPress={navigateToRecords}>
          <FileText color="#FFFFFF" size={20} />
        </TouchableOpacity>
      </Animated.View>

      {/* Profile Button */}
      <Animated.View
        style={[
          styles.navButton,
          {
            opacity: profileOpacity,
            transform: [
              { translateY: profileTranslateY },
              { scale: animation.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
            ],
          },
        ]}
      >
        <TouchableOpacity style={styles.button} onPress={navigateToProfile}>
          <User color="#FFFFFF" size={20} />
        </TouchableOpacity>
      </Animated.View>

      {/* Today Button */}
      <Animated.View
        style={[
          styles.navButton,
          {
            opacity: todayOpacity,
            transform: [
              { translateY: todayTranslateY },
              { scale: animation.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
            ],
          },
        ]}
      >
        <TouchableOpacity style={styles.button} onPress={navigateToToday}>
          <Home color="#FFFFFF" size={20} />
        </TouchableOpacity>
      </Animated.View>

      {/* Main Bubble */}
      <Animated.View
        style={[
          styles.mainBubble,
          {
            transform: [
              { scale: bubbleScale },
              { translateY: bubbleTranslateY },
            ],
          },
        ]}
      >
        <TouchableOpacity style={styles.mainButton} onPress={toggleExpansion}>
          <Menu color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    top: 100, // Top leftish
    zIndex: 1000,
  },
  mainBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  button: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
