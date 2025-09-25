import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase'; // Adjust the import path as needed

interface Appointment {
  id: string;
  date: string;
  patientName: string;
  time: string;
  condition: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  patient_id: string;
  doctor_id: string;
  symptoms?: string;
  notes?: string;
  type?: string;
  appointment_type: 'video' | 'in-person';
  priority: 'high' | 'medium' | 'low';
}

export default function CalendarScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  // Get current user (doctor) ID
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setDoctorId(user.id);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        Alert.alert('Error', 'Failed to get user information');
      }
    };

    getCurrentUser();
  }, []);

  // Fetch appointments for the current doctor
  useEffect(() => {
    if (doctorId) {
      fetchAppointments();
    }
  }, [doctorId, currentDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Get the first and last day of the current month
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:users!appointments_patient_id_fkey(name)
        `)
        .eq('doctor_id', doctorId)
        .gte('appointment_date', firstDay.toISOString())
        .lte('appointment_date', lastDay.toISOString())
        .order('appointment_date', { ascending: true });

      if (error) {
        throw error;
      }

      const formattedAppointments: Appointment[] = data?.map(apt => ({
        id: apt.id,
        date: new Date(apt.appointment_date).toISOString().split('T')[0],
        patientName: apt.patient?.name || 'Unknown Patient',
        time: new Date(apt.appointment_date).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        condition: apt.symptoms || apt.type || 'General Consultation',
        status: apt.status,
        patient_id: apt.patient_id,
        doctor_id: apt.doctor_id,
        symptoms: apt.symptoms,
        notes: apt.notes,
        type: apt.type,
        appointment_type: apt.appointment_type,
        priority: apt.priority
      })) || [];

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getAppointmentsForDate = (dateString: string) => {
    return appointments.filter(apt => apt.date === dateString);
  };

  const hasAppointment = (dateString: string) => {
    return getAppointmentsForDate(dateString).length > 0;
  };

  const getAppointmentStatus = (dateString: string) => {
    const dayAppointments = getAppointmentsForDate(dateString);
    if (dayAppointments.length === 0) return null;
    
    // Prioritize status: if any completed, show green; if any scheduled/confirmed, show yellow
    const hasCompleted = dayAppointments.some(apt => apt.status === 'completed');
    const hasScheduled = dayAppointments.some(apt => apt.status === 'scheduled' || apt.status === 'confirmed');
    
    if (hasCompleted && hasScheduled) {
      return 'mixed'; // Both completed and scheduled
    } else if (hasCompleted) {
      return 'completed';
    } else if (hasScheduled) {
      return 'scheduled';
    }
    return 'cancelled';
  };

  const getAppointmentDotColor = (status: string | null) => {
    switch (status) {
      case 'completed':
        return '#10B981'; // Green
      case 'scheduled':
        return '#F59E0B'; // Yellow
      case 'mixed':
        return '#8B5CF6'; // Purple for mixed
      case 'cancelled':
        return '#EF4444'; // Red
      default:
        return '#EF4444'; // Red as default
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedDate(null);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Day headers
    const dayHeaders = dayNames.map(day => (
      <View key={day} style={styles.dayHeader}>
        <Text style={styles.dayHeaderText}>{day}</Text>
      </View>
    ));

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.dayCell}>
          <Text style={styles.emptyDayText}></Text>
        </View>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
      const hasApt = hasAppointment(dateString);
      const appointmentStatus = getAppointmentStatus(dateString);
      const isSelected = selectedDate === dateString;

      days.push(
  <TouchableOpacity
    key={day}
    style={[
      styles.dayCell,
      isSelected && styles.selectedDayCell,
    ]}
    onPress={() => setSelectedDate(dateString)}
  >
    <View style={styles.dayContent}>
      <Text style={[
        styles.dayText,
        hasApt && styles.appointmentDayText,
        isSelected && styles.selectedDayText,
      ]}>
        {day}
      </Text>
      {hasApt && !isSelected && (
        <View style={[
          styles.appointmentDot,
          { backgroundColor: getAppointmentDotColor(appointmentStatus) }
        ]} />
      )}
    </View>
  </TouchableOpacity>
);
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.dayHeaderContainer}>
          {dayHeaders}
        </View>
        <View style={styles.daysContainer}>
          {days}
        </View>
      </View>
    );
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { backgroundColor: '#10B981', color: '#FFFFFF' };
      case 'scheduled':
      case 'confirmed':
        return { backgroundColor: '#F59E0B', color: '#FFFFFF' };
      case 'cancelled':
        return { backgroundColor: '#EF4444', color: '#FFFFFF' };
      default:
        return { backgroundColor: '#6B7280', color: '#FFFFFF' };
    }
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const selectedAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];
  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.date + 'T00:00:00') >= new Date(new Date().toDateString())
  ).slice(0, 10); // Show next 10 appointments

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="#2563EB" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Month Navigation */}
        <View style={styles.monthNavigation}>
          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
            <ChevronLeft color="#374151" size={20} />
          </TouchableOpacity>
          <Text style={styles.monthText}>{monthYear}</Text>
          <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
            <ChevronRight color="#374151" size={20} />
          </TouchableOpacity>
        </View>

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </View>
        )}

        {/* Calendar */}
        {renderCalendar()}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Scheduled/Confirmed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
            <Text style={styles.legendText}>Mixed Status</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Cancelled</Text>
          </View>
        </View>

        {/* Selected Date Appointments */}
        {selectedDate && (
          <View style={styles.appointmentsSection}>
            <Text style={styles.appointmentsSectionTitle}>
              Appointments for {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            
            {selectedAppointments.length > 0 ? (
              selectedAppointments.map((appointment) => (
                <View key={appointment.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <View style={styles.patientAvatar}>
                      <User color="#6B7280" size={16} />
                    </View>
                    <View style={styles.appointmentInfo}>
                      <Text style={styles.patientName}>{appointment.patientName}</Text>
                      <Text style={styles.appointmentTime}>
                        {appointment.time} • {appointment.appointment_type}
                      </Text>
                      <Text style={styles.condition}>{appointment.condition}</Text>
                      {appointment.priority !== 'medium' && (
                        <Text style={[styles.priority, 
                          appointment.priority === 'high' ? styles.highPriority : styles.lowPriority
                        ]}>
                          {appointment.priority.toUpperCase()} PRIORITY
                        </Text>
                      )}
                    </View>
                    <View style={[styles.statusBadge, getStatusBadgeStyle(appointment.status)]}>
                      <Text style={[styles.statusText, { color: getStatusBadgeStyle(appointment.status).color }]}>
                        {appointment.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noAppointmentsCard}>
                <CalendarIcon color="#9CA3AF" size={24} />
                <Text style={styles.noAppointmentsText}>No appointments scheduled</Text>
              </View>
            )}
          </View>
        )}

        {/* All Upcoming Appointments */}
        <View style={styles.upcomingSection}>
          <Text style={styles.upcomingSectionTitle}>Upcoming Appointments</Text>
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <TouchableOpacity 
                key={appointment.id} 
                style={styles.upcomingAppointmentCard}
                onPress={() => setSelectedDate(appointment.date)}
              >
                <View style={styles.appointmentHeader}>
                  <View style={styles.patientAvatar}>
                    <User color="#6B7280" size={16} />
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.patientName}>{appointment.patientName}</Text>
                    <Text style={styles.appointmentTime}>
                      {appointment.time} • {appointment.appointment_type}
                    </Text>
                    <Text style={styles.condition}>{appointment.condition}</Text>
                  </View>
                  <View style={styles.appointmentDate}>
                    <Text style={styles.appointmentDateText}>
                      {new Date(appointment.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <View style={[styles.smallStatusBadge, getStatusBadgeStyle(appointment.status)]}>
                      <Text style={[styles.smallStatusText, { color: getStatusBadgeStyle(appointment.status).color }]}>
                        {appointment.status.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noAppointmentsCard}>
              <CalendarIcon color="#9CA3AF" size={24} />
              <Text style={styles.noAppointmentsText}>No upcoming appointments</Text>
            </View>
          )}
        </View>
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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  navButton: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dayHeaderContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7 days
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  selectedDayCell: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '400',
    textAlign: 'center',
  },
  appointmentDayText: {
    color: '#2563EB',
    fontWeight: 'bold',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyDayText: {
    fontSize: 16,
    color: 'transparent',
  },
  appointmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  legend: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  appointmentsSection: {
    marginBottom: 24,
  },
  appointmentsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  noAppointmentsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  noAppointmentsText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  condition: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  priority: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  highPriority: {
    color: '#EF4444',
  },
  lowPriority: {
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  smallStatusBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  smallStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  upcomingSection: {
    marginBottom: 32,
  },
  upcomingSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  upcomingAppointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  appointmentDate: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  appointmentDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  // ADD this new style after your existing styles:
dayContent: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: 4,
},
});