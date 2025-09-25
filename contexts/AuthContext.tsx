import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  role: 'doctor' | 'patient';
  name: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (role: 'doctor' | 'patient') => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'doctor' | 'patient') => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  checkPatientOnboarding: (userId: string) => Promise<boolean>;
  checkPatientOnboardingComplete: (userId: string) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  loginWithGoogle: async () => {},
  signup: async () => {},
  logout: () => {},
  isLoading: false,
  isAuthenticated: false,
  checkPatientOnboarding: async () => false,
  checkPatientOnboardingComplete: async () => false,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [intendedRole, setIntendedRole] = useState<'doctor' | 'patient' | null>(null);

  // Derive isAuthenticated from user state
  const isAuthenticated = user !== null;

  // Helper to fetch user profile from Supabase users table
  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    if (!supabaseUser) return null;
    const { data, error } = await supabase
      .from('users')
      .select('id, name, avatar, email, role')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return {
      id: data.id,
      email: supabaseUser.email || '',
      role: data.role,
      name: data.name || '',
      avatar: data.avatar || '',
    };
  };

  const checkPatientOnboarding = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('profile_completed')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking patient onboarding:', error);
        return false;
      }

      return data?.profile_completed || false;
    } catch (error) {
      console.error('Exception checking patient onboarding:', error);
      return false;
    }
  };

  const checkPatientOnboardingComplete = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('profile_completed, medical_history_completed')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking patient onboarding completion:', error);
        return false;
      }

      if (!data) {
        return false;
      }

      return data.profile_completed && data.medical_history_completed;
    } catch (error) {
      console.error('Exception checking patient onboarding completion:', error);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Attempting login with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Login error:', error);
        // Handle specific Supabase errors
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address before logging in.');
        } else {
          throw new Error(`Login failed: ${error.message}`);
        }
      }
      if (data.user) {
        console.log('Auth successful, fetching profile for user:', data.user.id);
        const userProfile = await fetchUserProfile(data.user);
        console.log('User profile:', userProfile);
        if (!userProfile) {
          throw new Error('User profile not found. Please contact support.');
        }
        setUser(userProfile);
        console.log('Login successful');
      } else {
        throw new Error('No user data returned from authentication service');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (role: 'doctor' | 'patient') => {
    setIntendedRole(role);
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'your-app-scheme://auth/callback' // Replace with your app's deep link
      }
    });
    if (error) {
      setIsLoading(false);
      throw error;
    }
    // Note: User data will be handled in the auth state change listener
    setIsLoading(false);
  };

  const signup = async (email: string, password: string, uname: string, urole: 'doctor' | 'patient') => {
    setIsLoading(true);
    try {
      console.log('Attempting signup with:', email, uname, urole);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data:{
            name: uname,
            role: urole,
          }
        }
      });
      if (error) {
        console.error('Signup auth error:', error);
        throw error;
      }
      if (!data.user) {
        throw new Error('Signup failed - no user data returned');
      }

      const userId = data.user.id;
      console.log('User created with ID:', userId);

      // Insert user profile into Supabase users table
      try {
        const { error: rpcError } = await supabase.rpc('handle_new_user', { _id: userId, _role: urole });
        if (rpcError) {
          console.error('RPC error:', rpcError);
          // Don't throw here, as the user was created in auth
          console.warn('User profile creation failed, but auth signup succeeded');
        } else {
          console.log('User profile created successfully');
        }

        // For patients, ensure patient record is created with profile_completed = false
        if (urole === 'patient') {
          const { error: patientError } = await supabase
            .from('patients')
            .upsert({
              id: userId,
              profile_completed: false,
              medical_history_completed: false,
            }, {
              onConflict: 'id'
            });

          if (patientError) {
            console.error('Error creating patient record:', patientError);
          } else {
            console.log('Patient record created successfully');
          }
        }
      } catch (rpcError) {
        console.error('Error calling handle_new_user:', rpcError);
      }

    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      console.log('Logging out user...');
      await supabase.auth.signOut();
      setUser(null);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Test Supabase connection on mount
    testSupabaseConnection();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session: Session | null) => {
      if (session?.user) {
        // Use intendedRole if set, otherwise default to patient
        const userProfile = await fetchUserProfile(session.user);
        setUser(userProfile);
        setIntendedRole(null);
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [intendedRole]);

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, signup, logout, isLoading, isAuthenticated, checkPatientOnboarding, checkPatientOnboardingComplete }}>
      {children}
    </AuthContext.Provider>
  );
}
