import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Calendar, Clock, Video, Users, X, Check, AlertCircle } from 'lucide-react-native';
import { AppointmentRequest } from '@/data/appointmentRequests';

interface AppointmentRequestModalProps {
  visible: boolean;
  onClose: () => void;
  request: AppointmentRequest | null;
  onConfirm: (requestId: string, assignedTime: string) => void;
  onReject: (requestId: string, reason: string) => void;
}

export default function AppointmentRequestModal({
  visible,
  onClose,
  request,
  onConfirm,
  onReject,
}: AppointmentRequestModalProps) {
  const [assignedTime, setAssignedTime] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejection, setShowRejection] = useState(false);

  const availableSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  const handleConfirm = () => {
    if (!assignedTime || !request) return;
    onConfirm(request.id, assignedTime);
    handleClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim() || !request) return;
    onReject(request.id, rejectionReason);
    handleClose();
  };

  const handleClose = () => {
    setAssignedTime('');
    setRejectionReason('');
    setShowRejection(false);
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  if (!request) return null;

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
            <Text style={styles.modalTitle}>Appointment Request</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X color="#6B7280" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.requestCard}>
              <View style={styles.patientHeader}>
                <Text style={styles.patientName}>{request.patient_name}</Text>
                <View style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(request.priority) }
                ]}>
                  <Text style={styles.priorityText}>{request.priority.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.requestDetails}>
                <View style={styles.detailItem}>
                  {request.appointment_type === 'video' ? (
                    <Video color="#2563EB" size={20} />
                  ) : (
                    <Users color="#059669" size={20} />
                  )}
                  <Text style={styles.detailText}>
                    {request.appointment_type === 'video' ? 'Video Consultation' : 'In-Person Visit'}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Clock color="#6B7280" size={20} />
                  <Text style={styles.detailText}>
                    Requested: {request.requested_time}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Calendar color="#6B7280" size={20} />
                  <Text style={styles.detailText}>
                    Fee: ₹{request.consultation_fee}
                  </Text>
                </View>

                {request.patient_phone && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailText}>{request.patient_phone}</Text>
                  </View>
                )}
              </View>

              {request.symptoms && (
                <View style={styles.symptomsSection}>
                  <Text style={styles.sectionTitle}>Symptoms</Text>
                  <Text style={styles.symptomsText}>{request.symptoms}</Text>
                </View>
              )}

              {request.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <Text style={styles.notesText}>{request.notes}</Text>
                </View>
              )}
            </View>

            {!showRejection ? (
              <View style={styles.actionSection}>
                <Text style={styles.sectionTitle}>Assign Time Slot</Text>
                <View style={styles.timeGrid}>
                  {availableSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.timeSlot,
                        assignedTime === slot && styles.selectedTimeSlot
                      ]}
                      onPress={() => setAssignedTime(slot)}
                    >
                      <Text style={[
                        styles.timeText,
                        assignedTime === slot && styles.selectedTimeText
                      ]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => setShowRejection(true)}
                  >
                    <X color="#FFFFFF" size={20} />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      !assignedTime && styles.disabledButton
                    ]}
                    onPress={handleConfirm}
                    disabled={!assignedTime}
                  >
                    <Check color="#FFFFFF" size={20} />
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.rejectionSection}>
                <Text style={styles.sectionTitle}>Rejection Reason</Text>
                <TextInput
                  style={styles.rejectionInput}
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  placeholder="Please provide a reason for rejection..."
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowRejection(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.rejectConfirmButton,
                      !rejectionReason.trim() && styles.disabledButton
                    ]}
                    onPress={handleReject}
                    disabled={!rejectionReason.trim()}
                  >
                    <Text style={styles.rejectConfirmButtonText}>Reject Request</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  requestCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  requestDetails: {
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 60,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  symptomsSection: {
    marginBottom: 16,
  },
  notesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  symptomsText: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  actionSection: {
    marginBottom: 20,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  timeSlot: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  rejectionSection: {
    marginBottom: 20,
  },
  rejectionInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 16,
    minHeight: 80,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectConfirmButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});