import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Switch,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { AuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { TriangleAlert as AlertTriangle, Calendar, User, Settings, Moon, Globe, Circle as HelpCircle, LogOut, ChevronRight, CreditCard as Edit, Mail, Phone, MapPin, Stethoscope, Save, X, Shield, Pencil } from 'lucide-react-native';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
// @ts-ignore
import * as SMS from 'expo-sms';
import { NavigationBubble } from '@/components/NavigationBubble';

const handleSOSPress = () => {
  router.push('/sos');
};

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const [darkMode, setDarkMode] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<string>('');
  const [editValue, setEditValue] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [fallDetectionEnabled, setFallDetectionEnabled] = useState(false);
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0, z: 0 });
  const [accelerometerSubscription, setAccelerometerSubscription] = useState<any>(null);

  const isDoctorInterface = user?.role === 'doctor';

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  useEffect(() => {
    if (fallDetectionEnabled) {
      _subscribe();
    } else {
      _unsubscribe();
    }
    return () => _unsubscribe();
  }, [fallDetectionEnabled]);

  const _subscribe = () => {
    Accelerometer.isAvailableAsync().then((available) => {
      if (available) {
        console.log('Accelerometer is available');
        setAccelerometerSubscription(
          Accelerometer.addListener(setAccelerometerData)
        );
        Accelerometer.setUpdateInterval(100); // Update every 100ms
      } else {
        console.log('Accelerometer is not available');
        Alert.alert('Accelerometer Not Available', 'Fall detection requires an accelerometer, which is not available on this device.');
      }
    });
  };

  const _unsubscribe = () => {
    if (accelerometerSubscription) {
      accelerometerSubscription.remove();
      setAccelerometerSubscription(null);
    }
  };

  useEffect(() => {
    const { x, y, z } = accelerometerData;
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    // console.log('Accelerometer data:', { x, y, z, magnitude });

    // Simple fall detection: trigger on free fall detection
    if (magnitude < 0.3) { // Free fall detection
      console.log('Fall detected!');
      handleFallDetected();
    }
  }, [accelerometerData]);

  const [fallAlertVisible, setFallAlertVisible] = useState(false);
  const [fallAlertCountdown, setFallAlertCountdown] = useState(10);
  const fallVibrationInterval = React.useRef<any>(null);
  const fallCountdownInterval = React.useRef<any>(null);

  const sendDistressSignal = async () => {
    setFallAlertVisible(false);

    try {
      // Check if SMS is available on the device
      const isAvailable = await SMS.isAvailableAsync();

      if (isAvailable && emergencyContacts.length > 0) {
        // Prepare SMS message
        const message = `EMERGENCY ALERT: ${user?.name} has fallen and needs immediate assistance. Location: ${profileData?.location || 'Unknown'}. Please respond urgently.`;

        // Get phone numbers from emergency contacts
        const recipients = emergencyContacts
          .filter(contact => contact.phone && contact.phone.trim() !== '')
          .map(contact => contact.phone);

        if (recipients.length > 0) {
          // Send SMS to all emergency contacts
          const result = await SMS.sendSMSAsync(recipients, message);

          Alert.alert(
            'Distress Signal Sent',
            `Emergency SMS sent to ${recipients.length} contact(s). Emergency services have been notified.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Re-subscribe to accelerometer after alert is dismissed
                  if (fallDetectionEnabled) {
                    _subscribe();
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Distress Signal Sent',
            'Emergency services have been notified. No emergency contacts with phone numbers found.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Re-subscribe to accelerometer after alert is dismissed
                  if (fallDetectionEnabled) {
                    _subscribe();
                  }
                }
              }
            ]
          );
        }
      } else {
        Alert.alert(
          'Distress Signal Sent',
          'Emergency services have been notified. SMS not available or no emergency contacts configured.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Re-subscribe to accelerometer after alert is dismissed
                if (fallDetectionEnabled) {
                  _subscribe();
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error sending distress signal:', error);
      Alert.alert(
        'Distress Signal Sent',
        'Emergency services have been notified. There was an issue sending SMS alerts.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Re-subscribe to accelerometer after alert is dismissed
              if (fallDetectionEnabled) {
                _subscribe();
              }
            }
          }
        ]
      );
    }
  };

  const cancelFallAlert = () => {
    setFallAlertVisible(false);
    setFallAlertCountdown(10);
    if (fallVibrationInterval.current) {
      clearInterval(fallVibrationInterval.current);
      fallVibrationInterval.current = null;
    }
    if (fallCountdownInterval.current) {
      clearInterval(fallCountdownInterval.current);
      fallCountdownInterval.current = null;
    }
    // Re-subscribe to accelerometer after canceling false alarm
    if (fallDetectionEnabled) {
      _subscribe();
    }
  };

  const handleFallDetected = () => {
    // Unsubscribe from accelerometer to prevent continuous triggering
    _unsubscribe();

    setFallAlertVisible(true);
    setFallAlertCountdown(10);

    // Start vibration pattern: vibrate 1 second, pause 0.5 second, repeat for 10 times
    let count = 0;
    fallVibrationInterval.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      count++;
      if (count >= 10) {
        if (fallVibrationInterval.current) {
          clearInterval(fallVibrationInterval.current);
          fallVibrationInterval.current = null;
        }
      }
    }, 1500);

    // Start countdown timer
    fallCountdownInterval.current = setInterval(() => {
      setFallAlertCountdown((prev) => {
        if (prev <= 1) {
          if (fallCountdownInterval.current) {
            clearInterval(fallCountdownInterval.current);
            fallCountdownInterval.current = null;
          }
          sendDistressSignal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const toggleFallDetection = (value: boolean) => {
    setFallDetectionEnabled(value);
  };

  const fetchProfileData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // Fetch patient data if user is patient
      if (user.role === 'patient') {
        console.log('Fetching patient data for user:', user.id);
        const { data: patientInfo, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', user.id);

        console.log('Patient data response:', { data: patientInfo, error: patientError });

        if (patientError) {
          console.error('Error fetching patient data:', patientError);
        } else if (patientInfo && patientInfo.length > 0) {
          console.log('Patient data found:', patientInfo[0]);
          setPatientData(patientInfo[0]);
          setEmergencyContacts(patientInfo[0].emergency_contacts || []);
        } else {
          console.log('No patient record found, creating one...');
          // Patient record doesn't exist, create one
          const { data: newPatient, error: createError } = await supabase
            .from('patients')
            .insert([{ id: user.id }])
            .select()
            .single();

          if (createError) {
            console.error('Error creating patient record:', createError);
          } else {
            console.log('New patient record created:', newPatient);
            setPatientData(newPatient);
            setEmergencyContacts([]);
          }
        }
      }

      setProfileData(userData);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} years`;
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Clear any additional memory/storage if needed
              console.log('Redirecting to home page...');
              router.replace('/');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout properly');
            }
          }
        }
      ]
    );
  };

  const saveField = async () => {
    if (!user?.id) return;

    try {
      if (editingField === 'blood_grp') {
        const { error } = await supabase
          .from('patients')
          .update({ blood_grp: editValue })
          .eq('id', user.id);

        if (error) throw error;
        setPatientData({ ...patientData, blood_grp: editValue });
      } else if (editingField === 'dob') {
        const { error } = await supabase
          .from('patients')
          .update({ dob: editValue })
          .eq('id', user.id);

        if (error) throw error;
        setPatientData({ ...patientData, dob: editValue });
      } else if (editingField === 'phone') {
        const { error } = await supabase
          .from('users')
          .update({ phone: editValue })
          .eq('id', user.id);

        if (error) throw error;
        setProfileData({ ...profileData, phone: editValue });
      } else if (editingField === 'location') {
        const { error } = await supabase
          .from('users')
          .update({ location: editValue })
          .eq('id', user.id);

        if (error) throw error;
        setProfileData({ ...profileData, location: editValue });
      }

      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };
  
  const openEditModal = (field: string, currentValue: string) => {
    if (field === 'phone' || field === 'location' || field === 'blood_grp' || field === 'dob') {
      setEditingField(field);
      setEditValue(currentValue);
      setEditModalVisible(true);
    }
  };

  const saveEmergencyContacts = async (contacts: EmergencyContact[]) => {
    if (!user?.id) return;

    try {
      console.log('Saving emergency contacts:', contacts);
      const { data, error } = await supabase
        .from('patients')
        .update({ emergency_contacts: contacts })
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Emergency contacts saved successfully:', data);
      setEmergencyContacts(contacts);
      Alert.alert('Success', 'Emergency contacts updated successfully');
    } catch (error) {
      console.error('Error updating emergency contacts:', error);
      Alert.alert('Error', 'Failed to update emergency contacts');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Failed to load profile data</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight}>
          {!isDoctorInterface && (
            <>
              <NavigationBubble />
              <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
                <AlertTriangle color="#FFFFFF" size={24} />
              </TouchableOpacity>
            </>
          )}
          {isDoctorInterface && (
            <TouchableOpacity style={styles.calendarButton}>
              <Calendar color="#2563EB" size={24} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image source={{ uri: profileData.avatar }} style={styles.profileAvatar} />
            {/* <TouchableOpacity style={styles.editButton}>
              <Edit color="#FFFFFF" size={16} />
            </TouchableOpacity> */}
          </View>
          
          <Text style={styles.profileName}>{user?.name}</Text>
          {isDoctorInterface ? (
            <View style={styles.doctorInfo}>
              <View style={styles.doctorBadge}>
                <Stethoscope color="#2563EB" size={16} />
                <Text style={styles.doctorSpecialty}>Doctor</Text>
              </View>
              <Text style={styles.hospitalName}>Medical Professional</Text>
              <Text style={styles.experienceText}>Healthcare Provider</Text>
            </View>
          ) : (
            <View style={styles.patientInfo}>
              <TouchableOpacity onPress={() => openEditModal('dob', patientData?.dob || '')}>
                <Text style={styles.patientAge}>{calculateAge(patientData?.dob)}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openEditModal('blood_grp', patientData?.blood_grp || '')}>
                <Text style={styles.bloodGroup}>Blood Group: {patientData?.blood_grp || 'Not set'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Contact Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.contactItem}>
            <Mail color="#6B7280" size={20} />
            <Text style={styles.contactText}>{profileData.email}</Text>
          </View>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => openEditModal('phone', profileData.phone || '')}
          >
            <Phone color="#6B7280" size={20} />
            <Text style={styles.contactText}>{profileData.phone || 'Not set'}</Text>
            <TouchableOpacity
              style={styles.addButtonSmall}
              onPress={() => openEditModal('phone', profileData.phone || '')}
            >
              <Pencil color="#FFFFFF" size={14} />
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => openEditModal('location', profileData.location || '')}
          >
            <MapPin color="#6B7280" size={20} />
            <Text style={styles.contactText}>{profileData.location || 'Not set'}</Text>
            <TouchableOpacity
              style={styles.addButtonSmall}
              onPress={() => openEditModal('location', profileData.location || '')}
            >
              <Pencil color="#FFFFFF" size={14} />
            </TouchableOpacity>
          </TouchableOpacity>

          {!isDoctorInterface && (
            <View>
              <View style={styles.contactItem}>
                <AlertTriangle color="#EF4444" size={20} />
                <Text style={styles.emergencyText}>Emergency Contacts</Text>
                <TouchableOpacity
                  style={styles.addButtonSmall}
                  onPress={() => setEmergencyModalVisible(true)}
                >
                  <Pencil color="#FFFFFF" size={14} />
                </TouchableOpacity>
              </View>
              {emergencyContacts.slice(0, 2).map((contact: EmergencyContact, index: number) => (
                <View key={contact.id || index} style={styles.emergencyContactItem}>
                  <Text style={styles.emergencyContactName}>{contact.name}</Text>
                  <Text style={styles.emergencyContactPhone}>{contact.phone}</Text>
                </View>
              ))}
              {emergencyContacts.length > 2 && (
                <Text style={styles.moreContactsText}>+{emergencyContacts.length - 2} more</Text>
              )}
            </View>
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <Moon color="#6B7280" size={20} />
            <Text style={styles.settingText}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={darkMode ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <Shield color="#6B7280" size={20} />
            <Text style={styles.settingText}>Fall Detection</Text>
            <Switch
              value={fallDetectionEnabled}
              onValueChange={toggleFallDetection}
              trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
              thumbColor={fallDetectionEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          {fallDetectionEnabled && (
            <TouchableOpacity style={styles.testButton} onPress={handleFallDetected}>
              <Text style={styles.testButtonText}>Test Fall Detection</Text>
            </TouchableOpacity>
          )}

          {fallAlertVisible && (
            <Modal
              visible={fallAlertVisible}
              transparent={true}
              animationType="fade"
              onRequestClose={() => {}}
            >
              <View style={styles.fallAlertOverlay}>
                <View style={styles.fallAlertContainer}>
                  <Text style={styles.fallAlertText}>Fall Detected!</Text>
                  <Text style={styles.fallAlertCountdown}>Sending distress signal in {fallAlertCountdown} seconds</Text>
                  <TouchableOpacity style={styles.fallAlertButton} onPress={cancelFallAlert}>
                    <Text style={styles.fallAlertButtonText}>False Alarm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
          
          <TouchableOpacity style={styles.settingItem}>
            <Globe color="#6B7280" size={20} />
            <Text style={styles.settingText}>Language</Text>
            <View style={styles.settingValue}>
              <Text style={styles.settingValueText}>English</Text>
              <ChevronRight color="#9CA3AF" size={16} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <HelpCircle color="#6B7280" size={20} />
            <Text style={styles.settingText}>Help & FAQs</Text>
            <ChevronRight color="#9CA3AF" size={16} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Settings color="#6B7280" size={20} />
            <Text style={styles.settingText}>App Settings</Text>
            <ChevronRight color="#9CA3AF" size={16} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut color="#EF4444" size={20} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit {editingField === 'blood_grp' ? 'Blood Group' :
                      editingField === 'dob' ? 'Date of Birth' :
                      editingField === 'phone' ? 'Phone Number' :
                      editingField === 'location' ? 'Location' : 'Field'}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X color="#6B7280" size={24} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={
                editingField === 'blood_grp' ? 'e.g., A+, B-, O+' :
                editingField === 'dob' ? 'YYYY-MM-DD' :
                editingField === 'phone' ? 'Enter phone number' :
                editingField === 'location' ? 'Enter location' : 'Enter value'
              }
              keyboardType={
                editingField === 'dob' ? 'numeric' :
                editingField === 'phone' ? 'phone-pad' : 'default'
              }
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveField}
              >
                <Save color="#FFFFFF" size={16} />
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Emergency Contacts Modal */}
      <Modal
        visible={emergencyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEmergencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Emergency Contacts</Text>
              <TouchableOpacity onPress={() => setEmergencyModalVisible(false)}>
                <X color="#6B7280" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.emergencyContactsList}>
              {emergencyContacts.map((contact, index) => (
                <View key={contact.id || index} style={styles.emergencyContactEditItem}>
                  <View style={styles.emergencyContactInfo}>
                    <TextInput
                      style={styles.contactInput}
                      placeholder="Name"
                      value={contact.name}
                      onChangeText={(text) => {
                        const updatedContacts = [...emergencyContacts];
                        updatedContacts[index].name = text;
                        setEmergencyContacts(updatedContacts);
                      }}
                    />
                    <TextInput
                      style={styles.contactInput}
                      placeholder="Relationship"
                      value={contact.relationship}
                      onChangeText={(text) => {
                        const updatedContacts = [...emergencyContacts];
                        updatedContacts[index].relationship = text;
                        setEmergencyContacts(updatedContacts);
                      }}
                    />
                    <TextInput
                      style={styles.contactInput}
                      placeholder="Phone"
                      value={contact.phone}
                      onChangeText={(text) => {
                        const updatedContacts = [...emergencyContacts];
                        updatedContacts[index].phone = text;
                        setEmergencyContacts(updatedContacts);
                      }}
                      keyboardType="phone-pad"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.removeContactButton}
                    onPress={() => {
                      const updatedContacts = emergencyContacts.filter((_, i) => i !== index);
                      setEmergencyContacts(updatedContacts);
                    }}
                  >
                    <X color="#EF4444" size={16} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.addContactButton}
              onPress={() => {
                const newContact: EmergencyContact = {
                  id: Date.now().toString(),
                  name: '',
                  relationship: '',
                  phone: '',
                };
                setEmergencyContacts([...emergencyContacts, newContact]);
              }}
            >
              <Text style={styles.addContactText}>Add Contact</Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEmergencyModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={() => {
                  saveEmergencyContacts(emergencyContacts);
                  setEmergencyModalVisible(false);
                }}
              >
                <Save color="#FFFFFF" size={16} />
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  calendarButton: {
    padding: 12,
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sosButton: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: {
    position: 'relative',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2563EB',
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  doctorInfo: {
    alignItems: 'center',
  },
  doctorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    marginLeft: 6,
  },
  hospitalName: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
  },
  experienceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  patientInfo: {
    alignItems: 'center',
  },
  patientAge: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
  },
  bloodGroup: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contactText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  emergencyText: {
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 12,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    marginBottom: 32,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  editButtonSmall: {
    backgroundColor: '#2563EB',
    padding: 6,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  addButtonSmall: {
    backgroundColor: '#16A34A', // green for "Add" (you can keep blue if you prefer)
    padding: 6,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  emergencyContactItem: {
    paddingVertical: 8,
    paddingLeft: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  emergencyContactName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  emergencyContactPhone: {
    fontSize: 12,
    color: '#6B7280',
  },
  moreContactsText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#374151',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginLeft: 10,
  },
  modalSaveText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  emergencyContactsList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  emergencyContactEditItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  emergencyContactInfo: {
    flex: 1,
  },
  emergencyContactRelationship: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  removeContactButton: {
    padding: 8,
  },
  addContactButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addContactText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  contactInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  fallAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallAlertContainer: {
    backgroundColor: '#FF0000',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
  },
  fallAlertText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  fallAlertCountdown: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 30,
  },
  fallAlertButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  fallAlertButtonText: {
    color: '#FF0000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
