import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { AuthContext } from '@/contexts/AuthContext';
import {
  Calendar,
  Clock,
  Mic,
  MicOff,
  User,
  CircleAlert as AlertCircle,
  Filter,
  Bell,
  Video,
  Users,
  Check,
  X
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Audio } from 'expo-av';
import AppointmentRequestModal from '@/components/AppointmentRequestModal';

// Add AppointmentRequest interface
interface AppointmentRequest {
  id: string;
  patient_id: string;
  doctor_id: string;
  patient_name: string;
  requested_time: string;
  appointment_type: 'video' | 'in-person';
  priority: 'high' | 'medium' | 'low';
  symptoms: string;
  status: 'pending' | 'confirmed' | 'rejected';
  consultation_fee: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

const router = useRouter();

const handleCalendarpress = () => {
  router.push('/(doctor)/calendar');
};

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  type: string;
  patient_id: string;
  appointment_date: string;
  status: string;
}

// Dummy appointments data
const dummyAppointments: Appointment[] = [
  {
    id: 'dummy-yogesh',
    patientName: 'Yogesh Ghadge',
    time: '08:30',
    priority: 'high',
    type: 'Emergency Consultation',
    patient_id: 'patient-yogesh',
    appointment_date: new Date().toISOString(),
    status: 'scheduled',
  },
];

export default function AppointmentsScreen() {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [prescriptionModal, setPrescriptionModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [medicines, setMedicines] = useState('');
  const [instructions, setInstructions] = useState('');
  const [micScale] = useState(new Animated.Value(1));
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AppointmentRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'appointments'>('requests');

  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI('AIzaSyB6g9OleRTdwB-vLXiFhvD7ESGarPBvqkQ');
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const fetchAppointmentRequests = async () => {
  if (!user) return;

  try {
    const { data, error } = await supabase
      .from('appointment_requests')
      .select('*')
      .eq('doctor_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching appointment requests:', error);
      Alert.alert('Error', 'Failed to fetch appointment requests.');
    } else {
      // Map the data to ensure all required properties are present
      const mappedRequests = (data || []).map(request => ({
        ...request,
        consultation_fee: request.consultation_fee || 0,
        notes: request.notes || ''
      }));
      setAppointmentRequests(mappedRequests);
    }
  } catch (error) {
    console.error('Unexpected error fetching appointment requests:', error);
    Alert.alert('Error', 'Unexpected error occurred while fetching appointment requests.');
  }
};

  const fetchAppointments = async () => {
  if (!user) return;

  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        users!appointments_patient_id_fkey(name)
      `)
      .eq('doctor_id', user.id)
      .neq('status', 'completed') 
      .order('appointment_date', { ascending: false });

    if (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to fetch appointments.');
      setAppointments([]);
    } else if (data && data.length > 0) {
      const mappedAppointments: Appointment[] = data.map((apt: any) => ({
        id: apt.id,
        patientName: apt.users?.name || 'Unknown Patient',
        time: new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        priority: apt.priority || 'medium' as 'high' | 'medium' | 'low',
        type: apt.type || 'Consultation',
        patient_id: apt.patient_id,
        appointment_date: apt.appointment_date,
        status: apt.status,
      }));
      setAppointments(mappedAppointments);
    } else {
      setAppointments([]);
    }
  } catch (error) {
    console.error('Unexpected error fetching appointments:', error);
    Alert.alert('Error', 'Unexpected error occurred while fetching appointments.');
    setAppointments([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchAppointments();
    fetchAppointmentRequests();
  }, [user]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FEF2F2';
      case 'medium': return '#FFFBEB';
      case 'low': return '#F0FDF4';
      default: return '#F9FAFB';
    }
  };

  const startRecording = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setPrescriptionModal(true);
  };

  const startVoiceRecording = async () => {
    try {
      if (permissionResponse && permissionResponse.status !== 'granted') {
        console.log('Requesting permission..');
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      startRecordingAnimation();
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopVoiceRecording = async () => {
    console.log('Stopping recording..');
    setRecording(null);
    setIsRecording(false);
    stopRecordingAnimation();
    if (recording) {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);

      // Transcribe and parse the audio using Gemini
      if (uri) {
        await transcribeAndParseAudio(uri);
      }
    }
  };

  const startRecordingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(micScale, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(micScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopRecordingAnimation = () => {
    micScale.stopAnimation();
    micScale.setValue(1);
  };

  const transcribeAndParseAudio = async (uri: string) => {
    try {
      // Read the audio file as bytes
      const response = await fetch(uri);
      const blob = await response.blob();

      // React Native Blob does not have arrayBuffer, use FileReader instead
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Use Gemini to transcribe and parse the audio inline
      const result = await model.generateContent([
        'Transcribe this audio clip and extract prescription information. Return in JSON format with keys "medicines" (array of strings) and "instructions" (string).',
        {
          inlineData: {
            mimeType: 'audio/mpeg', // Assuming MP3, adjust if needed
            data: base64Data,
          },
        },
      ]);

      const responseText = await result.response.text();

      let parsedData;
      try {
        // Remove markdown code blocks and backticks if present
        let jsonText = responseText.trim();
        jsonText = jsonText.replace(/```json\n?|\n?```/g, '').replace(/```\n?|\n?```/g, '').replace(/^[`]+/, '').replace(/[`]+$/, '');
        parsedData = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        // Fallback: try to extract information from the raw response
        parsedData = {
          medicines: [],
          instructions: responseText || 'Please review the transcription manually.',
        };
      }

      // Update the medicines and instructions fields
      setMedicines(parsedData.medicines ? parsedData.medicines.join('\n') : '');
      setInstructions(parsedData.instructions || '');
    } catch (error) {
      console.error('Error transcribing and parsing audio:', error);
      Alert.alert('Error', 'Failed to process voice recording.');
    }
  };

  const markAsCompleted = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (error) {
        console.error('Error updating appointment:', error);
        Alert.alert('Error', 'Failed to update appointment status.');
      } else {
        Alert.alert('Success', 'Appointment marked as completed!');
        fetchAppointments(); // Refresh appointments
      }
    } catch (error) {
      console.error('Unexpected error updating appointment:', error);
      Alert.alert('Error', 'Unexpected error occurred while updating appointment.');
    }
  };

  const savePrescription = async () => {
    if (!selectedAppointment || !medicines.trim()) return;

    try {
      // Use Gemini to decode the prescription text
      const prompt = `Parse the following prescription text and extract the medicines and instructions. Return in JSON format with keys "medicines" (array of strings) and "instructions" (string).

Prescription text: ${medicines}

If there are instructions, include them in the instructions field.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const decodedText = await response.text();

      // Parse the JSON response
      let parsedData;
      try {
        // Remove markdown code blocks if present
        let jsonText = decodedText.trim();
        jsonText = jsonText.replace(/```json\n?|\n?```/g, '');
        parsedData = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        // Fallback to manual parsing
        parsedData = {
          medicines: medicines.split('\n').filter(m => m.trim()),
          instructions: instructions || 'Follow as prescribed.',
        };
      }

      // Format medicines with "prescribed:" prefix
      const formattedMedicines = parsedData.medicines
        ? parsedData.medicines.map((medicine: string) => `prescribed: ${medicine}`)
        : medicines.split('\n').filter(m => m.trim()).map((medicine: string) => `prescribed: ${medicine}`);

      const { data, error } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: selectedAppointment.patient_id,
          doctor_id: user?.id,
          appointment_id: selectedAppointment.id,
          medicines: formattedMedicines,
          instructions: parsedData.instructions || instructions || 'Follow as prescribed.',
          status: 'active',
        });

      if (error) {
        console.error('Error saving prescription:', error);
        Alert.alert('Error', 'Failed to save prescription.');
      } else {
        Alert.alert('Success', 'Prescription saved successfully!');
        // Close modal and reset form
        setPrescriptionModal(false);
        setMedicines('');
        setInstructions('');
        setSelectedAppointment(null);
        fetchAppointments(); // Refresh appointments
      }
    } catch (error) {
      console.error('Unexpected error saving prescription:', error);
      Alert.alert('Error', 'Unexpected error occurred while saving prescription.');
    }
  };


  const handleConfirmRequest = async (requestId: string, assignedTime: string) => {
  try {
    const request = appointmentRequests.find(req => req.id === requestId);
    if (!request) return;

    // Update the request status to confirmed
    const { error: updateError } = await supabase
      .from('appointment_requests')
      .update({ 
        status: 'confirmed',
        requested_time: assignedTime,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating appointment request:', updateError);
      Alert.alert('Error', 'Failed to confirm appointment request.');
      return;
    }

    // Create a new appointment
    const { error: insertError } = await supabase
      .from('appointments')
      .insert({
        patient_id: request.patient_id,
        doctor_id: user?.id,
        appointment_date: new Date().toISOString(), // You might want to parse assignedTime properly
        status: 'scheduled',
        priority: request.priority,
        type: 'Consultation',
        appointment_type: request.appointment_type,
        symptoms: request.symptoms
      });

    if (insertError) {
      console.error('Error creating appointment:', insertError);
      Alert.alert('Error', 'Failed to create appointment.');
      return;
    }

    // Refresh both lists
    fetchAppointmentRequests();
    fetchAppointments();
    
    Alert.alert(
      'Appointment Confirmed!', 
      `Appointment with ${request.patient_name} has been confirmed for ${assignedTime}.`,
      [
        { text: 'OK' },
        ...(request.appointment_type === 'video' ? [{
          text: 'Start Video Call',
          onPress: () => {
            router.push({
              pathname: '/video-call',
              params: {
                doctorName: 'Dr. Current Doctor',
                patientName: request.patient_name,
                appointmentTime: assignedTime
              }
            });
          }
        }] : [])
      ]
    );
  } catch (error) {
    console.error('Unexpected error confirming appointment:', error);
    Alert.alert('Error', 'Unexpected error occurred while confirming appointment.');
  }
};

  const handleRejectRequest = async (requestId: string, reason: string) => {
  try {
    const { error } = await supabase
      .from('appointment_requests')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      console.error('Error rejecting appointment request:', error);
      Alert.alert('Error', 'Failed to reject appointment request.');
      return;
    }

    // Refresh the requests list
    fetchAppointmentRequests();
    Alert.alert('Request Rejected', `Appointment request has been rejected. Reason: ${reason}`);
  } catch (error) {
    console.error('Unexpected error rejecting appointment:', error);
    Alert.alert('Error', 'Unexpected error occurred while rejecting appointment.');
  }
};

  const openRequestModal = (request: AppointmentRequest) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const priorityCases = appointments.filter(apt => apt.priority === 'high');
  const regularAppointments = appointments.filter(apt => apt.priority !== 'high');
  const filteredRegularAppointments = priorityFilter === 'all'
    ? regularAppointments
    : regularAppointments.filter(apt => apt.priority === priorityFilter);

  const pendingRequests = appointmentRequests.filter(req => req.status === 'pending');

  console.log('All appointments:', appointments);
  console.log('Priority cases:', priorityCases);
  console.log('Yogesh appointment found:', appointments.find(apt => apt.id === 'dummy-yogesh'));
  console.log('First appointment details:', appointments[0]); const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.filterModalContent}>
          <Text style={styles.modalTitle}>Filter by Priority</Text>

          {['all', 'high', 'medium', 'low'].map((priority) => (
            <TouchableOpacity
              key={priority}
              style={[
                styles.filterOption,
                priorityFilter === priority && styles.selectedFilterOption
              ]}
              onPress={() => {
                setPriorityFilter(priority as 'all' | 'high' | 'medium' | 'low');
                setShowFilterModal(false);
              }}>
              <Text style={[
                styles.filterOptionText,
                priorityFilter === priority && styles.selectedFilterOptionText
              ]}>
                {priority === 'all' ? 'All Priorities' : priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Text>
              {priority !== 'all' && (
                <View style={[
                  styles.priorityIndicator,
                  { backgroundColor: getPriorityColor(priority) }
                ]} />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.closeFilterButton}
            onPress={() => setShowFilterModal(false)}>
            <Text style={styles.closeFilterButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );



  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {activeTab === 'requests' ? 'Appointment Requests' : 'Appointments'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === 'requests'
              ? `${pendingRequests.length} pending requests`
              : `Today, ${new Date().toLocaleDateString()}`
            }
          </Text>
        </View>
        <View style={styles.headerActions}>
          {pendingRequests.length > 0 && (
            <View style={styles.notificationBadge}>
              <Bell color="#FFFFFF" size={20} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            </View>
          )}
          <TouchableOpacity style={styles.calendarButton} onPress={handleCalendarpress}>
            <Calendar color="#2563EB" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointments' && styles.activeTab]}
          onPress={() => setActiveTab('appointments')}
        >
          <Text style={[styles.tabText, activeTab === 'appointments' && styles.activeTabText]}>
            Appointments ({appointments.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'requests' ? (
          /* Appointment Requests */
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell color="#2563EB" size={20} />
              <Text style={styles.sectionTitle}>Pending Requests</Text>
            </View>

            {pendingRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No pending appointment requests</Text>
              </View>
            ) : (
              pendingRequests.map((request) => (
                <TouchableOpacity
                  key={request.id}
                  style={styles.requestCard}
                  onPress={() => openRequestModal(request)}
                >
                  <View style={styles.requestHeader}>
                    <View style={styles.requestInfo}>
                      <Text style={styles.patientName}>{request.patient_name}</Text>
                      <View style={styles.requestTypeContainer}>
                        {request.appointment_type === 'video' ? (
                          <Video color="#2563EB" size={16} />
                        ) : (
                          <Users color="#059669" size={16} />
                        )}
                        <Text style={styles.requestType}>
                          {request.appointment_type === 'video' ? 'Video Call' : 'In-Person'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.requestMeta}>
                      <View style={styles.timeContainer}>
                        <Clock color="#6B7280" size={16} />
                        <Text style={styles.requestTime}>{request.requested_time}</Text>
                      </View>
                      <View style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(request.priority) }
                      ]}>
                        <Text style={styles.priorityText}>{request.priority.toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>

                  {request.symptoms && (
                    <Text style={styles.symptomsText} numberOfLines={2}>
                      Symptoms: {request.symptoms}
                    </Text>
                  )}

                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.quickRejectButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        Alert.alert(
                          'Reject Request',
                          'Are you sure you want to reject this appointment request?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Reject',
                              style: 'destructive',
                              onPress: () => handleRejectRequest(request.id, 'Schedule conflict')
                            }
                          ]
                        );
                      }}
                    >
                      <X color="#FFFFFF" size={16} />
                    </TouchableOpacity>

                    <View style={styles.centerActions}>
                      <Text style={styles.reviewText}>Tap to review & assign time</Text>
                      {request.appointment_type === 'video' && (
                        <TouchableOpacity
                          style={styles.quickVideoButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push({
                              pathname: '/video-call',
                              params: {
                                doctorName: 'Dr. Current Doctor',
                                patientName: request.patient_name,
                                appointmentTime: request.requested_time
                              }
                            });
                          }}
                        >
                          <Video color="#FFFFFF" size={14} />
                          <Text style={styles.quickVideoText}>Quick Call</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.quickAcceptButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleConfirmRequest(request.id, request.requested_time);
                      }}
                    >
                      <Check color="#FFFFFF" size={16} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          /* Existing Appointments Content */
          <>
            {/* Priority Cases */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AlertCircle color="#EF4444" size={20} />
                <Text style={styles.sectionTitle}>Priority Cases</Text>
              </View>

              {priorityCases.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No priority cases today</Text>
                </View>
              ) : (
                priorityCases.map((appointment) => (
                  <View
                    key={appointment.id}
                    style={[
                      styles.appointmentCard,
                      { backgroundColor: getPriorityBgColor(appointment.priority) }
                    ]}>
                    <View style={styles.appointmentHeader}>
                      <View style={styles.appointmentInfo}>
                        <Text style={styles.patientName}>{appointment.patientName}</Text>
                        <Text style={styles.appointmentType}>{appointment.type}</Text>
                      </View>
                      <View style={styles.appointmentMeta}>
                        <View style={styles.timeContainer}>
                          <Clock color="#6B7280" size={16} />
                          <Text style={styles.appointmentTime}>{appointment.time}</Text>
                        </View>
                        <View style={[
                          styles.priorityBadge,
                          { backgroundColor: getPriorityColor(appointment.priority) }
                        ]}>
                          <Text style={styles.priorityText}>{appointment.priority.toUpperCase()}</Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.recordButton}
                      onPress={() => startRecording(appointment)}>
                      <Mic color="#FFFFFF" size={20} />
                      <Text style={styles.recordButtonText}>Record Prescription</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.recordButton, { backgroundColor: '#10B981', marginTop: 8 }]}
                      onPress={() => markAsCompleted(appointment.id)}>
                      <Text style={styles.recordButtonText}>Mark as Completed</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Regular Appointments */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>All Appointments</Text>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setShowFilterModal(true)}>
                  <Filter color="#2563EB" size={20} />
                  <Text style={styles.filterButtonText}>
                    {priorityFilter === 'all' ? 'Filter' : priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)}
                  </Text>
                </TouchableOpacity>
              </View>

              {filteredRegularAppointments.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {priorityFilter === 'all' ? 'No appointments found' : `No ${priorityFilter} priority appointments found`}
                  </Text>
                </View>
              ) : (
                filteredRegularAppointments.map((appointment) => (
                  <View key={appointment.id} style={styles.appointmentCard}>
                    <View style={styles.appointmentHeader}>
                      <View style={styles.appointmentInfo}>
                        <Text style={styles.patientName}>{appointment.patientName}</Text>
                        <Text style={styles.appointmentType}>{appointment.type}</Text>
                      </View>
                      <View style={styles.appointmentMeta}>
                        <View style={styles.timeContainer}>
                          <Clock color="#6B7280" size={16} />
                          <Text style={styles.appointmentTime}>{appointment.time}</Text>
                        </View>
                        <View style={[
                          styles.priorityBadge,
                          { backgroundColor: getPriorityColor(appointment.priority) }
                        ]}>
                          <Text style={styles.priorityText}>{appointment.priority.toUpperCase()}</Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.recordButton}
                      onPress={() => startRecording(appointment)}>
                      <Mic color="#FFFFFF" size={20} />
                      <Text style={styles.recordButtonText}>Record Prescription</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.recordButton, { backgroundColor: '#10B981', marginTop: 8 }]}
                      onPress={() => markAsCompleted(appointment.id)}>
                      <Text style={styles.recordButtonText}>Mark as Completed</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal />

      {/* Appointment Request Modal */}
      <AppointmentRequestModal
        visible={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        request={selectedRequest}
        onConfirm={handleConfirmRequest}
        onReject={handleRejectRequest}
      />

      {/* Prescription Modal */}
      <Modal
        visible={prescriptionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPrescriptionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Prescription</Text>
            <Text style={styles.modalSubtitle}>
              For: {selectedAppointment?.patientName}
            </Text>

            <Text style={styles.inputLabel}>Medicines (one per line):</Text>
            <TextInput
              style={styles.textInput}
              value={medicines}
              onChangeText={setMedicines}
              placeholder="Enter medicines..."
              multiline
              numberOfLines={4}
            />

            <Text style={styles.inputLabel}>Instructions:</Text>
            <TextInput
              style={styles.textInput}
              value={instructions}
              onChangeText={setInstructions}
              placeholder="Enter instructions..."
              multiline
              numberOfLines={2}
            />

            {/* Voice Recording Section */}
            <View style={styles.voiceSection}>
              <Text style={styles.inputLabel}>Voice Recording:</Text>
              <TouchableOpacity
                style={[styles.voiceButton, isRecording && styles.recordingButton]}
                onPress={isRecording ? stopVoiceRecording : startVoiceRecording}>
                <Animated.View style={{ transform: [{ scale: micScale }] }}>
                  {isRecording ? (
                    <MicOff color="#FFFFFF" size={24} />
                  ) : (
                    <Mic color="#FFFFFF" size={24} />
                  )}
                </Animated.View>
                <Text style={styles.voiceButtonText}>
                  {isRecording ? 'Stop Recording' : 'Start Voice Recording'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setPrescriptionModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={savePrescription}>
                <Text style={styles.saveButtonText}>Save Prescription</Text>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBadge: {
    position: 'relative',
    padding: 8,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#2563EB',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  requestHeader: {
    marginBottom: 12,
  },
  requestInfo: {
    marginBottom: 8,
  },
  requestTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  requestType: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  requestMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestTime: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  symptomsText: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centerActions: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  quickVideoButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  quickVideoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  quickRejectButton: {
    backgroundColor: '#EF4444',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAcceptButton: {
    backgroundColor: '#059669',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    textAlign: 'center',
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
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: 8,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  appointmentHeader: {
    marginBottom: 16,
  },
  appointmentInfo: {
    marginBottom: 8,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  appointmentType: {
    fontSize: 14,
    color: '#6B7280',
  },
  appointmentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
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
  recordButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 0.45,
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 0.45,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Filter-related styles
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  filterButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxHeight: '60%',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  selectedFilterOption: {
    backgroundColor: '#EBF8FF',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  selectedFilterOptionText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  closeFilterButton: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  closeFilterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Voice recording styles
  voiceSection: {
    marginBottom: 16,
  },
  voiceButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingButton: {
    backgroundColor: '#EF4444',
  },
  voiceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});