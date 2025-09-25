import React, { useContext, useEffect, useState } from 'react';
import { FileDownloadService } from '@/utils/fileDownload';
import * as Linking from 'expo-linking';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { AuthContext } from '@/contexts/AuthContext';
import { 
  Calendar, 
  FileText, 
  Download, 
  Eye, 
  User,
  Clock,
  ChevronRight,
  X
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface Report {
  id: string;
  patientName: string;
  reportType: string;
  uploadDate: string;
  status: 'pending' | 'reviewed' | 'urgent';
  fileSize: string;
  thumbnail: string;
  pdfPath: any; // Asset require() returns number or string
}

// Update mock reports with local PDF paths
const mockReports: Report[] = [
  {
    id: '1',
    patientName: 'Arvind Yadav',
    reportType: 'Blood Test Results',
    uploadDate: '2025-09-07',
    status: 'pending',
    fileSize: '2.3 MB',
    thumbnail: 'https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg',
    pdfPath: require('../../assets/blood.pdf')
  },
  {
    id: '2',
    patientName: 'Yogesh Ghadge',
    reportType: 'Chest X-Ray',
    uploadDate: '2025-09-04',
    status: 'urgent',
    fileSize: '4.1 MB',
    thumbnail: 'https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg',
    pdfPath: require('../../assets/chest.pdf')
  },
  {
    id: '3',
    patientName: 'Suzanne Dantis',
    reportType: 'ECG Report',
    uploadDate: '2025-08-05',
    status: 'reviewed',
    fileSize: '1.8 MB',
    thumbnail: 'https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg',
    pdfPath: require('../../assets/ecg.pdf')
  },
  {
    id: '4',
    patientName: 'Yash Hingu',
    reportType: 'MRI Scan',
    uploadDate: '2025-05-03',
    status: 'pending',
    fileSize: '8.7 MB',
    thumbnail: 'https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg',
    pdfPath: require('../../assets/mri.pdf')
  },
];

export default function ReportsScreen() {
  const { user } = useContext(AuthContext);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const router = useRouter();

  const handleCalendarpress = () => {
    router.push('/(doctor)/calendar');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'urgent': return '#EF4444';
      case 'pending': return '#F59E0B';
      case 'reviewed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'urgent': return '#FEF2F2';
      case 'pending': return '#FFFBEB';
      case 'reviewed': return '#F0FDF4';
      default: return '#F9FAFB';
    }
  };

  const handleReportPress = (reportId: string) => {
    const report = mockReports.find(r => r.id === reportId);
    if (report) {
      handleViewReport(report);
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      setDownloadingId(report.id);

      // Handle asset resolution for require() assets
      let sourceUri: string;
      if (typeof report.pdfPath === 'number') {
        // It's a bundled asset, resolve it
        const asset = Asset.fromModule(report.pdfPath);
        await asset.downloadAsync();
        sourceUri = asset.localUri || asset.uri;
      } else {
        // It's already a URI string
        sourceUri = report.pdfPath;
      }

      // Create a unique filename
      const timestamp = new Date().getTime();
      const fileName = `${report.patientName.replace(/\s+/g, '_')}_${report.reportType.replace(/\s+/g, '_')}_${timestamp}.pdf`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // Copy the asset to document directory
      await FileSystem.copyAsync({
        from: sourceUri,
        to: fileUri
      });
      console.log('File copied from assets to:', fileUri);

      // Share the file instead of saving to gallery (works better in Expo Go)
      await shareFile(fileUri, fileName);

    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Download Error', `Failed to download the file: ${errorMessage}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const shareFile = async (uri: string, fileName: string) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${fileName}`,
        });
      } else {
        Alert.alert('Sharing not available', 'File sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Share Error', 'Failed to share the file.');
    }
  };

  const handleViewReport = (report: Report) => {
    setViewingReport(report);
    setPdfLoading(true);
    setPdfError(null);
    setCurrentPage(1);
    setTotalPages(0);
  };

  const closePdfViewer = () => {
    setViewingReport(null);
    setPdfLoading(false);
    setPdfError(null);
  };

  const onPdfLoadComplete = (numberOfPages: number) => {
    setPdfLoading(false);
    setTotalPages(numberOfPages);
    console.log(`PDF loaded with ${numberOfPages} pages`);
  };

  const onPdfPageChanged = (page: number) => {
    setCurrentPage(page);
  };

  const onPdfError = (error: any) => {
    setPdfLoading(false);
    setPdfError('Failed to load PDF. Please check the file and try again.');
    console.error('PDF Error:', error);
  };

  const handleOpenExternal = async (report: Report) => {
    try {
      let pdfUri: string;
      if (typeof report.pdfPath === 'number') {
        const asset = Asset.fromModule(report.pdfPath);
        pdfUri = asset.uri;
      } else {
        pdfUri = report.pdfPath;
      }
      await Linking.openURL(pdfUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to open PDF in external app.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Patient Reports</Text>
          <Text style={styles.headerSubtitle}>{mockReports.length} reports to review</Text>
        </View>
        <TouchableOpacity style={styles.calendarButton} onPress={handleCalendarpress}>
          <Calendar color="#2563EB" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <TouchableOpacity style={[styles.filterTab, styles.activeTab]}>
            <Text style={[styles.filterText, styles.activeFilterText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}>
            <Text style={styles.filterText}>Urgent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}>
            <Text style={styles.filterText}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}>
            <Text style={styles.filterText}>Reviewed</Text>
          </TouchableOpacity>
        </View>

        {/* Reports List */}
        {mockReports.map((report) => (
          <TouchableOpacity
            key={report.id}
            style={styles.reportCard}
            onPress={() => handleReportPress(report.id)}>
            
            <View style={styles.reportHeader}>
              <Image source={{ uri: report.thumbnail }} style={styles.reportThumbnail} />
              
              <View style={styles.reportInfo}>
                <Text style={styles.patientName}>{report.patientName}</Text>
                <Text style={styles.reportType}>{report.reportType}</Text>
                
                <View style={styles.reportMeta}>
                  <View style={styles.dateContainer}>
                    <Clock color="#6B7280" size={14} />
                    <Text style={styles.uploadDate}>
                      {new Date(report.uploadDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.fileSize}>{report.fileSize}</Text>
                </View>
              </View>

              <View style={styles.reportStatus}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusBgColor(report.status) }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(report.status) }
                  ]}>
                    {report.status.toUpperCase()}
                  </Text>
                </View>
                <ChevronRight color="#9CA3AF" size={20} />
              </View>
            </View>

            <View style={styles.reportActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleOpenExternal(report)}>
                <Eye color="#2563EB" size={18} />
                <Text style={styles.actionText}>View</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, downloadingId === report.id && styles.disabledButton]}
                onPress={() => handleDownload(report)}
                disabled={downloadingId === report.id}>
                {downloadingId === report.id ? (
                  <>
                    <ActivityIndicator size={18} color="#059669" />
                    <Text style={styles.actionText}>Downloading...</Text>
                  </>
                ) : (
                  <>
                    <Download color="#059669" size={18} />
                    <Text style={styles.actionText}>Download</Text>
                  </>
                )}
              </TouchableOpacity>
              
              {report.status === 'pending' && (
                <TouchableOpacity style={styles.actionButton}>
                  <FileText color="#F59E0B" size={18} />
                  <Text style={styles.actionText}>Review</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* PDF Viewer Modal */}
      <Modal
        visible={false}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closePdfViewer}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.pdfHeader}>
            <View style={styles.pdfHeaderLeft}>
              <Text style={styles.pdfTitle}>
                {viewingReport?.reportType}
              </Text>
              <Text style={styles.pdfSubtitle}>
                {viewingReport?.patientName}
              </Text>
              {totalPages > 0 && (
                <Text style={styles.pageInfo}>
                  Page {currentPage} of {totalPages}
                </Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closePdfViewer}>
              <X color="#374151" size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.pdfContainer}>
            {pdfLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Loading PDF...</Text>
              </View>
            )}
            
            {pdfError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{pdfError}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => viewingReport && handleViewReport(viewingReport)}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  calendarButton: {
    padding: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  activeTab: {
    backgroundColor: '#2563EB',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reportThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  reportType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uploadDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  fileSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  reportStatus: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pdfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pdfHeaderLeft: {
    flex: 1,
  },
  pdfTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  pdfSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  pageInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  pdf: {
    flex: 1,
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});
