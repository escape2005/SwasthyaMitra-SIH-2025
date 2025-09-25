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
import { Bell, X, Video, Users, Clock, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'video_ready' | 'prescription' | 'reminder';
  timestamp: string;
  isRead: boolean;
  actionData?: {
    doctorName?: string;
    patientName?: string;
    appointmentTime?: string;
    appointmentType?: 'video' | 'in-person';
  };
}

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

const sampleNotifications: Notification[] = [
  {
    id: 'notif-1',
    title: 'Video Consultation Ready',
    message: 'Your appointment with Dr. Rajesh Kumar is ready to start',
    type: 'video_ready',
    timestamp: new Date().toISOString(),
    isRead: false,
    actionData: {
      doctorName: 'Dr. Rajesh Kumar',
      patientName: 'Current Patient',
      appointmentTime: '14:00',
      appointmentType: 'video'
    }
  },
  {
    id: 'notif-2',
    title: 'Appointment Confirmed',
    message: 'Your appointment with Dr. Priya Sharma has been confirmed for tomorrow at 2:00 PM',
    type: 'appointment',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isRead: false,
    actionData: {
      doctorName: 'Dr. Priya Sharma',
      appointmentTime: '14:00',
      appointmentType: 'in-person'
    }
  },
  {
    id: 'notif-3',
    title: 'New Prescription Available',
    message: 'Dr. Amit Patel has prescribed new medications for you',
    type: 'prescription',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: 'notif-4',
    title: 'Appointment Reminder',
    message: 'You have an appointment with Dr. Sneha Reddy in 1 hour',
    type: 'reminder',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    actionData: {
      doctorName: 'Dr. Sneha Reddy',
      appointmentTime: '16:00',
      appointmentType: 'in-person'
    }
  }
];

export default function NotificationCenter({ visible, onClose }: NotificationCenterProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const handleNotificationAction = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.type === 'video_ready' && notification.actionData) {
      Alert.alert(
        'Start Video Consultation',
        `Ready to start your video call with ${notification.actionData.doctorName}?`,
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Start Call',
            onPress: () => {
              onClose();
              router.push({
                pathname: '/video-call',
                params: {
                  doctorName: notification.actionData!.doctorName!,
                  patientName: notification.actionData!.patientName!,
                  appointmentTime: notification.actionData!.appointmentTime!
                }
              });
            }
          }
        ]
      );
    } else if (notification.type === 'appointment') {
      Alert.alert('Appointment Details', notification.message);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'video_ready':
        return <Video color="#2563EB" size={24} />;
      case 'appointment':
        return <Clock color="#059669" size={24} />;
      case 'prescription':
        return <Check color="#10B981" size={24} />;
      case 'reminder':
        return <Bell color="#F59E0B" size={24} />;
      default:
        return <Bell color="#6B7280" size={24} />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Bell color="#2563EB" size={24} />
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerRight}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X color="#6B7280" size={24} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.notificationsList}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Bell color="#9CA3AF" size={48} />
                <Text style={styles.emptyStateText}>No notifications</Text>
                <Text style={styles.emptyStateSubtext}>You're all caught up!</Text>
              </View>
            ) : (
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.isRead && styles.unreadNotification
                  ]}
                  onPress={() => handleNotificationAction(notification)}
                >
                  <View style={styles.notificationIcon}>
                    {getNotificationIcon(notification.type)}
                  </View>
                  
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatTime(notification.timestamp)}
                    </Text>
                  </View>

                  {!notification.isRead && (
                    <View style={styles.unreadDot} />
                  )}
                </TouchableOpacity>
              ))
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  notificationsList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  unreadNotification: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginTop: 8,
    marginLeft: 8,
  },
});