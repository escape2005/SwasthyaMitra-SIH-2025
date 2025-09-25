import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { 
  Video, 
  Phone, 
  Mic, 
  MicOff, 
  VideoOff, 
  Users, 
  Settings,
  MessageCircle,
  PhoneOff,
  Camera,
  RotateCcw
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface VideoConsultationProps {
  doctorName: string;
  patientName: string;
  appointmentTime: string;
  onEndCall: () => void;
}

export default function VideoConsultation({ 
  doctorName, 
  patientName, 
  appointmentTime,
  onEndCall 
}: VideoConsultationProps) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 3000);

    const durationTimer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    if (isConnecting) {
      pulseAnimation.start();
    } else {
      pulseAnimation.stop();
      pulseAnim.setValue(1);
    }

    return () => {
      clearTimeout(connectTimer);
      clearInterval(durationTimer);
      pulseAnimation.stop();
    };
  }, [isConnecting, pulseAnim]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end the consultation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Call', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Consultation Ended',
              `Video consultation completed successfully!\n\nDuration: ${formatDuration(callDuration)}\nWith: ${doctorName}`,
              [{ text: 'OK', onPress: onEndCall }]
            );
          }
        }
      ]
    );
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
  };

  if (isConnecting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.connectingContainer}>
          <Animated.View style={[styles.connectingIcon, { transform: [{ scale: pulseAnim }] }]}>
            <Video color="#2563EB" size={60} />
          </Animated.View>
          <Text style={styles.connectingTitle}>Connecting to {doctorName}</Text>
          <Text style={styles.connectingSubtitle}>Please wait while we establish the connection...</Text>
          
          <View style={styles.appointmentInfo}>
            <Text style={styles.appointmentText}>Scheduled: {appointmentTime}</Text>
            <Text style={styles.patientText}>Patient: {patientName}</Text>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onEndCall}>
            <PhoneOff color="#FFFFFF" size={24} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.videoContainer}>
        {/* Doctor Video (Main) */}
        <View style={styles.mainVideo}>
          {isVideoOff ? (
            <View style={styles.videoOffContainer}>
              <VideoOff color="#FFFFFF" size={48} />
              <Text style={styles.videoOffText}>{doctorName}</Text>
              <Text style={styles.videoOffSubtext}>Camera is off</Text>
            </View>
          ) : (
            <View style={styles.demoVideoContainer}>
              <View style={styles.demoVideo}>
                <Text style={styles.demoVideoText}>📹 {doctorName}</Text>
                <Text style={styles.demoVideoSubtext}>Live Demo Video</Text>
              </View>
            </View>
          )}
        </View>

        {/* Patient Video (Picture in Picture) */}
        <View style={styles.pipVideo}>
          <View style={styles.demoPipContainer}>
            <Text style={styles.pipText}>You</Text>
          </View>
        </View>

        {/* Call Info Overlay */}
        <View style={styles.callInfoOverlay}>
          <View style={styles.callInfo}>
            <View style={styles.connectionStatus}>
              <View style={styles.connectionDot} />
              <Text style={styles.connectionText}>Connected</Text>
            </View>
            <Text style={styles.callDurationText}>{formatDuration(callDuration)}</Text>
          </View>
        </View>

        {/* Control Panel */}
        <View style={styles.controlPanel}>
          <TouchableOpacity 
            style={[styles.controlButton, isMuted && styles.mutedButton]}
            onPress={toggleMute}
          >
            {isMuted ? <MicOff color="#FFFFFF" size={24} /> : <Mic color="#FFFFFF" size={24} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, isVideoOff && styles.videoOffButton]}
            onPress={toggleVideo}
          >
            {isVideoOff ? <VideoOff color="#FFFFFF" size={24} /> : <Camera color="#FFFFFF" size={24} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <RotateCcw color="#FFFFFF" size={24} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <MessageCircle color="#FFFFFF" size={24} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Settings color="#FFFFFF" size={24} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
            <PhoneOff color="#FFFFFF" size={28} />
          </TouchableOpacity>
        </View>

        {/* Demo Watermark */}
        <View style={styles.demoWatermark}>
          <Text style={styles.watermarkText}>DEMO MODE</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  connectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  connectingIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  connectingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  connectingSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 40,
  },
  appointmentInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
    alignItems: 'center',
  },
  appointmentText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  patientText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  mainVideo: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  videoOffContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  videoOffText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  videoOffSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  demoVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
  },
  demoVideo: {
    alignItems: 'center',
  },
  demoVideoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  demoVideoSubtext: {
    fontSize: 16,
    color: '#BFDBFE',
  },
  pipVideo: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 120,
    height: 160,
    backgroundColor: '#059669',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  demoPipContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  callInfoOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  callInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  callDurationText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  controlPanel: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mutedButton: {
    backgroundColor: '#EF4444',
  },
  videoOffButton: {
    backgroundColor: '#EF4444',
  },
  endCallButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoWatermark: {
    position: 'absolute',
    top: height / 2 - 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  watermarkText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.3)',
    transform: [{ rotate: '-15deg' }],
  },
});