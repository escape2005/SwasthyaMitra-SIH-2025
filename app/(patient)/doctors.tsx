import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '@/contexts/AuthContext';
import { TriangleAlert as AlertTriangle, Download, Phone, MessageCircle, Star, Calendar, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
const router = useRouter();
const handleSOSPress = () => {
  router.push('/sos');
};
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  location: string;
  rating: number;
  phone: string;
  avatar: string;
  lastConsulted: string;
  nextAppointment?: string;
}



export default function DoctorsScreen() {
  const { user } = useContext(AuthContext);
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDoctors = async () => {
    if (!user) {
      setDoctors([]);
      setLoading(false);
      return;
    }
    try {
      // Fetch doctors joined with users table to get user details
      const { data, error } = await supabase
        .from('users')
        .select('id, name, phone, location, avatar, role')
        .eq('role', 'doctor')
        .limit(100);

      if (error) {
        console.error('Error fetching doctors:', error);
        Alert.alert('Error', 'Failed to fetch doctors from database.');
        setDoctors([]);
      } else if (data) {
        // Map data to Doctor interface
        const mappedDoctors: Doctor[] = data.map((doc: any) => ({
          id: doc.id,
          name: doc.name || 'Unknown',
          specialty: '', // Specialty not in users table, can be fetched separately if needed
          hospital: '', // Hospital info can be added if available
          location: doc.location || '',
          rating: 0, // Rating can be fetched/calculated separately
          phone: doc.phone || '',
          avatar: doc.avatar || '',
          lastConsulted: '', // No data in current schema, leave empty or fetch from appointments if needed
          nextAppointment: undefined,
        }));
        setDoctors(mappedDoctors);
      }
    } catch (error) {
      console.error('Unexpected error fetching doctors:', error);
      Alert.alert('Error', 'Unexpected error occurred while fetching doctors.');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDoctors();
  }, [user]);

  const handleDownloadPDF = () => {
    Alert.alert(
      'Download PDF',
      'Doctor information PDF will be generated and downloaded.',
      [{ text: 'OK' }]
    );
  };

  const handleCall = (phone: string) => {
    Alert.alert(
      'Call Doctor',
      `Would you like to call ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('Calling:', phone) }
      ]
    );
  };

  const handleBookAppointment = async (doctorId: string) => {
    if (!user) return;

    try {
      // Set appointment date to tomorrow at 10 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          doctor_id: doctorId,
          appointment_date: tomorrow.toISOString(),
          status: 'scheduled',
          symptoms: '',
          notes: 'Booked via app'
        });

      if (error) {
        console.error('Error booking appointment:', error);
        Alert.alert('Error', 'Failed to book appointment. Please try again.');
      } else {
        Alert.alert('Success', 'Appointment booked successfully!');
      }
    } catch (error) {
      console.error('Unexpected error booking appointment:', error);
      Alert.alert('Error', 'Unexpected error occurred while booking appointment.');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        color={index < Math.floor(rating) ? "#F59E0B" : "#E5E7EB"}
        size={16}
        fill={index < Math.floor(rating) ? "#F59E0B" : "none"}
      />
    ));
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#059669" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Doctors</Text>
          <Text style={styles.headerSubtitle}>{doctors ? doctors.length : 0} consulting doctors</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPDF}>
            <Download color="#059669" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
            <AlertTriangle color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {doctors && doctors.length > 0 ? (
          doctors.map((doctor) => (
            <View key={doctor.id} style={styles.doctorCard}>
              <View style={styles.doctorHeader}>
                <Image source={{ uri: doctor.avatar }} style={styles.doctorAvatar} />
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{doctor.name}</Text>
                  <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>

                  <View style={styles.ratingContainer}>
                    <View style={styles.stars}>
                      {renderStars(doctor.rating)}
                    </View>
                    <Text style={styles.ratingText}>{doctor.rating}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.hospitalInfo}>
                <Text style={styles.hospitalName}>{doctor.hospital}</Text>
                <View style={styles.locationContainer}>
                  <MapPin color="#6B7280" size={14} />
                  <Text style={styles.locationText}>{doctor.location}</Text>
                </View>
              </View>

              <View style={styles.consultationInfo}>
                <View style={styles.consultationItem}>
                  <Calendar color="#6B7280" size={16} />
                  <Text style={styles.consultationText}>
                    Last: {doctor.lastConsulted ? new Date(doctor.lastConsulted).toLocaleDateString() : 'No consultations yet'}
                  </Text>
                </View>

                {doctor.nextAppointment && (
                  <View style={styles.consultationItem}>
                    <Calendar color="#10B981" size={16} />
                    <Text style={styles.consultationText}>
                      Next: {new Date(doctor.nextAppointment).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.doctorActions}>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCall(doctor.phone)}>
                  <Phone color="#FFFFFF" size={20} />
                  <Text style={styles.callButtonText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.messageButton}>
                  <MessageCircle color="#2563EB" size={20} />
                  <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.appointmentButton}
                  onPress={() => handleBookAppointment(doctor.id)}>
                  <Calendar color="#059669" size={20} />
                  <Text style={styles.appointmentButtonText}>Book</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#6B7280' }}>No doctors found.</Text>
        )}
      </ScrollView>
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
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  downloadButton: {
    padding: 12,
    backgroundColor: '#ECFDF5',
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
    paddingTop: 16,
  },
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  doctorAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  hospitalInfo: {
    marginBottom: 16,
    paddingLeft: 4,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  consultationInfo: {
    marginBottom: 20,
    paddingLeft: 4,
  },
  consultationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  consultationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  doctorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  callButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 0.3,
    justifyContent: 'center',
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  messageButton: {
    backgroundColor: '#EBF8FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 0.3,
    justifyContent: 'center',
  },
  messageButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  appointmentButton: {
    backgroundColor: '#ECFDF5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 0.3,
    justifyContent: 'center',
  },
  appointmentButtonText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
