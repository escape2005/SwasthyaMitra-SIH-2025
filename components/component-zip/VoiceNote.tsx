import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Send,
  Trash2
} from 'lucide-react-native';

interface VoiceNoteProps {
  onSend: (audioData: string) => void;
  isRecording?: boolean;
  duration?: number;
}

export function VoiceNote({ onSend, isRecording = false, duration = 0 }: VoiceNoteProps) {
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);

  const startRecording = () => {
    setRecording(true);
    setRecordDuration(0);
    // In a real app, this would start audio recording
    console.log('Starting voice recording...');
  };

  const stopRecording = () => {
    setRecording(false);
    setRecordedAudio('dummy_audio_data'); // Simulated audio data
    console.log('Stopping voice recording...');
  };

  const playRecording = () => {
    setPlaying(!playing);
    // In a real app, this would play/pause the recorded audio
    console.log(playing ? 'Pausing audio...' : 'Playing audio...');
  };

  const deleteRecording = () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setRecordedAudio(null);
            setRecordDuration(0);
          }
        }
      ]
    );
  };

  const sendVoiceNote = () => {
    if (recordedAudio) {
      onSend(recordedAudio);
      setRecordedAudio(null);
      setRecordDuration(0);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {recordedAudio ? (
        // Playback interface
        <View style={styles.playbackContainer}>
          <TouchableOpacity style={styles.playButton} onPress={playRecording}>
            {playing ? (
              <Pause color="#FFFFFF" size={20} />
            ) : (
              <Play color="#FFFFFF" size={20} />
            )}
          </TouchableOpacity>
          
          <View style={styles.audioInfo}>
            <Text style={styles.audioText}>Voice Note</Text>
            <Text style={styles.audioDuration}>{formatDuration(recordDuration)}</Text>
          </View>
          
          <View style={styles.audioActions}>
            <TouchableOpacity style={styles.deleteButton} onPress={deleteRecording}>
              <Trash2 color="#EF4444" size={18} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sendAudioButton} onPress={sendVoiceNote}>
              <Send color="#FFFFFF" size={18} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Recording interface
        <View style={styles.recordContainer}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              recording && styles.recordingActive
            ]}
            onPress={recording ? stopRecording : startRecording}>
            {recording ? (
              <MicOff color="#FFFFFF" size={28} />
            ) : (
              <Mic color="#FFFFFF" size={28} />
            )}
          </TouchableOpacity>
          
          <View style={styles.recordInfo}>
            <Text style={styles.recordText}>
              {recording ? 'Recording...' : 'Hold to Record'}
            </Text>
            {recording && (
              <Text style={styles.recordDuration}>
                {formatDuration(recordDuration)}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 50,
    marginRight: 16,
  },
  recordingActive: {
    backgroundColor: '#EF4444',
  },
  recordInfo: {
    flex: 1,
  },
  recordText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  recordDuration: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  playbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 50,
    marginRight: 16,
  },
  audioInfo: {
    flex: 1,
  },
  audioText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  audioDuration: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  audioActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    padding: 10,
    borderRadius: 8,
  },
  sendAudioButton: {
    backgroundColor: '#10B981',
    padding: 10,
    borderRadius: 8,
  },
});