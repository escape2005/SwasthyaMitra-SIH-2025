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
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function SignupScreen() {
  const { signup, checkPatientOnboardingComplete } = useContext(AuthContext);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'doctor' | 'patient' | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { width, height } = useWindowDimensions();

  // Responsive sizes
  const isTablet = width >= 768;
  const maxWidth = isTablet ? 400 : width * 0.85;
  const titleFontSize = Math.min(width * 0.08, 32);
  const inputFontSize = Math.min(width * 0.042, 16);
  const buttonFontSize = Math.min(width * 0.045, 18);
  const smallTextSize = Math.min(width * 0.035, 14);

  const handleSignup = async () => {
    if (!email || !password || !name || !role) {
      Alert.alert('Error', 'Please fill in all fields and select a role');
      return;
    }

    try {
      await signup(email, password, name, role);
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData?.user) {
        Alert.alert('Error', 'No user returned after signup');
        return;
      }

      const user = userData.user;
      if (role === 'patient') {
        const onboardingComplete = await checkPatientOnboardingComplete(user.id);
        if (!onboardingComplete) {
          router.replace('/onboarding');
          return;
        }
        router.replace('/login');
      } else if (role === 'doctor') {
        router.replace('/doctor/verification');
      } else {
        router.replace('/login');
      }
    } catch (error) {
      Alert.alert('Error', 'Signup failed');
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
              width: width * 0.55,
              height: width * 0.55,
              top: -width * 0.2,
              left: -width * 0.15,
            }]}
          />
          <LinearGradient
            colors={['#00B3FF', '#5603BD']}
            style={[styles.bottomRightBubble, {
              width: width * 0.4,
              height: width * 0.4,
              bottom: -width * 0.15,
              right: -width * 0.15,
            }]}
          />
        </View>

        {/* Content */}
        <View style={[styles.contentContainer, { maxWidth, alignSelf: 'center' }]}>
          {/* Header */}
          <View style={[styles.headerSection, {
            paddingTop: Math.max(height * 0.12, 60),
            paddingBottom: Math.max(height * 0.08, 40)
          }]}>
            <Text style={[styles.title, { fontSize: titleFontSize }]}>
              Create Account
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { fontSize: inputFontSize }]}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputContainer}>
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

            <View style={styles.inputContainer}>
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
                  <EyeOff color="#9CA3AF" size={18} />
                ) : (
                  <Eye color="#9CA3AF" size={18} />
                )}
              </TouchableOpacity>
            </View>

            {/* Role Selection */}
            <View style={styles.roleSelection}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'doctor' && styles.roleButtonSelected]}
                onPress={() => setRole('doctor')}
              >
                <Text style={[styles.roleButtonText, role === 'doctor' && styles.roleButtonTextSelected]}>
                  Doctor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'patient' && styles.roleButtonSelected]}
                onPress={() => setRole('patient')}
              >
                <Text style={[styles.roleButtonText, role === 'patient' && styles.roleButtonTextSelected]}>
                  Patient
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity onPress={handleSignup} style={styles.signInButtonContainer}>
              <LinearGradient
                colors={['#00B3FF', '#5603BD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.signInButton}
              >
                <Text style={[styles.signInButtonText, { fontSize: buttonFontSize }]}>
                  Sign Up
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={[styles.divider, { marginVertical: height * 0.03 }]}>
              <LinearGradient colors={['#00B3FF', '#5603BD']} style={styles.dividerLine} />
              <Text style={[styles.dividerText, { fontSize: smallTextSize }]}>OR</Text>
              <LinearGradient colors={['#00B3FF', '#5603BD']} style={styles.dividerLine} />
            </View>

            {/* Navigate to Login */}
            <TouchableOpacity onPress={() => router.push('/login')} style={styles.secondaryButton}>
              <Text style={[styles.secondaryButtonText, { fontSize: Math.min(width * 0.04, 16) }]}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  flex: { flex: 1 },
  bubblesContainer: { position: 'absolute', width: '100%', height: '100%' },
  topLeftBubble: { position: 'absolute', borderRadius: 200, opacity: 0.9 },
  bottomRightBubble: { position: 'absolute', borderRadius: 200, width: 150, height: 150, opacity: 0.7 },
  contentContainer: { flex: 1, width: '100%', paddingHorizontal: 24 },
  headerSection: { alignItems: 'center', justifyContent: 'center', top: 40 },
  backButton: { position: 'absolute', left: 0, top: 0, padding: 12 },
  title: { fontWeight: '700', color: '#1F2937', textAlign: 'center' },
  formContainer: { flex: 1, paddingTop: 20, top: -20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    top: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    marginBottom: 16,
  },
  input: { flex: 1, color: '#1F2937', fontWeight: '400' },
  eyeIcon: { padding: 8, marginLeft: 8 },
  roleSelection: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 8,
    alignItems: 'center',
    top: 10,
  },
  roleButtonSelected: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  roleButtonText: { fontSize: 16, color: '#374151' },
  roleButtonTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },
  signInButtonContainer: { alignItems: 'center', marginTop: 10 },
  signInButton: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 48,
    shadowColor: '#5603BD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signInButtonText: { fontWeight: '600', color: '#FFFFFF', textAlign: 'center', letterSpacing: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center' },
  dividerLine: { flex: 1, height: 1, opacity: 0.6 },
  dividerText: { marginHorizontal: 16, color: '#6B7280', fontWeight: '500', textAlign: 'center' },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0a171dc3',
    textAlign: 'center',
    top: -30,
  },
});