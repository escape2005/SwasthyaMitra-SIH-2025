import React, { useContext, useEffect, useState, useCallback } from 'react'; import { supabase } from '@/lib/supabase'; // Add your supabase client import
import { useFocusEffect } from '@react-navigation/native'; // For refreshing on screen focus
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
  patient_id: string;
  doctor_id: string;
  report_type: string;
  file_path: string;
  file_size: string;
  thumbnail_url?: string;
  status: 'pending' | 'reviewed' | 'urgent';
  upload_date: string;
  reviewed_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined patient data
  patient?: {
    id: string;
    name: string;
  };
}

// Update mock reports with local PDF paths


export default function ReportsScreen() {
  const { user } = useContext(AuthContext);
  // ADD these new state variables
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const router = useRouter();

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      let query = supabase
        .from('reports')
        .select(`
          id,
          patient_id,
          doctor_id,
          report_type,
          file_path,
          file_size,
          thumbnail_url,
          status,
          upload_date,
          reviewed_date,
          notes,
          created_at,
          updated_at,
          patient:users!patient_id(
            id,
            name
          )
        `)
        .eq('doctor_id', user.id)
        .order('upload_date', { ascending: false });

      // Apply filter if not 'all'
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      const transformedData = (data || []).map(report => ({
        ...report,
        patient: Array.isArray(report.patient) ? report.patient[0] : report.patient
      }));
      setReports(transformedData);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [user?.id, filterStatus]);

  // ADD: Update report status
  const updateReportStatus = async (reportId: string, newStatus: 'pending' | 'reviewed' | 'urgent') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: newStatus,
          reviewed_date: newStatus === 'reviewed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      // Update local state
      setReports(prevReports =>
        prevReports.map(report =>
          report.id === reportId
            ? { ...report, status: newStatus, reviewed_date: newStatus === 'reviewed' ? new Date().toISOString() : undefined }
            : report
        )
      );
    } catch (err) {
      console.error('Error updating report status:', err);
      Alert.alert('Error', 'Failed to update report status');
    }
  };

  // ADD: Get signed URL for file download
  const getSignedUrl = async (filePath: string): Promise<string> => {
    try {
      let actualFilePath = filePath;

      // If the stored path is a full URL, extract the path after medical-reports/
      if (filePath.startsWith('http')) {
        const url = new URL(filePath);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.findIndex(part => part === 'medical-reports');
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          // Get everything after medical-reports/ (patient-id/filename.pdf)
          actualFilePath = pathParts.slice(bucketIndex + 1).join('/');
        }
      }

      console.log('Original path:', filePath);
      console.log('Extracted path:', actualFilePath);

      const { data, error } = await supabase.storage
        .from('medical-reports')
        .createSignedUrl(actualFilePath, 3600);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('getSignedUrl error:', error);
      throw error;
    }
  };

  // ADD: Initial load and filter change effects
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ADD: Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [fetchReports])
  );

  const handleCalendarpress = () => {
    router.push('/(doctor)/calendar');
  };

  // ADD: Fetch reports from Supabase


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
    const report = reports.find(r => r.id === reportId);
    if (report) {
      handleViewReport(report);
    }
  };
  // Test if we can access the file directly
  const testFileAccess = async () => {
    try {
      // Try to create signed URL for blood.pdf
      const { data, error } = await supabase.storage
        .from('medical-reports')
        .createSignedUrl('blood.pdf', 60);

      if (error) {
        console.error('Access test failed:', error);
        Alert.alert('Access Error', `Cannot access file: ${error.message}`);
      } else {
        console.log('Access test successful:', data.signedUrl);
        Alert.alert('Success!', 'File access working correctly');
      }
    } catch (error) {
      console.error('Test error:', error);
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      setDownloadingId(report.id);

      // Get signed URL from Supabase Storage
      const signedUrl = await getSignedUrl(report.file_path);

      // Create a unique filename
      const timestamp = new Date().getTime();
      const patientName = report.patient?.name || 'Unknown';
      const fileName = `${patientName.replace(/\s+/g, '_')}_${report.report_type.replace(/\s+/g, '_')}_${timestamp}.pdf`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // Download the file
      const downloadResult = await FileSystem.downloadAsync(signedUrl, fileUri);
      console.log('File downloaded to:', downloadResult.uri);

      // Share the file
      await shareFile(downloadResult.uri, fileName);

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
      const signedUrl = await getSignedUrl(report.file_path);
      await Linking.openURL(signedUrl);
    } catch (error) {
      console.error('Error opening PDF:', error);
      Alert.alert('Error', 'Failed to open PDF in external app.');
    }
  };

  // ADD: Handle filter selection
  const handleFilterPress = (status: string) => {
    setFilterStatus(status);
  };

  // ADD: Handle review action
  const handleReviewReport = (reportId: string) => {
    updateReportStatus(reportId, 'reviewed');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Patient Reports</Text>
          <Text style={styles.headerSubtitle}>{reports.length} reports to review</Text>
        </View>
        <TouchableOpacity style={styles.calendarButton} onPress={handleCalendarpress}>
          <Calendar color="#2563EB" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === 'all' && styles.activeTab]}
            onPress={() => handleFilterPress('all')}>
            <Text style={[styles.filterText, filterStatus === 'all' && styles.activeFilterText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === 'urgent' && styles.activeTab]}
            onPress={() => handleFilterPress('urgent')}>
            <Text style={[styles.filterText, filterStatus === 'urgent' && styles.activeFilterText]}>Urgent</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === 'pending' && styles.activeTab]}
            onPress={() => handleFilterPress('pending')}>
            <Text style={[styles.filterText, filterStatus === 'pending' && styles.activeFilterText]}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === 'reviewed' && styles.activeTab]}
            onPress={() => handleFilterPress('reviewed')}>
            <Text style={[styles.filterText, filterStatus === 'reviewed' && styles.activeFilterText]}>Reviewed</Text>
          </TouchableOpacity>
        </View>

        {/* Reports List */}
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchReports}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && reports.length === 0 && (
          <View style={styles.emptyContainer}>
            <FileText color="#9CA3AF" size={48} />
            <Text style={styles.emptyTitle}>No Reports Found</Text>
            <Text style={styles.emptySubtitle}>
              {filterStatus === 'all'
                ? 'No reports have been uploaded yet.'
                : `No ${filterStatus} reports found.`}
            </Text>
          </View>
        )}

        {/* Reports List */}
        {reports.map((report) => (
          <TouchableOpacity
            key={report.id}
            style={styles.reportCard}
            onPress={() => handleReportPress(report.id)}>

            <View style={styles.reportHeader}>
              <Image
                source={{
                  uri: report.thumbnail_url || 'https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg'
                }}
                style={styles.reportThumbnail}
              />

              <View style={styles.reportInfo}>
                <Text style={styles.patientName}>{report.patient?.name || 'Unknown Patient'}</Text>
                <Text style={styles.reportType}>{report.report_type}</Text>

                <View style={styles.reportMeta}>
                  <View style={styles.dateContainer}>
                    <Clock color="#6B7280" size={14} />
                    <Text style={styles.uploadDate}>
                      {new Date(report.upload_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.fileSize}>{report.file_size}</Text>
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
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleReviewReport(report.id)}>
                  <FileText color="#F59E0B" size={18} />
                  <Text style={styles.actionText}>Mark Reviewed</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* PDF Viewer Modal */}
      {/* <Modal
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
      </Modal> */}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
