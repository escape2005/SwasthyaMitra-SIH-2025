import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '@/contexts/AuthContext';
import { Calendar, FileText, Clock, ChevronRight, User, ChevronDown, ChevronUp } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
const router = useRouter();
const handleCalendarpress = () => {
  router.push('/(doctor)/calendar');
};

interface HistoryEntry {
  id: string;
  date: string;
  type: string;
  description: string;
  diagnosis?: string;
  prescription?: string[];
  notes?: string;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  lastVisit: string;
  nextAppointment?: string;
  avatar: string;
  history: HistoryEntry[];
}

const mockPatients: Patient[] = [];

export default function PatientsScreen() {
  const { user } = useContext(AuthContext);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchPatientsWithPrescriptions = async (doctorId: string) => {
    setLoading(true);
    try {
      // Fetch patients who have prescriptions from this doctor
      const { data: prescriptions, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select(`
          id,
          patient_id,
          created_at,
          medicines,
          instructions,
          status,
          users!patient_id (
            name,
            avatar,
            patients (
              dob,
              gender
            )
          )
        `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (prescriptionsError) {
        console.error('Error fetching prescriptions:', prescriptionsError);
        setLoading(false);
        return;
      }



      // Map patients with their prescriptions grouped
      const patientMap: { [key: string]: Patient } = {};

      prescriptions.forEach((prescription) => {
        const patientId = prescription.patient_id;
        if (!patientMap[patientId]) {
          const patientData = prescription.users as any;
          patientMap[patientId] = {
            id: patientId,
            name: patientData.name,
            age: 20,
            condition: '', // condition is not directly available, can be empty or fetched separately if needed
            lastVisit: prescription.created_at,
            avatar: patientData.avatar || 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
            history: [],
          };
        }
        // Add prescription to patient's history
        patientMap[patientId].history.push({
          id: prescription.id,
          date: prescription.created_at,
          type: 'Prescription',
          description: prescription.instructions || '',
          diagnosis: '',
          prescription: prescription.medicines || [],
          notes: '',
        });
      });

      // Convert map to array and sort history by date descending
      const patientsArray = Object.values(patientMap).map((patient) => {
        patient.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return patient;
      });

      setPatients(patientsArray);
    } catch (error) {
      console.error('Unexpected error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      fetchPatientsWithPrescriptions(user.id);
    }
  }, [user]);

  const handlePatientPress = (patientId: string) => {
    console.log('Opening patient details for:', patientId);
  };

  const handleHistoryPress = (patientId: string) => {
    setExpandedHistory(expandedHistory === patientId ? null : patientId);
  };

  const renderHistoryEntry = (entry: HistoryEntry) => (
    <View key={entry.id} style={styles.historyEntry}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>{new Date(entry.date).toLocaleDateString('en-US', {timeZone: 'UTC'})}</Text>
        <Text style={styles.historyType}>{entry.type}</Text>
      </View>
      <Text style={styles.historyDescription}>{entry.description}</Text>
      {entry.diagnosis && (
        <View style={styles.historySection}>
          <Text style={styles.historySectionTitle}>Diagnosis:</Text>
          <Text style={styles.historySectionText}>{entry.diagnosis}</Text>
        </View>
      )}
      {entry.prescription && entry.prescription.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historySectionTitle}>Prescription:</Text>
          {entry.prescription.map((med, index) => (
            <Text key={index} style={styles.prescriptionItem}>• {med}</Text>
          ))}
        </View>
      )}
      {entry.notes && (
        <View style={styles.historySection}>
          <Text style={styles.historySectionTitle}>Notes:</Text>
          <Text style={styles.historySectionText}>{entry.notes}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Patients</Text>
          <Text style={styles.headerSubtitle}>{patients.length} active patients</Text>
        </View>
        <TouchableOpacity style={styles.calendarButton} onPress={handleCalendarpress}>
          <Calendar color="#2563EB" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : (
          patients.map((patient) => (
            <View key={patient.id} style={styles.patientCard}>
              <TouchableOpacity onPress={() => handlePatientPress(patient.id)}>
                <View style={styles.patientHeader}>
                  <View style={[styles.profileAvatar, styles.avatarPlaceholder]}>
                    <User color="#6B7280" size={20} />
                  </View>

                  <View style={[styles.patientInfo, styles.patientInfoSpaced]}>
                    <Text style={styles.patientName}>{patient.name}</Text>
                    <Text style={styles.patientAge}>Age: {patient.age} years</Text>
                    <Text style={styles.patientCondition}>{patient.condition}</Text>
                  </View>
                  <ChevronRight color="#9CA3AF" size={20} />
                </View>

                <View style={styles.patientDetails}>
                  <View style={styles.detailItem}>
                    <Clock color="#6B7280" size={16} />
                    <Text style={styles.detailText}>
                      Last Visit: {new Date(patient.lastVisit).toLocaleDateString('en-US', {timeZone: 'UTC'})}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.patientActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleHistoryPress(patient.id)}
                >
                  <FileText color="#2563EB" size={18} />
                  <Text style={styles.actionText}>History</Text>
                  {expandedHistory === patient.id ? (
                    <ChevronUp color="#2563EB" size={16} style={styles.chevron} />
                  ) : (
                    <ChevronDown color="#2563EB" size={16} style={styles.chevron} />
                  )}
                </TouchableOpacity>
              </View>

              {/* History Dropdown */}
              {expandedHistory === patient.id && (
                <View style={styles.historyDropdown}>
                  <Text style={styles.historyTitle}>Patient History</Text>
                  {patient.history.map(renderHistoryEntry)}
                </View>
              )}
            </View>
          ))
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
  calendarButton: {
    padding: 12,
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  patientCard: {
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
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  patientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  patientAge: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  patientCondition: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  patientDetails: {
    marginBottom: 16,
    paddingLeft: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  patientActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  actionText: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
    fontWeight: '500',
  },
  chevron: {
    position: 'absolute',
    top: -2,
    right: -8,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  patientInfoSpaced: {
    marginLeft: 16,
  },
  historyDropdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  historyEntry: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  historyType: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  historySection: {
    marginBottom: 8,
  },
  historySectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  historySectionText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  prescriptionItem: {
    fontSize: 13,
    color: '#059669',
    marginBottom: 2,
    marginLeft: 8,
  },
});