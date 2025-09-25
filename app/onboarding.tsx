import React, { useState, useContext, useEffect } from 'react';
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
  ScrollView,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ChevronRight, Calendar, User, X, Check } from 'lucide-react-native';
import { AuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface PatientData {
  dob?: string;
  gender?: string;
  blood_grp?: string;
  height_cm?: number;
  weight_kg?: number;
  allergies?: string[];
  chronic_conditions?: string[];
  primary_physician?: string;
  emergency_contacts?: any[];
}

export default function OnboardingScreen() {
  const { user } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState(0);
  const [patientData, setPatientData] = useState<PatientData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDay, setTempDay] = useState('1');
  const [tempMonth, setTempMonth] = useState('1');
  const [tempYear, setTempYear] = useState('2000');

  const steps = [
    { title: 'Basic Information', fields: ['dob', 'gender', 'blood_grp'] },
    { title: 'Physical Details', fields: ['height_cm', 'weight_kg'] },
    { title: 'Medical History', fields: ['allergies', 'chronic_conditions', 'primary_physician'] },
    { title: 'Emergency Contacts', fields: ['emergency_contacts'] },
  ];

  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Generate arrays for date picker
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

  const isStepValid = () => {
    if (currentStep === 0) {
      return patientData.dob && patientData.gender;
    }
    return true;
  };

  const handleNext = async () => {
    if (!isStepValid()) {
      Alert.alert('Required Fields', 'Please fill in all required fields before proceeding.');
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          ...patientData,
          profile_completed: true,
          medical_history_completed: true,
        })
        .eq('id', user?.id);

      if (error) throw error;

      router.replace('/(patient)/today');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateConfirm = () => {
    const monthIndex = months.indexOf(tempMonth);
    const formattedMonth = (monthIndex + 1).toString().padStart(2, '0');
    const formattedDay = tempDay.padStart(2, '0');
    const formattedDate = `${tempYear}-${formattedMonth}-${formattedDay}`;
    
    updateField('dob', formattedDate);
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const openDatePicker = () => {
    // Initialize with current date or existing value
    if (patientData.dob) {
      const [year, month, day] = patientData.dob.split('-');
      setTempYear(year);
      setTempMonth(months[parseInt(month) - 1]);
      setTempDay(parseInt(day).toString());
    } else {
      const today = new Date();
      setTempYear((today.getFullYear() - 25).toString()); // Default to 25 years ago
      setTempMonth('January');
      setTempDay('1');
    }
    setShowDatePicker(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Select Date of Birth';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderStep = () => {
    const step = steps[currentStep];

    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            
            {/* Date of Birth Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Date of Birth <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity 
                style={[styles.datePickerButton, !patientData.dob && styles.inputError]}
                onPress={openDatePicker}
              >
                <Calendar color="#6B7280" size={20} />
                <Text style={[styles.datePickerText, !patientData.dob && styles.placeholderText]}>
                  {formatDate(patientData.dob)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Gender Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Gender <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.tagContainer}>
                {genderOptions.map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.tag,
                      patientData.gender === gender.toLowerCase() && styles.tagSelected,
                    ]}
                    onPress={() => updateField('gender', gender.toLowerCase())}
                  >
                    <User 
                      color={patientData.gender === gender.toLowerCase() ? '#FFFFFF' : '#6B7280'} 
                      size={16} 
                    />
                    <Text style={[
                      styles.tagText,
                      patientData.gender === gender.toLowerCase() && styles.tagTextSelected,
                    ]}>
                      {gender}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Blood Group Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Blood Group</Text>
              <View style={styles.bloodGroupContainer}>
                {bloodGroups.map((bloodGroup) => (
                  <TouchableOpacity
                    key={bloodGroup}
                    style={[
                      styles.bloodGroupTab,
                      patientData.blood_grp === bloodGroup && styles.bloodGroupTabSelected,
                    ]}
                    onPress={() => updateField('blood_grp', bloodGroup)}
                  >
                    <Text style={[
                      styles.bloodGroupText,
                      patientData.blood_grp === bloodGroup && styles.bloodGroupTextSelected,
                    ]}>
                      {bloodGroup}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter height in centimeters"
                value={patientData.height_cm?.toString() || ''}
                onChangeText={(value) => updateField('height_cm', parseFloat(value))}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter weight in kilograms"
                value={patientData.weight_kg?.toString() || ''}
                onChangeText={(value) => updateField('weight_kg', parseFloat(value))}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Allergies</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter allergies (comma separated)"
                value={patientData.allergies?.join(', ') || ''}
                onChangeText={(value) => updateField('allergies', value.split(',').map(s => s.trim()).filter(s => s))}
                placeholderTextColor="#9CA3AF"
                multiline
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Chronic Conditions</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter chronic conditions (comma separated)"
                value={patientData.chronic_conditions?.join(', ') || ''}
                onChangeText={(value) => updateField('chronic_conditions', value.split(',').map(s => s.trim()).filter(s => s))}
                placeholderTextColor="#9CA3AF"
                multiline
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Primary Physician</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your primary physician's name"
                value={patientData.primary_physician || ''}
                onChangeText={(value) => updateField('primary_physician', value)}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <View style={styles.completionContainer}>
              <Text style={styles.completionText}>
                You're all set! Emergency contacts can be added later in your profile settings.
              </Text>
              <Text style={styles.completionSubtext}>
                Your profile information will help healthcare providers give you better care.
              </Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#374151" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Your Profile</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.progressContainer}>
            {steps.map((_, index) => (
              <View key={index} style={styles.progressTrack}>
                <LinearGradient
                  colors={index <= currentStep ? ['#00B3FF', '#5603BD'] : ['#E5E7EB', '#E5E7EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressStep}
                />
              </View>
            ))}
          </View>

          {renderStep()}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.nextButton, (!isStepValid() || isLoading) && styles.buttonDisabled]} 
              onPress={handleNext} 
              disabled={!isStepValid() || isLoading}
            >
              <LinearGradient
                colors={(!isStepValid() || isLoading) ? ['#9CA3AF', '#6B7280'] : ['#00B3FF', '#5603BD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Loading...' : currentStep === steps.length - 1 ? 'Complete Profile' : 'Continue'}
                </Text>
                {!isLoading && <ChevronRight color="#FFFFFF" size={20} />}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Custom Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={handleDateCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleDateCancel}>
                  <X color="#6B7280" size={24} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Date of Birth</Text>
                <TouchableOpacity onPress={handleDateConfirm}>
                  <Check color="#00B3FF" size={24} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.pickerContainer}>
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Day</Text>
                  <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                    {days.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.pickerItem,
                          tempDay === day && styles.pickerItemSelected
                        ]}
                        onPress={() => setTempDay(day)}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          tempDay === day && styles.pickerItemTextSelected
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Month</Text>
                  <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                    {months.map((month) => (
                      <TouchableOpacity
                        key={month}
                        style={[
                          styles.pickerItem,
                          tempMonth === month && styles.pickerItemSelected
                        ]}
                        onPress={() => setTempMonth(month)}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          tempMonth === month && styles.pickerItemTextSelected
                        ]}>
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Year</Text>
                  <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                    {years.map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.pickerItem,
                          tempYear === year && styles.pickerItemSelected
                        ]}
                        onPress={() => setTempYear(year)}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          tempYear === year && styles.pickerItemTextSelected
                        ]}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>
        </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 32,
    paddingHorizontal: 20,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    marginHorizontal: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressStep: {
    flex: 1,
    height: '100%',
  },
  stepContainer: {
    marginBottom: 40,
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
  },
  inputError: {
    borderColor: '#EF4444',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  datePickerText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 25,
  },
  tagSelected: {
    backgroundColor: '#5603BD',
    borderColor: '#5603BD',
  },
  tagText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
  bloodGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodGroupTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  bloodGroupTabSelected: {
    backgroundColor: '#00B3FF',
    borderColor: '#00B3FF',
  },
  bloodGroupText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  bloodGroupTextSelected: {
    color: '#FFFFFF',
  },
  completionContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  completionText: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 26,
  },
  completionSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    marginBottom: 40,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  pickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  picker: {
    maxHeight: 200,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#00B3FF',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});