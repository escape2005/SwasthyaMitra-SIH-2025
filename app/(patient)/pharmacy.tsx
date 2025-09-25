import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TriangleAlert as AlertTriangle, Search, MapPin, Phone, Clock, Star, Navigation, ShoppingCart, Pill, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';

const router = useRouter();

const handleSOSPress = () => {
  router.push('/sos');
};

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  distance: string;
  phone: string;
  rating: number;
  isOpen: boolean;
  openHours: string;
  hasStock: boolean;
  price: number;
  image: string;
}

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  manufacturer: string;
  strength: string;
  type: string;
  description: string;
}

// Mock data for medicines
const mockMedicines: Medicine[] = [
  {
    id: '1',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    manufacturer: 'Cipla Ltd',
    strength: '500mg',
    type: 'Tablet',
    description: 'Pain reliever and fever reducer'
  },
  {
    id: '2',
    name: 'Crocin',
    genericName: 'Paracetamol',
    manufacturer: 'GSK',
    strength: '650mg',
    type: 'Tablet',
    description: 'Fast relief from headache and fever'
  },
  {
    id: '3',
    name: 'Dolo 650',
    genericName: 'Paracetamol',
    manufacturer: 'Micro Labs',
    strength: '650mg',
    type: 'Tablet',
    description: 'Effective pain and fever relief'
  },
  {
    id: '4',
    name: 'Azithromycin',
    genericName: 'Azithromycin',
    manufacturer: 'Sun Pharma',
    strength: '500mg',
    type: 'Tablet',
    description: 'Antibiotic for bacterial infections'
  },
  {
    id: '5',
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    manufacturer: 'Dr. Reddy\'s',
    strength: '20mg',
    type: 'Capsule',
    description: 'Proton pump inhibitor for acid reflux'
  }
];

// Mock data for pharmacies
const mockPharmacies: Pharmacy[] = [
  {
    id: '1',
    name: 'Apollo Pharmacy',
    address: '123 MG Road, Bangalore',
    distance: '0.5 km',
    phone: '+91 98765 43210',
    rating: 4.5,
    isOpen: true,
    openHours: '8:00 AM - 11:00 PM',
    hasStock: true,
    price: 25.50,
    image: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg'
  },
  {
    id: '2',
    name: 'MedPlus',
    address: '456 Brigade Road, Bangalore',
    distance: '1.2 km',
    phone: '+91 98765 43211',
    rating: 4.2,
    isOpen: true,
    openHours: '9:00 AM - 10:00 PM',
    hasStock: true,
    price: 23.00,
    image: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg'
  },
  {
    id: '3',
    name: 'Wellness Forever',
    address: '789 Commercial Street, Bangalore',
    distance: '2.1 km',
    phone: '+91 98765 43212',
    rating: 4.0,
    isOpen: false,
    openHours: '8:30 AM - 9:30 PM',
    hasStock: false,
    price: 28.00,
    image: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg'
  },
  {
    id: '4',
    name: 'Netmeds',
    address: '321 Indiranagar, Bangalore',
    distance: '3.5 km',
    phone: '+91 98765 43213',
    rating: 4.3,
    isOpen: true,
    openHours: '24 Hours',
    hasStock: true,
    price: 22.75,
    image: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg'
  }
];

export default function PharmacyScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a medicine name to search');
      return;
    }

    // Filter medicines based on search query
    const results = mockMedicines.filter(medicine =>
      medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.genericName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setSearchResults(results);
    setShowResults(true);
    setSelectedMedicine(null);
    setPharmacies([]);
  };

  const handleMedicineSelect = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setPharmacies(mockPharmacies);
    setShowResults(false);
  };

  const handleCall = (phone: string, pharmacyName: string) => {
    Alert.alert(
      `Call ${pharmacyName}`,
      `Calling ${phone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', onPress: () => console.log('Calling:', phone) }
      ]
    );
  };

  const handleGetDirections = (address: string) => {
    Alert.alert('Directions', `Getting directions to ${address}`);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        color={index < Math.floor(rating) ? "#F59E0B" : "#E5E7EB"}
        size={14}
        fill={index < Math.floor(rating) ? "#F59E0B" : "none"}
      />
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Find Medicine</Text>
          <Text style={styles.headerSubtitle}>Search nearby pharmacies</Text>
        </View>
        <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
          <AlertTriangle color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search color="#6B7280" size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for medicine..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Results */}
        {showResults && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {searchResults.length > 0 ? (
              searchResults.map((medicine) => (
                <TouchableOpacity
                  key={medicine.id}
                  style={styles.medicineCard}
                  onPress={() => handleMedicineSelect(medicine)}
                >
                  <View style={styles.medicineIcon}>
                    <Pill color="#10B981" size={24} />
                  </View>
                  <View style={styles.medicineInfo}>
                    <Text style={styles.medicineName}>{medicine.name}</Text>
                    <Text style={styles.medicineGeneric}>{medicine.genericName}</Text>
                    <Text style={styles.medicineDetails}>
                      {medicine.strength} • {medicine.type} • {medicine.manufacturer}
                    </Text>
                    <Text style={styles.medicineDescription}>{medicine.description}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No medicines found for "{searchQuery}"</Text>
              </View>
            )}
          </View>
        )}

        {/* Selected Medicine */}
        {selectedMedicine && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Medicine</Text>
            <View style={styles.selectedMedicineCard}>
              <View style={styles.medicineIcon}>
                <Pill color="#10B981" size={28} />
              </View>
              <View style={styles.medicineInfo}>
                <Text style={styles.selectedMedicineName}>{selectedMedicine.name}</Text>
                <Text style={styles.medicineGeneric}>{selectedMedicine.genericName}</Text>
                <Text style={styles.medicineDetails}>
                  {selectedMedicine.strength} • {selectedMedicine.type} • {selectedMedicine.manufacturer}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Pharmacies List */}
        {pharmacies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available at Pharmacies</Text>
            {pharmacies.map((pharmacy) => (
              <View key={pharmacy.id} style={styles.pharmacyCard}>
                <Image source={{ uri: pharmacy.image }} style={styles.pharmacyImage} />

                <View style={styles.pharmacyInfo}>
                  <View style={styles.pharmacyHeader}>
                    <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
                    <View style={styles.stockStatus}>
                      {pharmacy.hasStock ? (
                        <CheckCircle color="#10B981" size={16} />
                      ) : (
                        <XCircle color="#EF4444" size={16} />
                      )}
                      <Text style={[
                        styles.stockText,
                        { color: pharmacy.hasStock ? '#10B981' : '#EF4444' }
                      ]}>
                        {pharmacy.hasStock ? 'In Stock' : 'Out of Stock'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.pharmacyDetails}>
                    <View style={styles.addressContainer}>
                      <MapPin color="#6B7280" size={14} />
                      <Text style={styles.pharmacyAddress}>{pharmacy.address}</Text>
                    </View>

                    <View style={styles.distanceContainer}>
                      <Navigation color="#6B7280" size={14} />
                      <Text style={styles.pharmacyDistance}>{pharmacy.distance} away</Text>
                    </View>
                  </View>

                  <View style={styles.pharmacyMeta}>
                    <View style={styles.ratingContainer}>
                      <View style={styles.stars}>
                        {renderStars(pharmacy.rating)}
                      </View>
                      <Text style={styles.ratingText}>{pharmacy.rating}</Text>
                    </View>

                    <View style={styles.hoursContainer}>
                      <Clock color={pharmacy.isOpen ? "#10B981" : "#EF4444"} size={14} />
                      <Text style={[
                        styles.hoursText,
                        { color: pharmacy.isOpen ? '#10B981' : '#EF4444' }
                      ]}>
                        {pharmacy.isOpen ? 'Open' : 'Closed'} • {pharmacy.openHours}
                      </Text>
                    </View>
                  </View>

                  {pharmacy.hasStock && (
                    <View style={styles.priceContainer}>
                      <ShoppingCart color="#2563EB" size={16} />
                      <Text style={styles.priceText}>₹{pharmacy.price.toFixed(2)}</Text>
                    </View>
                  )}

                  <View style={styles.pharmacyActions}>
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => handleCall(pharmacy.phone, pharmacy.name)}
                    >
                      <Phone color="#FFFFFF" size={16} />
                      <Text style={styles.callButtonText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.directionsButton}
                      onPress={() => handleGetDirections(pharmacy.address)}
                    >
                      <Navigation color="#2563EB" size={16} />
                      <Text style={styles.directionsButtonText}>Directions</Text>
                    </TouchableOpacity>

                    {pharmacy.hasStock && (
                      <TouchableOpacity style={styles.orderButton}>
                        <ShoppingCart color="#10B981" size={16} />
                        <Text style={styles.orderButtonText}>Order</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Search Suggestions */}
        {!showResults && !selectedMedicine && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Medicines</Text>
            <View style={styles.suggestionsContainer}>
              {['Paracetamol', 'Crocin', 'Dolo 650', 'Azithromycin', 'Omeprazole'].map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={styles.suggestionChip}
                  onPress={() => {
                    setSearchQuery(suggestion);
                    handleSearch();
                  }}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
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
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  sosButton: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchSection: {
    paddingVertical: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  searchButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  medicineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  medicineIcon: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  medicineGeneric: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
    marginBottom: 4,
  },
  medicineDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  medicineDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  selectedMedicineCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  selectedMedicineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  noResultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  pharmacyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pharmacyImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  pharmacyInfo: {
    flex: 1,
  },
  pharmacyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pharmacyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  stockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  pharmacyDetails: {
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pharmacyAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pharmacyDistance: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  pharmacyMeta: {
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
    marginLeft: 6,
  },
  pharmacyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  callButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  directionsButton: {
    backgroundColor: '#EBF8FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  directionsButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  orderButton: {
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  orderButtonText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  suggestionText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '500',
  },
});