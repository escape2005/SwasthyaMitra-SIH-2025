import React, { useContext, useState, useEffect } from 'react';
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
import { TriangleAlert as AlertTriangle, Calendar, User, Settings, Moon, Globe, Circle as HelpCircle, LogOut, ChevronRight, CreditCard as Edit, Mail, Phone, MapPin, Stethoscope, Save, X, Pencil } from 'lucide-react-native';

const handleCalendarpress = () => {
  router.push('/(doctor)/calendar');
};

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const [darkMode, setDarkMode] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<string>('');
  const [editValue, setEditValue] = useState('');
  const isDoctorInterface = user?.role === 'doctor';

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/');
          }
        }
      ]
    );
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

      // Fetch doctor data
      const { data: doctorInfo, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', user.id)
        .single();

      if (doctorError) throw doctorError;

      setProfileData(userData);
      setDoctorData(doctorInfo);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const saveField = async () => {
    if (!user?.id) return;

    try {
      if (editingField === 'specialty') {
        const { error } = await supabase
          .from('doctors')
          .update({ specialty: editValue })
          .eq('id', user.id);

        if (error) throw error;
        setDoctorData({ ...doctorData, specialty: editValue });
      } else if (editingField === 'hospital') {
        const { error } = await supabase
          .from('doctors')
          .update({ hospital: editValue })
          .eq('id', user.id);

        if (error) throw error;
        setDoctorData({ ...doctorData, hospital: editValue });
      } else if (editingField === 'experience') {
        const { error } = await supabase
          .from('doctors')
          .update({ experience: editValue })
          .eq('id', user.id);

        if (error) throw error;
        setDoctorData({ ...doctorData, experience: editValue });
      } else if (editingField === 'phone') {
        const { error } = await supabase
          .from('users')
          .update({ phone: editValue })
          .eq('id', user.id);

        if (error) throw error;
        setProfileData({ ...profileData, phone: editValue });
      } else if (editingField === 'location') {
        const { error } = await supabase
          .from('users')  // ✅ Fixed - removed 'public.' prefix
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
    setEditingField(field);
    setEditValue(currentValue);
    setEditModalVisible(true);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        {!isDoctorInterface && (
          <TouchableOpacity style={styles.sosButton}>
            <AlertTriangle color="#FFFFFF" size={24} />
          </TouchableOpacity>
        )}
        {isDoctorInterface && (
          <TouchableOpacity style={styles.calendarButton} onPress={handleCalendarpress}>
            <Calendar color="#2563EB" size={24} />
          </TouchableOpacity>
        )}
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
          
          <Text style={styles.profileName}>{profileData?.name}</Text>
          {isDoctorInterface ? (
            <View style={styles.doctorInfo}>
              <TouchableOpacity onPress={() => openEditModal('specialty', doctorData?.specialty || '')}>
                <View style={styles.doctorBadge}>
                  <Stethoscope color="#2563EB" size={16} />
                  <Text style={styles.doctorSpecialty}>{doctorData?.specialty}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openEditModal('hospital', doctorData?.hospital || '')}>
                <Text style={styles.hospitalName}>{doctorData?.hospital}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openEditModal('experience', doctorData?.experience || '')}>
                <Text style={styles.experienceText}>{doctorData?.experience} experience</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.patientInfo}>
              <Text style={styles.patientAge}>Age</Text>
              <Text style={styles.bloodGroup}>Blood Group</Text>
            </View>
          )}
        </View>

        {/* Contact Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.contactItem}>
            <Mail color="#6B7280" size={20} />
            <Text style={styles.contactText}>{profileData?.email}</Text>
          </View>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => openEditModal('phone', profileData?.phone || '')}
          >
            <Phone color="#6B7280" size={20} />
            <Text style={styles.contactText}>{profileData?.phone || 'Not set'}</Text>
            <TouchableOpacity
              style={styles.addButtonSmall}
              onPress={() => openEditModal('phone', profileData?.phone || '')}
            >
              <Pencil color="#FFFFFF" size={14} />
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => openEditModal('location', profileData?.location || '')}
          >
            <MapPin color="#6B7280" size={20} />
            <Text style={styles.contactText}>{profileData?.location || 'Not set'}</Text>
            <TouchableOpacity
              style={styles.addButtonSmall}
              onPress={() => openEditModal('location', profileData?.location || '')}
            >
              <Pencil color="#FFFFFF" size={14} />
            </TouchableOpacity>
          </TouchableOpacity>
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
                Edit {editingField === 'specialty' ? 'Specialty' :
                      editingField === 'hospital' ? 'Hospital' :
                      editingField === 'experience' ? 'Experience' :
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
                editingField === 'specialty' ? 'e.g., Cardiology' :
                editingField === 'hospital' ? 'Enter hospital name' :
                editingField === 'experience' ? 'e.g., 5 years' :
                editingField === 'phone' ? 'Enter phone number' :
                editingField === 'location' ? 'Enter location' : 'Enter value'
              }
              keyboardType={
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  addButtonSmall: {
    backgroundColor: '#16A34A', // green for "Add" (you can keep blue if you prefer)
    padding: 6,
    borderRadius: 12,
    marginLeft: 'auto',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editContactButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  editContactText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  contactInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  saveCancelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  doctorSpecialtyInput: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    marginLeft: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flex: 1,
  },
  hospitalInput: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  patientAgeInput: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  bloodGroupInput: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
});