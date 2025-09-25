import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Calendar, Clock, Video, Users, X } from 'lucide-react-native';
import { SampleDoctor } from '@/data/sampleDoctors';
import { useRouter } from 'expo-router';

interface AppointmentBookingModalProps {
  visible: boolean;
  onClose: () => void;
  doctors: SampleDoctor[];
  onBookAppointment: (doctorId: string, appointmentType: 'in-person' | 'video', timeSlot: string) => void;
}

export default function AppointmentBookingModal({
  visible,
  onClose,
  doctors,
  onBookAppointment,
}: AppointmentBookingModalProps) {
  const router = useRouter();
  const [selectedDoctor, setSelectedDoctor] = useState<SampleDoctor | null>(null);
  const [appointmentType, setAppointmentType] = useState<'in-person' | 'video' | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [step, setStep] = useState<'doctor' | 'type' | 'time'>('doctor');

  const handleDoctorSelect = (doctor: SampleDoctor) => {
    setSelectedDoctor(doctor);
    setStep('type');
  };

  const handleTypeSelect = (type: 'in-person' | 'video') => {
    setAppointmentType(type);
    setStep('time');
  };

  const handleTimeSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
  };

  const handleBooking = () => {
    if (selectedDoctor && appointmentType && selectedTimeSlot) {
      onBookAppointment(selectedDoctor.id, appointmentType, selectedTimeSlot);
      
      if (appointmentType === 'video') {
        setTimeout(() => {
          Alert.alert(
            'Start Video Consultation?',
            'Your video appointment is ready. Would you like to start the consultation now?',
            [
              { text: 'Later', style: 'cancel' },
              { 
                text: 'Start Now', 
                onPress: () => {
                  router.push({
                    pathname: '/video-call',
                    params: {
                      doctorName: selectedDoctor.name,
                      patientName: 'Current Patient',
                      appointmentTime: selectedTimeSlot
                    }
                  });
                }
              }
            ]
          );
        }, 1000);
      }
      
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedDoctor(null);
    setAppointmentType(null);
    setSelectedTimeSlot(null);
    setStep('doctor');
    onClose();
  };

  const handleBack = () => {
    if (step === 'type') {
      setStep('doctor');
      setSelectedDoctor(null);
    } else if (step === 'time') {
      setStep('type');
      setAppointmentType(null);
    }
  };

  const renderDoctorSelection = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select a Doctor</Text>
      {doctors.map((doctor) => (
        <TouchableOpacity
          key={doctor.id}
          style={styles.doctorCard}
          onPress={() => handleDoctorSelect(doctor)}
        >
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
            <Text style={styles.doctorHospital}>{doctor.hospital}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>⭐ {doctor.rating}</Text>
              <Text style={styles.experience}>{doctor.experience} experience</Text>
            </View>
            <Text style={styles.fee}>Consultation: ₹{doctor.consultationFee}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTypeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Appointment Type</Text>
      <Text style={styles.selectedDoctor}>Dr. {selectedDoctor?.name}</Text>
      
      <TouchableOpacity
        style={[
          styles.typeCard,
          appointmentType === 'in-person' && styles.selectedTypeCard
        ]}
        onPress={() => handleTypeSelect('in-person')}
      >
        <Users color="#059669" size={32} />
        <Text style={styles.typeTitle}>In-Person Visit</Text>
        <Text style={styles.typeDescription}>
          Visit the doctor at {selectedDoctor?.hospital}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.typeCard,
          appointmentType === 'video' && styles.selectedTypeCard
        ]}
        onPress={() => handleTypeSelect('video')}
      >
        <Video color="#2563EB" size={32} />
        <Text style={styles.typeTitle}>Video Consultation</Text>
        <Text style={styles.typeDescription}>
          Consult from the comfort of your home
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTimeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Time Slot</Text>
      <Text style={styles.selectedDoctor}>Dr. {selectedDoctor?.name}</Text>
      <Text style={styles.selectedType}>
        {appointmentType === 'video' ? '📹 Video Call' : '🏥 In-Person Visit'}
      </Text>
      
      <Text style={styles.availableTitle}>Available Slots</Text>
      <View style={styles.timeGrid}>
        {selectedDoctor?.availableSlots.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[
              styles.timeSlot,
              selectedTimeSlot === slot && styles.selectedTimeSlot
            ]}
            onPress={() => handleTimeSelect(slot)}
          >
            <Clock color={selectedTimeSlot === slot ? "#FFFFFF" : "#6B7280"} size={16} />
            <Text style={[
              styles.timeText,
              selectedTimeSlot === slot && styles.selectedTimeText
            ]}>
              {slot}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              {step !== 'doctor' && <Text style={styles.backText}>← Back</Text>}
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Book Appointment</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X color="#6B7280" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.progressIndicator}>
            <View style={[
              styles.progressStep,
              step === 'doctor' && styles.activeStep
            ]}>
              <Text style={styles.progressText}>1. Doctor</Text>
            </View>
            <View style={[
              styles.progressStep,
              step === 'type' && styles.activeStep
            ]}>
              <Text style={styles.progressText}>2. Type</Text>
            </View>
            <View style={[
              styles.progressStep,
              step === 'time' && styles.activeStep
            ]}>
              <Text style={styles.progressText}>3. Time</Text>
            </View>
          </View>

          {step === 'doctor' && renderDoctorSelection()}
          {step === 'type' && renderTypeSelection()}
          {step === 'time' && renderTimeSelection()}

          {step === 'time' && (
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.bookButton,
                  !selectedTimeSlot && styles.disabledButton
                ]}
                onPress={handleBooking}
                disabled={!selectedTimeSlot}
              >
                <Text style={styles.bookButtonText}>Book Appointment</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '95%',
    maxHeight: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 60,
  },
  backText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
    width: 60,
    alignItems: 'flex-end',
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  },
  progressStep: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  activeStep: {
    backgroundColor: '#2563EB',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  selectedDoctor: {
    fontSize: 16,
    color: '#059669',
    marginBottom: 8,
    fontWeight: '600',
  },
  selectedType: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  doctorCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  doctorInfo: {
    gap: 4,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  doctorHospital: {
    fontSize: 14,
    color: '#6B7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rating: {
    fontSize: 14,
    color: '#6B7280',
  },
  experience: {
    fontSize: 14,
    color: '#6B7280',
  },
  fee: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  typeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  selectedTypeCard: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  availableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  selectedTimeSlot: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedTimeText: {
    color: '#FFFFFF',
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bookButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});