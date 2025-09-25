import React, { useContext } from 'react';
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
import { 
  Calendar, 
  FileText, 
  Download, 
  Send, 
  User, 
  Clock,
  ChevronRight,
  Plus
} from 'lucide-react-native';

import { useRouter } from 'expo-router';
const router = useRouter();
const handleCalendarpress = () => {
  router.push('/(doctor)/calendar');
};

interface Prescription {
  id: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string;
  medicines: string[];
  instructions: string;
  status: 'active' | 'completed';
}

const mockPrescriptions: Prescription[] = [
  {
    id: '1',
    doctorName: 'Dr. Sarah Wilson',
    doctorSpecialty: 'Cardiologist',
    date: '2024-03-12',
    medicines: ['Metformin 500mg', 'Amlodipine 5mg'],
    instructions: 'Take medicines as prescribed. Follow up in 2 weeks.',
    status: 'active',
  },
  {
    id: '2',
    doctorName: 'Dr. Raj Patel',
    doctorSpecialty: 'General Physician',
    date: '2024-03-08',
    medicines: ['Vitamin D 1000 IU', 'Calcium Tablets'],
    instructions: 'Take with meals. Continue for 3 months.',
    status: 'active',
  },
  {
    id: '3',
    doctorName: 'Dr. Priya Sharma',
    doctorSpecialty: 'Endocrinologist',
    date: '2024-02-28',
    medicines: ['Insulin Glargine', 'Blood glucose strips'],
    instructions: 'Monitor blood sugar twice daily.',
    status: 'completed',
  },
];

export default function PrescriptionsScreen() {
  const { user } = useContext(AuthContext);
  const isDoctorInterface = user?.role === 'doctor';

  if (isDoctorInterface) {
    // Doctor's common prescriptions view
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Common Prescriptions</Text>
            <Text style={styles.headerSubtitle}>Quick access templates</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.calendarButton} onPress={handleCalendarpress}>
              <Calendar color="#2563EB" size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton}>
              <Plus color="#FFFFFF" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* Common prescription templates for doctors would go here */}
          <View style={styles.templateCard}>
            <Text style={styles.templateTitle}>Diabetes Management</Text>
            <Text style={styles.templateDescription}>Standard prescription for Type 2 Diabetes</Text>
            <Text style={styles.templateMedicines}>Metformin 500mg, Glipizide 5mg</Text>
          </View>
          
          <View style={styles.templateCard}>
            <Text style={styles.templateTitle}>Hypertension Control</Text>
            <Text style={styles.templateDescription}>Blood pressure management protocol</Text>
            <Text style={styles.templateMedicines}>Amlodipine 5mg, Losartan 50mg</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Patient's prescriptions view
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Prescriptions</Text>
          <Text style={styles.headerSubtitle}>{mockPrescriptions.length} total prescriptions</Text>
        </View>
        <TouchableOpacity style={styles.sosButton}>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mockPrescriptions.map((prescription) => (
          <View key={prescription.id} style={styles.prescriptionCard}>
            <View style={styles.prescriptionHeader}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg' }}
                style={styles.doctorAvatar}
              />
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{prescription.doctorName}</Text>
                <Text style={styles.doctorSpecialty}>{prescription.doctorSpecialty}</Text>
                <View style={styles.dateContainer}>
                  <Clock color="#6B7280" size={14} />
                  <Text style={styles.prescriptionDate}>
                    {new Date(prescription.date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: prescription.status === 'active' ? '#D1FAE5' : '#F3F4F6' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: prescription.status === 'active' ? '#059669' : '#6B7280' }
                ]}>
                  {prescription.status === 'active' ? 'ACTIVE' : 'COMPLETED'}
                </Text>
              </View>
            </View>

            <View style={styles.medicinesSection}>
              <Text style={styles.medicinesTitle}>Medicines:</Text>
              {prescription.medicines.map((medicine, index) => (
                <View key={index} style={styles.medicineItem}>
                  <Text style={styles.medicineText}>• {medicine}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.instructions}>{prescription.instructions}</Text>

            <View style={styles.prescriptionActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Download color="#2563EB" size={20} />
                <Text style={styles.actionButtonText}>Download</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Send color="#059669" size={20} />
                <Text style={styles.actionButtonText}>Send to Pharmacy</Text>
              </TouchableOpacity>
            </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  calendarButton: {
    padding: 12,
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
  },
  addButton: {
    backgroundColor: '#2563EB',
    padding: 12,
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
  templateCard: {
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
  templateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  templateDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  templateMedicines: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  prescriptionCard: {
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
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
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
    marginBottom: 4,
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prescriptionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  medicinesSection: {
    marginBottom: 16,
  },
  medicinesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  medicineItem: {
    marginBottom: 4,
  },
  medicineText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  instructions: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 20,
  },
  prescriptionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
});