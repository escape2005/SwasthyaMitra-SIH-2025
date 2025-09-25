import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { 
  Clock, 
  Calendar, 
  MapPin, 
  Phone,
  MessageCircle,
  ChevronRight
} from 'lucide-react-native';

interface Appointment {
  id: string;
  patientName?: string;
  doctorName?: string;
  time: string;
  date: string;
  type: string;
  location?: string;
  priority?: 'high' | 'medium' | 'low';
  avatar: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  userType: 'doctor' | 'patient';
  onPress: (id: string) => void;
  onCall?: (phone: string) => void;
  onMessage?: (id: string) => void;
}

export function AppointmentCard({ 
  appointment, 
  userType, 
  onPress,
  onCall,
  onMessage 
}: AppointmentCardProps) {
  
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const name = userType === 'doctor' ? appointment.patientName : appointment.doctorName;

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onPress(appointment.id)}>
      
      <View style={styles.cardHeader}>
        <Image source={{ uri: appointment.avatar }} style={styles.avatar} />
        
        <View style={styles.appointmentInfo}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.type}>{appointment.type}</Text>
          {appointment.location && (
            <View style={styles.locationContainer}>
              <MapPin color="#6B7280" size={14} />
              <Text style={styles.location}>{appointment.location}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.timeSection}>
          <View style={styles.timeContainer}>
            <Clock color="#2563EB" size={16} />
            <Text style={styles.time}>{appointment.time}</Text>
          </View>
          
          {appointment.priority && (
            <View style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(appointment.priority) }
            ]}>
              <Text style={styles.priorityText}>
                {appointment.priority.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardActions}>
        {onCall && (
          <TouchableOpacity style={styles.actionButton}>
            <Phone color="#10B981" size={18} />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
        )}
        
        {onMessage && (
          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle color="#2563EB" size={18} />
            <Text style={styles.actionText}>Message</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View Details</Text>
          <ChevronRight color="#6B7280" size={16} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  appointmentInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  timeSection: {
    alignItems: 'flex-end',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  time: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
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
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
    fontWeight: '500',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginRight: 4,
  },
});