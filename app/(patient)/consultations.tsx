import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { AuthContext } from '@/contexts/AuthContext';
import {
  TriangleAlert as AlertTriangle,
  Calendar,
  FileText,
  Download,
  Send,
  User,
  Clock,
  ChevronRight,
  ChevronDown,
  Plus,
  Heart,
  Activity,
  Brain,
  Eye,
  Stethoscope,
  Search,
  ArrowLeft,
  Menu,
  X,
  Settings,
  Info,
  Phone,
  UserCheck,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Sidebar Component
interface SideMenuBarProps {
  isVisible: boolean;
  onClose: () => void;
  activeItem: string;
  setActiveItem: (item: string) => void;
}

const SideMenuBar: React.FC<SideMenuBarProps> = ({ isVisible, onClose, activeItem, setActiveItem }) => {
  const menuItems = [
    { icon: User, label: 'Profile', id: 'profile' },
    { icon: UserCheck, label: 'Doctors', id: 'doctors' },
    { icon: Settings, label: 'Settings', id: 'settings' },
    { icon: Info, label: 'About Us', id: 'about' },
    { icon: Phone, label: 'Emergency Contacts', id: 'emergency' }
  ];

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} />
        
        <View style={styles.sidebar}>
          {/* Header */}
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Medical Portal</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#FFFFFF" size={24} />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.sidebarMenu}>
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeItem === item.id;
              
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    isActive && styles.menuItemActive
                  ]}
                  onPress={() => {
                    setActiveItem(item.id);
                    // Handle navigation here
                    console.log(`Navigate to ${item.label}`);
                  }}
                >
                  <IconComponent 
                    color={isActive ? "#FFFFFF" : "#FFFFFF"} 
                    size={20} 
                    style={styles.menuIcon}
                  />
                  <Text style={[
                    styles.menuItemText,
                    isActive && styles.menuItemTextActive
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={styles.sidebarFooter}>
            <Text style={styles.footerText}>© 2025 Medical Portal</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const router = useRouter();
const handleSOSPress = () => {
  router.push('/sos');
};

interface Prescription {
  id: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string;
  medicines: string[];
  instructions: string;
  status: 'active' | 'completed';
}

interface SpecialtyContainer {
  specialty: string;
  prescriptions: Prescription[];
  icon: string;
  color: string;
}

// Dummy data for when no prescriptions are fetched
const dummyPrescriptions: Prescription[] = [
  {
    id: '1',
    doctorName: 'Dr. Priya Sharma',
    doctorSpecialty: 'Cardiology',
    date: '2025-08-15',
    medicines: ['Telma 40mg - Take once daily on empty stomach', 'Glycomet 500mg - Take twice daily with meals'],
    instructions: 'Take medications with food. Monitor blood pressure daily. Follow up in 2 weeks.',
    status: 'active'
  },
  {
    id: '2',
    doctorName: 'Dr. Rajesh Gupta',
    doctorSpecialty: 'Cardiology',
    date: '2025-07-20',
    medicines: ['Losar 50mg - Take once daily', 'Ecosprin 75mg - Take after dinner'],
    instructions: 'Continue current medication. Reduce salt intake. Avoid oily and spicy foods.',
    status: 'completed'
  },
  {
    id: '3',
    doctorName: 'Dr. Sunita Patel',
    doctorSpecialty: 'Cardiology',
    date: '2025-06-10',
    medicines: ['Atorva 20mg - Take at bedtime'],
    instructions: 'Can be taken with or without food. Get cholesterol test done monthly.',
    status: 'active'
  },
  {
    id: '4',
    doctorName: 'Dr. Amit Singh',
    doctorSpecialty: 'Oncology',
    date: '2025-08-25',
    medicines: ['Nolvadex 20mg - Take daily at same time', 'Ondansetron 8mg - Take when nauseous'],
    instructions: 'Take Nolvadx at the same time daily. Use Ondansetron only when experiencing nausea.',
    status: 'active'
  },
  {
    id: '5',
    doctorName: 'Dr. Kavita Joshi',
    doctorSpecialty: 'Oncology',
    date: '2025-07-30',
    medicines: ['Perinorm 10mg - Take before meals'],
    instructions: 'Take 30 minutes before meals. Contact immediately if severe side effects occur.',
    status: 'completed'
  },
  {
    id: '6',
    doctorName: 'Dr. Manoj Kumar',
    doctorSpecialty: 'Neurology',
    date: '2025-08-20',
    medicines: ['Gabapin 300mg - Take three times daily', 'Neurobion Forte - Take once daily'],
    instructions: 'Gradually increase dosage as tolerated. Take with food to avoid stomach upset.',
    status: 'active'
  },
  {
    id: '7',
    doctorName: 'Dr. Deepika Agarwal',
    doctorSpecialty: 'Dermatology',
    date: '2025-08-10',
    medicines: ['Tretinoin 0.025% - Apply at night', 'Sunscreen SPF 30 - Apply daily'],
    instructions: 'Apply Tretinoin sparingly. Always use sunscreen during the day.',
    status: 'active'
  },
  {
    id: '8',
    doctorName: 'Dr. Suresh Reddy',
    doctorSpecialty: 'Orthopedics',
    date: '2025-08-12',
    medicines: ['Diclofenac 50mg - Take twice daily', 'Calcium tablets - Take once daily'],
    instructions: 'Take after meals. Avoid heavy lifting. Physical therapy recommended.',
    status: 'active'
  },
  {
    id: '9',
    doctorName: 'Dr. Anita Mehta',
    doctorSpecialty: 'Pediatrics',
    date: '2025-08-08',
    medicines: ['Paracetamol syrup - 5ml twice daily', 'Vitamin D drops - 2 drops daily'],
    instructions: 'Give with food. Ensure adequate fluid intake. Follow vaccination schedule.',
    status: 'active'
  },
  {
    id: '10',
    doctorName: 'Dr. Ravi Sharma',
    doctorSpecialty: 'Ophthalmology',
    date: '2025-08-05',
    medicines: ['Eye drops - 2 drops twice daily', 'Lubricant drops - As needed'],
    instructions: 'Wash hands before applying drops. Avoid rubbing eyes. Regular eye check-ups.',
    status: 'active'
  }
];

// Updated specialty configuration with more specialties and better icons
const specialtyConfig: { [key: string]: { icon: any, color: string, bgColor: string } } = {
  'Cardiology': { icon: Heart, color: '#EF4444', bgColor: '#FEE2E2' },
  'Oncology': { icon: Activity, color: '#8B5CF6', bgColor: '#F3E8FF' },
  'Neurology': { icon: Brain, color: '#06B6D4', bgColor: '#ECFEFF' },
  'Dermatology': { icon: Eye, color: '#F59E0B', bgColor: '#FEF3C7' },
  'Orthopedics': { icon: Stethoscope, color: '#10B981', bgColor: '#D1FAE5' },
  'Pediatrics': { icon: Heart, color: '#F97316', bgColor: '#FED7AA' },
  'Ophthalmology': { icon: Eye, color: '#EC4899', bgColor: '#FCE7F3' },
  'Psychiatry': { icon: Brain, color: '#7C3AED', bgColor: '#EDE9FE' },
  'Pathology': { icon: Activity, color: '#DC2626', bgColor: '#FEE2E2' },
  'General': { icon: Stethoscope, color: '#6B7280', bgColor: '#F3F4F6' }
};

export default function PrescriptionsScreen() {
  const { user } = useContext(AuthContext);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('profile');

  const fetchPrescriptions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          doctors!prescriptions_doctor_id_fkey(specialty, hospital),
          users!prescriptions_doctor_id_fkey(name, avatar)
        `)
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching prescriptions:', error);
        setPrescriptions(dummyPrescriptions);
      } else if (data && data.length > 0) {
        const mappedPrescriptions: Prescription[] = data.map((pres: any) => ({
          id: pres.id,
          doctorName: pres.users?.name || 'Unknown Doctor',
          doctorSpecialty: pres.doctors?.specialty || 'General',
          date: pres.created_at,
          medicines: Array.isArray(pres.medicines) ? pres.medicines : [],
          instructions: pres.instructions || '',
          status: pres.status,
        }));
        setPrescriptions(mappedPrescriptions);
      } else {
        setPrescriptions(dummyPrescriptions);
      }
    } catch (error) {
      console.error('Unexpected error fetching prescriptions:', error);
      setPrescriptions(dummyPrescriptions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [user]);

  // Group prescriptions by specialty
  const groupedPrescriptions = React.useMemo(() => {
    const grouped: { [key: string]: Prescription[] } = {};
    
    prescriptions.forEach((prescription) => {
      const specialty = prescription.doctorSpecialty || 'General';
      if (!grouped[specialty]) {
        grouped[specialty] = [];
      }
      grouped[specialty].push(prescription);
    });

    return Object.entries(grouped).map(([specialty, prescriptions]) => ({
      specialty,
      prescriptions,
      icon: specialtyConfig[specialty]?.icon || specialtyConfig['General'].icon,
      color: specialtyConfig[specialty]?.color || specialtyConfig['General'].color,
      bgColor: specialtyConfig[specialty]?.bgColor || specialtyConfig['General'].bgColor
    }));
  }, [prescriptions]);

  const isDoctorInterface = user?.role === 'doctor';

  if (isDoctorInterface) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setSidebarVisible(true)}
          >
            <Menu color="#111827" size={24} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Common Prescriptions</Text>
            <Text style={styles.headerSubtitle}>Quick access templates</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.calendarButton}>
              <Calendar color="#2563EB" size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton}>
              <Plus color="#FFFFFF" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.templateCard}>
            <Text style={styles.templateTitle}>Diabetes Management</Text>
            <Text style={styles.templateDescription}>Standard prescription for Type 2 Diabetes</Text>
            <Text style={styles.templateMedicines}>Metformin 500mg, Glipizide 5mg</Text>
          </View>

          <View style={styles.templateCard}>
            <Text style={styles.templateTitle}>Hypertension Control</Text>
            <Text style={styles.templateDescription}>Blood pressure management protocol</Text>
            <Text style={styles.templateMedicines}>Amlodipine 5mg, Losartan 50mg</Text>
          </View>
        </ScrollView>

        <SideMenuBar 
          isVisible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          activeItem={activeMenuItem}
          setActiveItem={setActiveMenuItem}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#059669" />
        <SideMenuBar 
          isVisible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          activeItem={activeMenuItem}
          setActiveItem={setActiveMenuItem}
        />
      </SafeAreaView>
    );
  }

  // If a specialty is selected, show detailed view
  if (selectedSpecialty) {
    const selectedContainer = groupedPrescriptions.find(c => c.specialty === selectedSpecialty);
    if (!selectedContainer) return null;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setSelectedSpecialty(null)}
          >
            <ArrowLeft color="#111827" size={24} />
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>{selectedSpecialty}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setSidebarVisible(true)}
            >
              <Menu color="#111827" size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
              <AlertTriangle color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {selectedContainer.prescriptions.map((prescription) => (
            <View key={prescription.id} style={styles.prescriptionCard}>
              <View style={styles.prescriptionHeader}>
                <Image
                  source={{ uri: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg' }}
                  style={styles.doctorAvatar}
                />
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{prescription.doctorName}</Text>
                  <View style={styles.dateContainer}>
                    <Clock color="#6B7280" size={14} />
                    <Text style={styles.prescriptionDate}>
                      {new Date(prescription.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: prescription.status === 'active' ? '#D1FAE5' : '#F3F4F6' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: prescription.status === 'active' ? '#059669' : '#6B7280' }
                  ]}>
                    {prescription.status === 'active' ? 'ACTIVE' : 'COMPLETED'}
                  </Text>
                </View>
              </View>

              <View style={styles.medicinesSection}>
                <Text style={styles.medicinesTitle}>Medicines:</Text>
                {prescription.medicines.map((medicine, index) => (
                  <View key={index} style={styles.medicineItem}>
                    <Text style={styles.medicineText}>• {medicine}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.instructions}>{prescription.instructions}</Text>

              <View style={styles.prescriptionActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Download color="#2563EB" size={20} />
                  <Text style={styles.actionButtonText}>Download</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Send color="#059669" size={20} />
                  <Text style={styles.actionButtonText}>Send to Pharmacy</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        <SideMenuBar 
          isVisible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          activeItem={activeMenuItem}
          setActiveItem={setActiveMenuItem}
        />
      </SafeAreaView>
    );
  }

  // Main grid view (similar to "Find Your Doctor" layout)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gridHeader}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setSidebarVisible(true)}
        >
          <Menu color="#111827" size={24} />
        </TouchableOpacity>
        <Text style={styles.gridHeaderTitle}>My Prescriptions</Text>
        <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
          <AlertTriangle color="#FFFFFF" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.gridContent} showsVerticalScrollIndicator={false}>
        <View style={styles.specialtyGrid}>
          {groupedPrescriptions.map((container) => {
            const IconComponent = container.icon;
            
            return (
              <TouchableOpacity
                key={container.specialty}
                style={styles.specialtyGridItem}
                onPress={() => setSelectedSpecialty(container.specialty)}
              >
                <View style={[styles.specialtyGridIcon, { backgroundColor: container.bgColor }]}>
                  <IconComponent color={container.color} size={32} />
                </View>
                <Text style={styles.specialtyGridLabel}>{container.specialty}</Text>
                <Text style={styles.specialtyGridCount}>
                  {container.prescriptions.length} prescription{container.prescriptions.length > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <SideMenuBar 
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        activeItem={activeMenuItem}
        setActiveItem={setActiveMenuItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Sidebar Styles
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: screenWidth * 0.8,
    maxWidth: 280,
    backgroundColor: 'transparent',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50, // Account for status bar
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    // Apply gradient background
    backgroundColor: '#00B3FF',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  sidebarMenu: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 15,
    // Continue gradient background
    backgroundColor: '#5603BD',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuItemTextActive: {
    color: '#FFFFFF',
  },
  sidebarFooter: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#5603BD',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  
  // Menu Button
  menuButton: {
    padding: 8,
  },
  
  // Grid Header Styles (updated to include menu button)
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  gridHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  
  // Header Right (for detail view)
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  // Grid Content Styles
  gridContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  specialtyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  specialtyGridItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 32,
  },
  specialtyGridIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  specialtyGridLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  specialtyGridCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // Detail View Header
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  
  // Original styles for other components
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
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  calendarButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  addButton: {
    padding: 8,
    backgroundColor: '#059669',
    borderRadius: 8,
  },
  sosButton: {
    backgroundColor: '#DC2626',
    padding: 10,
    borderRadius: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  
  // Prescription Card Styles
  prescriptionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  prescriptionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  medicinesSection: {
    marginBottom: 12,
  },
  medicinesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  medicineItem: {
    marginBottom: 4,
  },
  medicineText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  instructions: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  prescriptionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  
  // Template styles (for doctor interface)
  templateCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  templateMedicines: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});