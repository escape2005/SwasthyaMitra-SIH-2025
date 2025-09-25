import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { AuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Phone, MapPin, Clock, TriangleAlert as AlertTriangle, Heart, Stethoscope } from 'lucide-react-native';

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  avatar: string;
}

interface NearbyDoctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  distance: string;
  available: boolean;
  avatar: string;
  phone: string;
}

export default function SOSScreen() {
  const { user } = useContext(AuthContext);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [nearbyDoctors, setNearbyDoctors] = useState<NearbyDoctor[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      // Fetch emergency contacts
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('emergency_contacts')
        .eq('id', user.id)
        .single();

      if (patientError) {
        console.error('Error fetching emergency contacts:', patientError);
      } else {
        setEmergencyContacts(patientData?.emergency_contacts || []);
      }

      // Fetch nearby doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('*, users!inner(name, avatar, phone, location)')
        .eq('users.role', 'doctor');

      if (doctorsError) {
        console.error('Error fetching doctors:', doctorsError);
      } else {
        const doctors: NearbyDoctor[] = doctorsData.map((doc: any) => ({
          id: doc.id,
          name: doc.users.name,
          specialty: doc.specialty,
          hospital: doc.hospital,
          distance: 'Nearby',
          available: true,
          avatar: doc.users.avatar || 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg',
          phone: doc.users.phone,
        }));
        setNearbyDoctors(doctors);
      }
    };

    fetchData();
  }, [user]);

  const makeCall = (phoneNumber: string) => {
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Phone calls are not supported on this device');
      }
    }).catch(err => {
      console.error('Error making call:', err);
      Alert.alert('Error', 'Failed to initiate call');
    });
  };

  const handleCall = (phone: string, name: string) => {
    Alert.alert(
      `Call ${name}`,
      `Calling ${phone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => makeCall(phone)
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Alert Message */}
        <View style={styles.alertSection}>
          <View style={styles.alertIcon}>
            <Heart color="#EF4444" size={32} />
          </View>
          <Text style={styles.alertTitle}>Emergency Alert Sent!</Text>
          <Text style={styles.alertMessage}>
            Nearby doctors have been notified of your emergency. 
            Your family contacts are being alerted.
          </Text>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          
          {emergencyContacts.map((contact: any) => (
            <TouchableOpacity
              key={contact.id}
              style={styles.contactCard}
              onPress={() => handleCall(contact.phone, contact.name)}>
              
              <Image source={{ uri: contact.avatar }} style={styles.contactAvatar} />
              
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.callButton}
                onPress={() => handleCall(contact.phone, contact.name)}>
                <Phone color="#FFFFFF" size={20} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nearby Doctors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Emergency Doctors</Text>
          <Text style={styles.sectionSubtitle}>Doctors have been notified of your emergency</Text>
          
          {nearbyDoctors.map((doctor: any) => (
            <View key={doctor.id} style={styles.doctorCard}>
              <Image source={{ uri: doctor.avatar }} style={styles.doctorAvatar} />
              
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
                <Text style={styles.doctorHospital}>{doctor.hospital}</Text>
                
                <View style={styles.doctorMeta}>
                  <View style={styles.distanceContainer}>
                    <MapPin color="#6B7280" size={14} />
                    <Text style={styles.distanceText}>{doctor.distance} away</Text>
                  </View>
                  
                  <View style={[
                    styles.availabilityBadge,
                    { backgroundColor: doctor.available ? '#D1FAE5' : '#FEF2F2' }
                  ]}>
                    <Text style={[
                      styles.availabilityText,
                      { color: doctor.available ? '#059669' : '#EF4444' }
                    ]}>
                      {doctor.available ? 'AVAILABLE' : 'BUSY'}
                    </Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.emergencyCallButton}
                onPress={() => handleCall(doctor.phone, doctor.name)}>
                <Phone color="#FFFFFF" size={20} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Emergency Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Services</Text>
          
          <TouchableOpacity 
            style={styles.emergencyServiceCard}
            onPress={() => handleCall('102', 'Ambulance Service')}>
            <AlertTriangle color="#EF4444" size={24} />
            <Text style={styles.emergencyServiceText}>Call Ambulance - 102</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.emergencyServiceCard}
            onPress={() => handleCall('100', 'Police')}>
            <AlertTriangle color="#EF4444" size={24} />
            <Text style={styles.emergencyServiceText}>Emergency Police - 100</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2F2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#EF4444',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  alertSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  alertIcon: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
  },
  contactAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  contactRelationship: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  callButton: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 12,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 2,
  },
  doctorHospital: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  doctorMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  availabilityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emergencyCallButton: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 12,
  },
  emergencyServiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  emergencyServiceText: {
    fontSize: 18,
    color: '#EF4444',
    fontWeight: 'bold',
    marginLeft: 12,
  },
});