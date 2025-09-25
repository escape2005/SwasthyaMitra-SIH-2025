import React from 'react';
import { View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import VideoConsultation from '@/components/VideoConsultation';

export default function VideoCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const doctorName = params.doctorName as string || 'Dr. Smith';
  const patientName = params.patientName as string || 'Patient';
  const appointmentTime = params.appointmentTime as string || 'Now';

  const handleEndCall = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <VideoConsultation
        doctorName={doctorName}
        patientName={patientName}
        appointmentTime={appointmentTime}
        onEndCall={handleEndCall}
      />
    </View>
  );
}