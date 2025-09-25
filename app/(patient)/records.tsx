import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FileText, Camera as CameraIcon, X, CheckCircle } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import { supabase } from '@/lib/supabase';
import { AuthContext } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

interface HealthReading {
  id: string;
  type: 'blood_pressure' | 'blood_glucose' | 'other';
  systolic?: number;
  diastolic?: number;
  glucose?: number;
  unit: string;
  timestamp: Date;
  notes?: string;
  mealTiming?: 'before_meal' | 'after_meal'; // For blood glucose
}

const GEMINI_API_KEY = 'AIzaSyB6g9OleRTdwB-vLXiFhvD7ESGarPBvqkQ'; // Replace with your actual API key

export default function RecordsScreen() {
  const { user } = useContext(AuthContext);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [readings, setReadings] = useState<HealthReading[]>([]);
  const [selectedType, setSelectedType] = useState<'blood_pressure' | 'blood_glucose' | 'other'>('blood_pressure');
  const [mealTiming, setMealTiming] = useState<'before_meal' | 'after_meal'>('before_meal');
  const [showMealTimingModal, setShowMealTimingModal] = useState(false);
  const [autoTakePicture, setAutoTakePicture] = useState(false);
  const [tempReading, setTempReading] = useState<any>(null);
  const cameraRef = useRef<CameraView>(null);

  const getChartData = () => {
    // Prepare data for charting blood pressure and blood glucose separately
    const bpReadings = readings.filter(r => r.type === 'blood_pressure').slice(0, 10).reverse();
    const bgReadings = readings.filter(r => r.type === 'blood_glucose').slice(0, 10).reverse();

    return {
      labels: bpReadings.map(r => r.timestamp.toLocaleDateString()),
      datasets: [
        {
          data: bpReadings.map(r => r.systolic || 0),
          color: () => '#00B3FF',
          strokeWidth: 2,
          label: 'Systolic',
        },
        {
          data: bpReadings.map(r => r.diastolic || 0),
          color: () => '#3366FF',
          strokeWidth: 2,
          label: 'Diastolic',
        },
        {
          data: bgReadings.map(r => r.glucose || 0),
          color: () => '#5603BD',
          strokeWidth: 2,
          label: 'Blood Glucose',
        },
      ],
      legend: ['Systolic', 'Diastolic', 'Blood Glucose'],
    };
  };

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(0, 179, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    loadReadings();
  }, []);

  useEffect(() => {
    if (cameraVisible && autoTakePicture && cameraRef.current) {
      const takeAutoPicture = async () => {
        try {
          const photo = await cameraRef.current!.takePictureAsync();
          if (photo?.uri) {
            processImage(photo.uri);
          }
        } catch (error) {
          console.error('Error taking picture:', error);
          Alert.alert('Error', 'Failed to take picture');
        } finally {
          setAutoTakePicture(false);
        }
      };
      takeAutoPicture();
    }
  }, [cameraVisible, autoTakePicture]);

  const loadReadings = async () => {
    try {
      if (!user) return;
      const { data, error } = await supabase
        .from('health_readings')
        .select('*')
        .eq('patient_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading readings:', error);
        return;
      }

      if (data) {
        // Convert timestamp strings to Date objects
        const formattedData = data.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          mealTiming: item.meal_timing,
        }));
        setReadings(formattedData);
      }
    } catch (error) {
      console.error('Error loading readings:', error);
    }
  };

  const takePicture = async () => {
    if (selectedType === 'blood_glucose') {
      setShowMealTimingModal(true);
    } else if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo?.uri) {
          processImage(photo.uri);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const takePictureFromCamera = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo?.uri) {
          processImage(photo.uri);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const takePictureWithMealTiming = async () => {
    if (!tempReading || !user) return;

    const { error } = await supabase.from('health_readings').insert({
      patient_id: user.id,
      type: tempReading.type,
      glucose: tempReading.glucose,
      unit: tempReading.unit,
      timestamp: tempReading.timestamp.toISOString(),
      meal_timing: mealTiming,
    });

    if (error) {
      console.error('Error saving reading:', error);
      Alert.alert('Error', 'Failed to save reading');
    } else {
      await loadReadings();
      Alert.alert(
        'Reading Added',
        `Successfully added ${tempReading.glucose} ${tempReading.unit} (${mealTiming === 'before_meal' ? 'Before Meal' : 'After Meal'})`,
        [{ text: 'OK' }]
      );
    }

    setTempReading(null);
    setShowMealTimingModal(false);
    setMealTiming('before_meal');
  };

  const pickImage = async () => {
    // TODO: Implement image picker using Files API or other method
    Alert.alert('Not implemented', 'Image picker is not implemented yet.');
  };

  const processImage = async (imageUri: string) => {
    setProcessing(true);
    setCameraVisible(false);

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Convert image URI to base64 for Gemini API
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const imageData = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix

      const prompt = `Analyze this medical device reading image and extract the health measurements. The image shows a display from a medical device. Please identify:

1. The type of measurement (blood pressure, blood glucose, or other)
2. The numerical values shown
3. The units (mmHg for blood pressure, mg/dL or mmol/L for glucose)
4. Any additional information displayed

Please format your response as JSON with the following structure:
{
  "type": "blood_pressure" | "blood_glucose" | "other",
  "systolic": number (if blood pressure),
  "diastolic": number (if blood pressure),
  "glucose": number (if blood glucose),
  "unit": "string",
  "confidence": number (0-100)
}

If you cannot clearly identify the readings, set confidence to 0.`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData,
          },
        },
      ]);

      const responseText = await result.response.text();

      // Parse the JSON response
      const parsedData = JSON.parse(responseText.replace(/```json\n?|\n?```/g, ''));

      if (parsedData.confidence > 50) {
        const newReading: HealthReading = {
          id: Date.now().toString(),
          type: parsedData.type as 'blood_pressure' | 'blood_glucose' | 'other',
          timestamp: new Date(),
          unit: parsedData.unit || '',
        };

        if (!user) {
          Alert.alert('Error', 'User not authenticated');
          return;
        }

        if (parsedData.type === 'blood_pressure') {
          newReading.systolic = parsedData.systolic;
          newReading.diastolic = parsedData.diastolic;
          const { error } = await supabase.from('health_readings').insert({
            patient_id: user.id,
            type: newReading.type,
            systolic: newReading.systolic,
            diastolic: newReading.diastolic,
            unit: newReading.unit,
            timestamp: newReading.timestamp.toISOString(),
          });
          if (error) {
            console.error('Error saving reading:', error);
            Alert.alert('Error', 'Failed to save reading');
          } else {
            await loadReadings(); // Reload to get updated list
            Alert.alert(
              'Reading Added',
              `Successfully added ${parsedData.systolic}/${parsedData.diastolic} ${parsedData.unit}`,
              [{ text: 'OK' }]
            );
          }
        } else if (parsedData.type === 'blood_glucose') {
          newReading.glucose = parsedData.glucose;
          setTempReading(newReading);
          setShowMealTimingModal(true);
        } else {
          const { error } = await supabase.from('health_readings').insert({
            patient_id: user.id,
            type: newReading.type,
            glucose: newReading.glucose,
            unit: newReading.unit,
            timestamp: newReading.timestamp.toISOString(),
          });
          if (error) {
            console.error('Error saving reading:', error);
            Alert.alert('Error', 'Failed to save reading');
          } else {
            await loadReadings();
            Alert.alert(
              'Reading Added',
              'Successfully added reading',
              [{ text: 'OK' }]
            );
          }
        }
      } else {
        Alert.alert(
          'Unable to Read',
          'Could not clearly identify the readings in the image. Please try again with a clearer photo.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process the image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const deleteReading = async (id: string) => {
    Alert.alert(
      'Delete Reading',
      'Are you sure you want to delete this reading?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('health_readings').delete().eq('id', id);
            if (error) {
              console.error('Error deleting reading:', error);
              Alert.alert('Error', 'Failed to delete reading');
            } else {
              await loadReadings();
            }
          }
        }
      ]
    );
  };

  const renderReading = ({ item }: { item: HealthReading }) => (
    <View style={styles.readingCard}>
      <View style={styles.readingHeader}>
        <Text style={styles.readingType}>
          {item.type === 'blood_pressure' ? 'Blood Pressure' :
            item.type === 'blood_glucose' ? 'Blood Glucose' : 'Other'}
        </Text>
        <TouchableOpacity onPress={() => deleteReading(item.id)}>
          <X color="#EF4444" size={20} />
        </TouchableOpacity>
      </View>

      <Text style={styles.readingValue}>
        {item.type === 'blood_pressure'
          ? `${item.systolic}/${item.diastolic} ${item.unit}`
          : item.type === 'blood_glucose'
            ? `${item.glucose} ${item.unit}`
            : 'N/A'
        }
      </Text>

      {item.type === 'blood_glucose' && item.mealTiming && (
        <Text style={styles.mealTimingText}>
          {item.mealTiming === 'before_meal' ? 'Before Meal' : 'After Meal'}
        </Text>
      )}

      <Text style={styles.readingTime}>
        {item.timestamp.toLocaleString()}
      </Text>
    </View>
  );

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text>No access to camera</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={() => Camera.requestCameraPermissionsAsync()}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Health Records</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            onPress={() => setCameraVisible(true)}
            style={styles.actionButtonWrapper}
          >
            <LinearGradient colors={["#00B3FF", "#5603BD"]} style={styles.actionButton}>
              <CameraIcon color="#FFFFFF" size={24} />
              <Text style={styles.actionButtonText}>Take Photo</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickImage}
            style={styles.actionButtonWrapper}
          >
            <LinearGradient colors={["#00B3FF", "#5603BD"]} style={styles.actionButton}>
              <FileText color="#FFFFFF" size={24} />
              <Text style={styles.actionButtonText}>Select Image</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Type Selection */}
        <View style={styles.typeContainer}>
          <Text style={styles.sectionTitle}>Reading Type</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={styles.typeButton}
              onPress={() => setSelectedType('blood_pressure')}
            >
              <LinearGradient
                colors={selectedType === 'blood_pressure' ? ['#00B3FF', '#5603BD'] : ['#F5F5F5', '#F5F5F5']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[
                  styles.typeButtonText,
                  selectedType === 'blood_pressure' && styles.typeButtonTextActive
                ]}>
                  Blood Pressure
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeButton}
              onPress={() => setSelectedType('blood_glucose')}
            >
              <LinearGradient
                colors={selectedType === 'blood_glucose' ? ['#00B3FF', '#5603BD'] : ['#F5F5F5', '#F5F5F5']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[
                  styles.typeButtonText,
                  selectedType === 'blood_glucose' && styles.typeButtonTextActive
                ]}>
                  Blood Glucose
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeButton}
              onPress={() => setSelectedType('other')}
            >
              <LinearGradient
                colors={selectedType === 'other' ? ['#00B3FF', '#5603BD'] : ['#F5F5F5', '#F5F5F5']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[
                  styles.typeButtonText,
                  selectedType === 'other' && styles.typeButtonTextActive
                ]}>
                  Other
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        {/* Readings List */}
        <View style={styles.readingsContainer}>
          <Text style={styles.sectionTitle}>Recent Readings</Text>
          {readings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No readings yet</Text>
              <Text style={styles.emptySubtext}>Take a photo of your medical device to get started</Text>
            </View>
          ) : (
            <FlatList
              data={readings}
              renderItem={renderReading}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Graph Section */}
        <View style={styles.graphContainer}>
          <Text style={styles.sectionTitle}>Readings Graph</Text>
          {readings.length === 0 ? (
            <Text style={styles.emptyText}>No data to display</Text>
          ) : (
            <LineChart
              data={getChartData()}
              width={Dimensions.get('window').width - 48} // padding horizontal 24 * 2
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
            />
          )}
        </View>
      </ScrollView>

      {/* Camera Modal */}
      <Modal visible={cameraVisible} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraHeader}>
                <TouchableOpacity onPress={() => setCameraVisible(false)}>
                  <X color="#FFFFFF" size={30} />
                </TouchableOpacity>
              </View>

              <View style={styles.cameraInstructions}>
                <Text style={styles.cameraInstructionText}>
                  Position the medical device display in the frame
                </Text>
                <Text style={styles.cameraInstructionSubtext}>
                  Make sure the readings are clearly visible
                </Text>
              </View>

              {!autoTakePicture && (
                <View style={styles.cameraControls}>
                  <TouchableOpacity style={styles.captureButton} onPress={takePictureFromCamera}>
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </CameraView>
        </View>
      </Modal>

      {/* Meal Timing Modal */}
      <Modal visible={showMealTimingModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Meal Timing</Text>
              <TouchableOpacity onPress={() => setShowMealTimingModal(false)}>
                <X color="#6B7280" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalText}>When was this blood glucose reading taken?</Text>

              <TouchableOpacity
                style={[styles.timingButton, mealTiming === 'before_meal' && styles.timingButtonActive]}
                onPress={() => setMealTiming('before_meal')}
              >
                <Text style={[styles.timingButtonText, mealTiming === 'before_meal' && styles.timingButtonTextActive]}>
                  Before Meal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.timingButton, mealTiming === 'after_meal' && styles.timingButtonActive]}
                onPress={() => setMealTiming('after_meal')}
              >
                <Text style={[styles.timingButtonText, mealTiming === 'after_meal' && styles.timingButtonTextActive]}>
                  After Meal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={takePictureWithMealTiming}
              >
                <Text style={styles.confirmButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Processing Modal */}
      <Modal visible={processing} transparent animationType="fade">
        <View style={styles.processingOverlay}>
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#00B3FF" />
            <Text style={styles.processingText}>Analyzing image...</Text>
            <Text style={styles.processingSubtext}>This may take a few seconds</Text>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalContent: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 20,
  },
  timingButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    alignItems: 'center',
  },
  timingButtonActive: {
    backgroundColor: '#00B3FF',
    borderColor: '#00B3FF',
  },
  timingButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  timingButtonTextActive: {
    color: '#FFFFFF',
  },
  confirmButton: {
    backgroundColor: '#00B3FF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  graphContainer: {
    marginBottom: 30,
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  actionButtonWrapper: {
    flex: 1,
    marginHorizontal: 8,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  typeContainer: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradientButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  readingsContainer: {
    flex: 1,
  },
  readingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  readingType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  readingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00B3FF',
    marginBottom: 4,
  },
  readingTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  mealTimingText: {
    fontSize: 14,
    color: '#5603BD',
    fontWeight: '500',
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
  },
  cameraInstructions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  cameraInstructionText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  cameraInstructionSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
  },
  cameraControls: {
    padding: 40,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '80%',
  },
  processingText: {
    fontSize: 18,
    color: '#374151',
    marginTop: 16,
    fontWeight: '600',
  },
  processingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#00B3FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});