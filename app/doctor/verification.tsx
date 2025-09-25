// doctor/verification.tsx
import { useState } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Stethoscope, ArrowRight } from "lucide-react-native";

export default function VerificationPage() {
  const router = useRouter();
  const [regNo, setRegNo] = useState("");
  const [year, setYear] = useState("");
  const [council, setCouncil] = useState("");
  const [msg, setMsg] = useState("");

  const VERIFIED_DOCTORS = [
    { registration_no: "12345", year_of_registration: "2016", council_name: "Bombay Medical Council" },
    { registration_no: "67890", year_of_registration: "2018", council_name: "Delhi Medical Council" },
  ];

  const handleVerify = () => {
    setMsg("Verifying...");
    const match = VERIFIED_DOCTORS.find(
      (doc) =>
        doc.registration_no === regNo.trim() &&
        doc.year_of_registration === year.trim() &&
        doc.council_name.trim().toLowerCase() === council.trim().toLowerCase()
    );
    if (match) {
      setMsg("Doctor verified ✅");
      router.replace("/(doctor)/appointments");
    } else {
      setMsg("Verification failed ❌ (Details not found in registry)");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          {/* Top Section */}
          <View style={styles.topSection}>
            <View style={styles.illustrationContainer}>
              <Stethoscope size={120} color="#5603BD" strokeWidth={1.5} />
            </View>
            <Text style={styles.stepTitle}>Doctor Verification</Text>
          </View>

          {/* Form Section */}
          <View style={styles.stepContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Registration Number <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your registration number"
                value={regNo}
                onChangeText={setRegNo}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Year of Registration <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter year of registration"
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Council Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter medical council name"
                value={council}
                onChangeText={setCouncil}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Message */}
            {msg ? (
              <View style={styles.messageContainer}>
                <Text style={styles.msgText}>{msg}</Text>
              </View>
            ) : null}
          </View>

          {/* Button Section */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              onPress={handleVerify} 
              style={[styles.nextButton, (!regNo || !year || !council) && styles.buttonDisabled]}
              disabled={!regNo || !year || !council}
            >
              <LinearGradient
                colors={["#00B3FF", "#5603BD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Verify Doctor</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  stepContainer: {
    marginBottom: 40,
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
    alignSelf: 'center',
    width: '70%',
    top: -40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#374151',
    width: '100%',
  },
  messageContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  msgText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 40,
    width: '50%',
    top: -60,
    alignSelf: 'center',
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});