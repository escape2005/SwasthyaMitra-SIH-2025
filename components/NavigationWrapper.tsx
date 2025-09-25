import { useContext, useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { AuthContext } from '@/contexts/AuthContext';

export function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Wait for the navigation to be ready before performing redirects
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100); // Small delay to ensure navigation is mounted

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Don't perform navigation until everything is ready
    if (isLoading || !isNavigationReady) return;

    const inDoctorGroup = segments[0] === '(doctor)';
    const inPatientGroup = segments[0] === '(patient)';
    const inAuthScreens = segments[0] === undefined || segments[0] === 'login';
    const inProtectedRoutes = inDoctorGroup || inPatientGroup;

    // Add a small delay before navigation to ensure components are mounted
    const performNavigation = () => {
      if (!isAuthenticated && inProtectedRoutes) {
        // User is not authenticated but trying to access protected routes
        router.replace('/');
      } else if (isAuthenticated && user) {
        if (inAuthScreens) {
          // User is authenticated but on auth screens - redirect to appropriate dashboard
          if (user.role === 'doctor') {
            router.replace('/(doctor)/appointments');
          } else if (user.role === 'patient') {
            router.replace('/(patient)/today');
          }
        } else if (user.role === 'doctor' && inPatientGroup) {
          // Doctor trying to access patient routes
          router.replace('/(doctor)/appointments');
        } else if (user.role === 'patient' && inDoctorGroup) {
          // Patient trying to access doctor routes
          router.replace('/(patient)/today');
        }
      }
    };

    // Use a small timeout to ensure navigation is ready
    const navigationTimer = setTimeout(performNavigation, 50);
    
    return () => clearTimeout(navigationTimer);
  }, [isAuthenticated, user, segments, isLoading, isNavigationReady, router]);

  return <>{children}</>;
}