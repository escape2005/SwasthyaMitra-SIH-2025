import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Stethoscope } from 'lucide-react-native';
import { AuthContext } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const { login, checkPatientOnboarding, user } = useContext(AuthContext);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { width, height } = useWindowDimensions();

 // Responsive calculations
  const isTablet = width >= 768;
  const maxWidth = isTablet ? 400 : width * 0.85;
  const iconSize = Math.min(width * 0.15, 80);
  const titleFontSize = Math.min(width * 0.08, 32);
  const inputFontSize = Math.min(width * 0.042, 16);
  const buttonFontSize = Math.min(width * 0.045, 18);
  const smallTextSize = Math.min(width * 0.035, 14);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(email, password);

      // After successful login, the user object will contain the role from database
      // The AuthContext will handle redirection based on user role
      if (user?.role === 'patient') {
        const onboardingComplete = await checkPatientOnboarding(user.id);
        if (!onboardingComplete) {
          router.replace('/onboarding');
          return;
        }
      }

      // Redirect based on user role from database
      if (user?.role === 'patient') {
        router.replace('/(patient)/today');
      } else if (user?.role === 'doctor') {
        router.replace('/(doctor)/appointments');
      } else {
        router.replace('/');
      }
    } catch (error: any) {
      console.log('Login error:', error);
      Alert.alert('Error', error.message || 'Login failed');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Background Bubbles */}
        <View style={styles.bubblesContainer}>
          <LinearGradient
            colors={['#00B3FF', '#5603BD']}
            style={[styles.topLeftBubble, {
              width: width * 0.6,
              height: width * 0.6,
              top: -width * 0.2,
              left: -width * 0.15,
            }]}
          />
          <LinearGradient
            colors={['#00B3FF', '#5603BD']}
            style={[styles.topRightBubble, {
              width: Math.min(width * 0.25, 120),
              height: Math.min(width * 0.25, 120),
              top: height * 0.12,
              right: width * 0.1,
            }]}
          />
          <LinearGradient
            colors={['#00B3FF', '#5603BD']}
            style={[styles.bottomLeftBubble, {
              width: Math.min(width * 0.2, 100),
              height: Math.min(width * 0.2, 100),
              bottom: height * 0.12,
              left: width * 0.05,
            }]}
          />
          <LinearGradient
            colors={['#00B3FF', '#5603BD']}
            style={[styles.bottomRightBubble, {
              width: width * 0.4,
              height: width * 0.4,
              bottom: -width * 0.1,
              right: -width * 0.1,
            }]}
          />
        </View>

        {/* Main Content Container */}
        <View style={[styles.contentContainer, { maxWidth, alignSelf: 'center' }]}>
          {/* Header Section */}
          <View style={[styles.headerSection, { 
            paddingTop: Math.max(height * 0.12, 60),
            paddingBottom: Math.max(height * 0.08, 40)
          }]}>
            <View style={styles.iconContainer}>
              <Stethoscope 
                size={iconSize} 
                color="#666" 
                strokeWidth={1.5} 
              />
            </View>
            <Text style={[styles.title, { fontSize: titleFontSize }]}>
              Sign In
            </Text>
          </View>

          {/* Form Section */}
          <View style={[styles.formContainer, { 
            paddingTop: Math.max(height * 0.05, 30)
          }]}>
            <View style={[styles.inputContainer, { marginBottom: height * 0.025 }]}>
              <TextInput
                style={[styles.input, { fontSize: inputFontSize }]}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={[styles.inputContainer, { marginBottom: height * 0.04 }]}>
              <TextInput
                style={[styles.input, { fontSize: inputFontSize }]}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff color="#9CA3AF" size={Math.min(width * 0.05, 20)} />
                ) : (
                  <Eye color="#9CA3AF" size={Math.min(width * 0.05, 20)} />
                )}
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity 
              onPress={handleLogin} 
              style={[styles.signInButtonContainer, { marginBottom: height * 0.04 }]}
            >
              <LinearGradient
                colors={['#00B3FF', '#5603BD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.signInButton, { 
                  paddingVertical: Math.max(height * 0.02, 14),
                  paddingHorizontal: Math.max(width * 0.12, 48)
                }]}
              >
                <Text style={[styles.signInButtonText, { fontSize: buttonFontSize }]}>
                  Sign In
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={[styles.divider, { marginVertical: height * 0.03 }]}>
              <LinearGradient 
                colors={['#00B3FF', '#5603BD']} 
                style={styles.dividerLine} 
              />
              <Text style={[styles.dividerText, { fontSize: smallTextSize }]}>
                OR
              </Text>
              <LinearGradient 
                colors={['#00B3FF', '#5603BD']} 
                style={styles.dividerLine} 
              />
            </View>

            {/* Navigate to Sign Up */}
            <TouchableOpacity 
              style={styles.signupButton}
              onPress={() => router.push('/signup')}
            >
              <Text style={[styles.signupButtonText, { 
                fontSize: Math.min(width * 0.04, 16) 
              }]}>
                Don't have an account? Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  flex: {
    flex: 1,
  },
  bubblesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  topLeftBubble: {
    position: 'absolute',
    borderRadius: 200,
    opacity: 0.9,
  },
  topRightBubble: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.8,
  },
  bottomLeftBubble: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.7,
  },
  bottomRightBubble: {
    position: 'absolute',
    borderRadius: 150,
    opacity: 0.6,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  headerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    top: -50,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
  },
  input: {
    flex: 1,
    color: '#1F2937',
    fontWeight: '400',
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 8,
  },
  signInButtonContainer: {
    alignItems: 'center',
    top: -50,
  },
  signInButton: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5603BD',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signInButtonText: {
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    top: -70,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.6,
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  signupButton: {
    paddingVertical: 12,
    alignItems: 'center',
    top: -80,
  },
  signupButtonText: {
    fontWeight: '500',
    textAlign: 'center',
    color: '#070a0bc1',
  },
});