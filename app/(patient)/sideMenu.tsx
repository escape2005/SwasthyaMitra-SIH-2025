// Updated SideMenuBar Component with proper React Native navigation
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import {
  User,
  UserCheck,
  Settings,
  Info,
  Phone,
  X,
} from 'lucide-react-native'; // Important: Use lucide-react-native, not lucide-react

const { width: screenWidth } = Dimensions.get('window');

interface MenuItem {
  icon: React.ComponentType<{ color: string; size: number }>;
  label: string;
  id: string;
  route: string; // Changed from 'router' to 'route' for clarity
}

interface SideMenuBarProps {
  isVisible: boolean;
  onClose: () => void;
  activeItem: string;
  setActiveItem: (item: string) => void;
}

const SideMenuBar: React.FC<SideMenuBarProps> = ({ 
  isVisible, 
  onClose, 
  activeItem, 
  setActiveItem 
}) => {
  const router = useRouter();
  const pathname = usePathname();

  // Define menu items with correct route paths for your app structure
  const menuItems: MenuItem[] = [
    { 
      icon: User, 
      label: 'Profile', 
      id: 'profile', 
      route: '/(patient)/profile' 
    },
    { 
      icon: UserCheck, 
      label: 'Doctors', 
      id: 'doctors', 
      route: '/(patient)/doctors' 
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      id: 'settings', 
      route: '/(patient)/settings' 
    },
    { 
      icon: Info, 
      label: 'About Us', 
      id: 'about', 
      route: '/about' 
    },
    { 
      icon: Phone, 
      label: 'Emergency Contacts', 
      id: 'emergency', 
      route: '/sos' 
    }
  ];

  const handleNavigation = (item: MenuItem) => {
    try {
      // Update active item state
      setActiveItem(item.id);
      
      // Navigate to the route
      router.push(item.route as any);
      
      // Close the sidebar
      onClose();
    } catch (error) {
      console.error(`Navigation error for ${item.label}:`, error);
      // You might want to show an alert or toast here
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          onPress={onClose}
          activeOpacity={1}
        />
        
        <View style={styles.sidebar}>
          {/* Header */}
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>JeevanSetu</Text>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color="#FFFFFF" size={24} />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.sidebarMenu}>
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              // Check if current route matches this menu item
              const isActive = pathname === item.route || activeItem === item.id;
              
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    isActive && styles.menuItemActive
                  ]}
                  onPress={() => handleNavigation(item)}
                  activeOpacity={0.7}
                >
                  <IconComponent 
                    color={isActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.8)"} 
                    size={20} 
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
            <Text style={styles.footerText}>© 2025 JeevanSetu</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: screenWidth * 0.75,
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
    // Updated gradient colors to match your design
    backgroundColor: '#00B3FF',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
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
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 15,
  },
  menuItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
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
});

export default SideMenuBar;