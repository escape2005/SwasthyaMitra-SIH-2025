import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

// Define file mappings based on report types
const FILE_MAPPINGS: { [key: string]: string } = {
  'Blood Test Results': 'blood.pdf',
  'Chest X-Ray': 'chest.pdf',
  'ECG Report': 'ecg.pdf',
  'MRI Scan': 'mri.pdf',
};

export class FileDownloadService {
  
  /**
   * Download a report file based on report type
   * @param reportType - The type of report (e.g., 'Blood Test Results')
   * @param patientName - Patient name for file naming
   */
  static async downloadReport(reportType: string, patientName: string): Promise<void> {
    try {
      // Get the corresponding PDF filename
      const fileName = FILE_MAPPINGS[reportType];
      if (!fileName) {
        throw new Error(`No file mapping found for report type: ${reportType}`);
      }

      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant storage permission to download files.');
        return;
      }

      // Define source path (your PDF files in components folder)
      const sourceUri = `${FileSystem.bundleDirectory}components/${fileName}`;
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(sourceUri);
      if (!fileInfo.exists) {
        throw new Error(`File not found: ${fileName}`);
      }

      // Create download directory
      const downloadDir = `${FileSystem.documentDirectory}downloads/`;
      await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });

      // Generate unique filename with patient name and timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const sanitizedPatientName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
      const downloadFileName = `${sanitizedPatientName}_${reportType.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`;
      const downloadUri = `${downloadDir}${downloadFileName}`;

      // Copy file to downloads directory
      await FileSystem.copyAsync({
        from: sourceUri,
        to: downloadUri
      });

      // For Android, also save to media library
      if (Platform.OS === 'android') {
        const asset = await MediaLibrary.createAssetAsync(downloadUri);
        await MediaLibrary.createAlbumAsync('Medical Reports', asset, false);
      }

      // Share the file (opens system share dialog)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${reportType} - ${patientName}`
        });
      }

      Alert.alert(
        'Download Complete',
        `${reportType} for ${patientName} has been downloaded successfully.`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(
        'Download Failed',
        // `Failed to download the report: ${error.message}`,
        // [{ text: 'OK' }]
      );
    }
  }

  /**
   * Get file size for display purposes
   * @param reportType - The type of report
   */
  static async getFileSize(reportType: string): Promise<string> {
    try {
      const fileName = FILE_MAPPINGS[reportType];
      if (!fileName) return 'Unknown';

      const sourceUri = `${FileSystem.bundleDirectory}components/${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(sourceUri);
      
      if (fileInfo.exists && fileInfo.size) {
        const sizeInMB = (fileInfo.size / (1024 * 1024)).toFixed(1);
        return `${sizeInMB} MB`;
      }
      return 'Unknown';
    } catch (error) {
      console.error('Error getting file size:', error);
      return 'Unknown';
    }
  }

  /**
   * Check if file exists in bundle
   * @param reportType - The type of report
   */
  static async checkFileExists(reportType: string): Promise<boolean> {
    try {
      const fileName = FILE_MAPPINGS[reportType];
      if (!fileName) return false;

      const sourceUri = `${FileSystem.bundleDirectory}components/${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(sourceUri);
      return fileInfo.exists;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }
}