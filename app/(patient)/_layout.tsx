import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import {
  Home,
  FileText,
  MessageCircle,
  SheetIcon,
  TabletIcon,
} from 'lucide-react-native';
import { View } from 'react-native';

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#5603BD', // active icon outline color
        tabBarInactiveTintColor: '#64748B', // inactive icon outline color
        tabBarStyle: {
          paddingTop: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: 80,
          borderRadius: 40,
          left: 20,
          right: 20,
          bottom: 15,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: 4,
        },
        tabBarIcon: ({ color }) => {
          let IconComponent;
          switch (route.name) {
            case 'today':
              IconComponent = Home;
              break;
            case 'consultations':
              IconComponent = FileText;
              break;
            case 'records':
              IconComponent = SheetIcon;
              break;
            case 'pharmacy':
              IconComponent = TabletIcon;
              break;
            default:
              return null;
          }
          return <IconComponent color={color} size={26} />;
        },
      })}
    >
      <Tabs.Screen name="today" options={{ title: 'Today' }} />
      <Tabs.Screen name="consultations" options={{ title: 'Consultations' }} />

      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Sahayata',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                top: -20, // floating effect
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 8,
                borderRadius: 40,
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={
                  focused
                    ? ['#00B3FF', '#5603BD']
                    : ['#9CA3AF', '#9CA3AF']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <MessageCircle color="#fff" size={30} />
              </LinearGradient>
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            textAlign: 'center',
          },
        }}
      />

      <Tabs.Screen name="records" options={{ title: 'Records' }} />
      <Tabs.Screen name="pharmacy" options={{ title: 'Pharmacy' }} />

      {/* Hidden screens */}
      <Tabs.Screen name="doctors" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="sos" options={{ href: null }} />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
      <Tabs.Screen name="prescriptions" options={{ href: null }} />
      <Tabs.Screen name="sideMenu" options={{href: null}}/>
    </Tabs>
    
  );
}