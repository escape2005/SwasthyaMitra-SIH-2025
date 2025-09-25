import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { AuthContext } from '@/contexts/AuthContext';
import { Calendar, FileText, Clock, ChevronRight, User, ChevronDown, ChevronUp } from 'lucide-react-native';

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

const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Arvind Yadav',
    age: 65,
    condition: 'Diabetes Type 2',
    lastVisit: '2025-09-05',
    nextAppointment: '2025-09-20',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
    history: [
      {
        id: 'h1',
        date: '2025-09-05',
        type: 'Regular Checkup',
        description: 'Routine diabetes monitoring',
        diagnosis: 'Blood sugar levels slightly elevated',
        prescription: ['Metformin 500mg - 2x daily', 'Glimepiride 2mg - 1x daily'],
        notes: 'Patient advised to maintain strict diet control'
      },
      {
        id: 'h2',
        date: '2025-08-22',
        type: 'Follow-up',
        description: 'HbA1c test results review',
        diagnosis: 'Diabetes management improving',
        prescription: ['Continue current medication', 'Vitamin D supplement'],
        notes: 'Patient showing good compliance with medication'
      },
      {
        id: 'h3',
        date: '2025-07-10',
        type: 'Initial Consultation',
        description: 'First visit for diabetes management',
        diagnosis: 'Type 2 Diabetes Mellitus confirmed',
        prescription: ['Metformin 500mg - 1x daily initially'],
        notes: 'Patient education provided about diabetes management'
      }
    ]
  },
  {
    id: '2',
    name: 'Suzanne Dantis',
    age: 58,
    condition: 'Hypertension',
    lastVisit: '2025-09-02',
    nextAppointment: '2025-09-16',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
    history: [
      {
        id: 'h4',
        date: '2025-09-02',
        type: 'Regular Checkup',
        description: 'Blood pressure monitoring',
        diagnosis: 'BP well controlled at 130/85',
        prescription: ['Amlodipine 5mg - 1x daily', 'Low sodium diet recommended'],
        notes: 'Patient responding well to current treatment'
      },
      {
        id: 'h5',
        date: '2025-08-15',
        type: 'Emergency Visit',
        description: 'High blood pressure episode',
        diagnosis: 'Hypertensive crisis - controlled',
        prescription: ['Increased Amlodipine to 10mg', 'Emergency medication guidance'],
        notes: 'Patient advised about stress management techniques'
      }
    ]
  },
  {
    id: '3',
    name: 'Yogesh Ghadge',
    age: 72,
    condition: 'Arthritis',
    lastVisit: '2025-08-28',
    nextAppointment: '2025-09-12',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
    history: [
      {
        id: 'h6',
        date: '2025-08-28',
        type: 'Regular Checkup',
        description: 'Joint pain assessment',
        diagnosis: 'Moderate osteoarthritis in knees',
        prescription: ['Ibuprofen 400mg - as needed', 'Physical therapy recommended'],
        notes: 'Patient advised to continue light exercises'
      },
      {
        id: 'h7',
        date: '2025-07-18',
        type: 'X-Ray Review',
        description: 'Joint imaging results',
        diagnosis: 'Degenerative changes confirmed',
        prescription: ['Glucosamine supplements', 'Joint support cream'],
        notes: 'Consider joint replacement consultation if pain worsens'
      }
    ]
  },
  {
    id: '4',
    name: 'Yash Hingu',
    age: 45,
    condition: 'Cardiac Care',
    lastVisit: '2025-09-04',
    nextAppointment: '2025-09-11',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
    history: [
      {
        id: 'h8',
        date: '2025-09-04',
        type: 'Cardiology Consultation',
        description: 'Post-procedure follow-up',
        diagnosis: 'Recovery progressing well post angioplasty',
        prescription: ['Aspirin 75mg - 1x daily', 'Atorvastatin 20mg - 1x evening'],
        notes: 'Patient cleared for light physical activity'
      },
      {
        id: 'h9',
        date: '2025-08-20',
        type: 'Procedure',
        description: 'Coronary angioplasty performed',
        diagnosis: '90% blockage in LAD - successfully treated',
        prescription: ['Clopidogrel 75mg - 1x daily for 1 year', 'Beta-blocker added'],
        notes: 'Procedure successful, patient stable'
      }
    ]
  },
];

export default function PatientsScreen() {
  const { user } = useContext(AuthContext);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const handlePatientPress = (patientId: string) => {
    console.log('Opening patient details for:', patientId);
  };

  const handleHistoryPress = (patientId: string) => {
    setExpandedHistory(expandedHistory === patientId ? null : patientId);
  };

  const renderHistoryEntry = (entry: HistoryEntry) => (
    <View key={entry.id} style={styles.historyEntry}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>{new Date(entry.date).toLocaleDateString()}</Text>
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
          <Text style={styles.headerSubtitle}>{mockPatients.length} active patients</Text>
        </View>
        <TouchableOpacity style={styles.calendarButton} onPress={handleCalendarpress}>
          <Calendar color="#2563EB" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mockPatients.map((patient) => (
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
                    Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}
                  </Text>
                </View>

                {patient.nextAppointment && (
                  <View style={styles.detailItem}>
                    <Calendar color="#10B981" size={16} />
                    <Text style={styles.detailText}>
                      Next: {new Date(patient.nextAppointment).toLocaleDateString()}
                    </Text>
                  </View>
                )}
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

              <TouchableOpacity style={styles.actionButton}>
                <FileText color="#059669" size={18} />
                <Text style={styles.actionText}>Prescriptions</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Calendar color="#7C2D12" size={18} />
                <Text style={styles.actionText}>Schedule</Text>
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
        ))}
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