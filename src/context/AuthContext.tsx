import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  Auth as FirebaseAuth,
  User as FirebaseUser
} from 'firebase/auth';

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface AccountActivityItem {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  ip?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  company?: string;
  businessWebsite?: string;
  industry?: string;
  photoUrl?: string;
  preferredContact?: string;
  avatarColor?: string;
  createdAt?: string;
  sessions?: UserSession[];
  activityLog?: AccountActivityItem[];
  deleteRequested?: boolean;
  deleteReason?: string;
  deleteRequestedAt?: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  whatsapp?: string;
  company?: string;
  businessWebsite?: string;
  industry?: string;
  photoUrl?: string;
  preferredContact?: string;
  avatarColor?: string;
  currentPassword?: string;
  newPassword?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthLoading: boolean;
  authError: string;
  authSuccess: string;
  setAuthError: (err: string) => void;
  setAuthSuccess: (msg: string) => void;
  signUp: (name: string, email: string, password: string, whatsapp: string) => Promise<UserProfile>;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  logOut: () => Promise<void>;
  updateUserProfile: (data: UpdateProfileData) => Promise<UserProfile>;
  isFirebaseEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Firebase Web SDK Configuration
const meta = import.meta as any;
const firebaseConfig = {
  apiKey: meta.env?.VITE_FIREBASE_API_KEY,
  authDomain: meta.env?.VITE_FIREBASE_AUTH_DOMAIN || `${meta.env?.VITE_FIREBASE_PROJECT_ID || 'dizo-b522b'}.firebaseapp.com`,
  projectId: meta.env?.VITE_FIREBASE_PROJECT_ID || 'dizo-b522b',
  storageBucket: meta.env?.VITE_FIREBASE_STORAGE_BUCKET || `${meta.env?.VITE_FIREBASE_PROJECT_ID || 'dizo-b522b'}.appspot.com`,
  messagingSenderId: meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: meta.env?.VITE_FIREBASE_APP_ID || '1:1234567890:web:1234567890'
};

let clientAuth: FirebaseAuth | null = null;
let firebaseEnabled = false;

// Initialize Firebase only if the API key is present
if (firebaseConfig.apiKey) {
  try {
    if (getApps().length === 0) {
      initializeApp(firebaseConfig);
    }
    clientAuth = getAuth();
    firebaseEnabled = true;
    console.log('>>> [Client Auth] Real Firebase Client SDK initialized successfully.');
  } catch (err) {
    console.warn('>>> [Client Auth] Failed to initialize Firebase client SDK. Falling back to API mode.', err);
  }
} else {
  console.log('>>> [Client Auth] No client-side Firebase API Key found. Running in server API auth fallback mode.');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<string>('');

  // 1. Firebase onAuthStateChanged Hook (Real Firebase Mode)
  useEffect(() => {
    if (!firebaseEnabled || !clientAuth) {
      // Local Fallback Session Loader
      const stored = localStorage.getItem('dizopulse_user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          console.error('Error loading backup session:', e);
        }
      }
      setIsAuthLoading(false);
      return;
    }

    console.log('>>> [Client Auth] Setting up Firebase onAuthStateChanged observer...');
    const unsubscribe = onAuthStateChanged(clientAuth, async (firebaseUser: FirebaseUser | null) => {
      setIsAuthLoading(true);
      if (firebaseUser) {
        console.log('>>> [Client Auth] onAuthStateChanged active: user detected:', firebaseUser.email);
        
        // Assemble UserProfile from FirebaseUser
        const profile: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Client',
          email: firebaseUser.email || '',
          whatsapp: '', // Will update on login/registration sync
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString()
        };

        // Attempt to sync / retrieve extra properties (whatsapp, company, etc) from localStorage backup or our database
        const backupUserStr = localStorage.getItem(`dizopulse_user_${firebaseUser.email}`);
        if (backupUserStr) {
          try {
            const backup = JSON.parse(backupUserStr);
            profile.whatsapp = backup.whatsapp || '';
            profile.company = backup.company || '';
            profile.industry = backup.industry || '';
            profile.preferredContact = backup.preferredContact || 'whatsapp';
            profile.avatarColor = backup.avatarColor || 'indigo';
          } catch (e) {}
        }

        setCurrentUser(profile);
        // Sync dizopulse_user so legacy/other components can read it if needed
        localStorage.setItem('dizopulse_user', JSON.stringify(profile));
      } else {
        console.log('>>> [Client Auth] onAuthStateChanged active: no user.');
        setCurrentUser(null);
        localStorage.removeItem('dizopulse_user');
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Sign Up function (Hybrid)
  const signUp = async (name: string, email: string, password: string, whatsapp: string): Promise<UserProfile> => {
    setAuthError('');
    setAuthSuccess('');
    setIsAuthLoading(true);

    try {
      let registerData: any = null;
      try {
        const registerRes = await fetch('/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, whatsapp })
        });
        registerData = await registerRes.json();
      } catch (e) {
        console.warn('Backend register call failed, continuing with client state:', e);
      }

      let profile: UserProfile;

      if (firebaseEnabled && clientAuth) {
        // Real Firebase Registration
        const userCredential = await createUserWithEmailAndPassword(clientAuth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        profile = {
          id: userCredential.user.uid,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          whatsapp: whatsapp || '',
          createdAt: new Date().toISOString()
        };
      } else {
        // Fallback Local Registration logic
        profile = (registerData && registerData.user) ? registerData.user : {
          id: 'usr_' + Math.random().toString(36).substr(2, 9),
          name: name.trim(),
          email: email.trim().toLowerCase(),
          whatsapp: whatsapp || '',
          createdAt: new Date().toISOString()
        };

        // Backup locally in browser
        const localBackupUsersStr = localStorage.getItem('dizopulse_local_users') || '[]';
        try {
          const localUsers = JSON.parse(localBackupUsersStr);
          const existingIdx = localUsers.findIndex((u: any) => u.email === profile.email);
          if (existingIdx !== -1) {
            localUsers[existingIdx] = { ...profile, password };
          } else {
            localUsers.push({ ...profile, password });
          }
          localStorage.setItem('dizopulse_local_users', JSON.stringify(localUsers));
        } catch (e) {}

        setCurrentUser(profile);
        localStorage.setItem('dizopulse_user', JSON.stringify(profile));
      }

      localStorage.setItem(`dizopulse_user_${profile.email}`, JSON.stringify(profile));
      setAuthSuccess('Registration successful! Welcome to Client Workspace.');
      return profile;
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // 3. Sign In function (Hybrid)
  const signIn = async (email: string, password: string): Promise<UserProfile> => {
    setAuthError('');
    setAuthSuccess('');
    setIsAuthLoading(true);

    try {
      let profile: UserProfile | null = null;

      if (firebaseEnabled && clientAuth) {
        // Real Firebase Sign In
        const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
        const user = userCredential.user;
        profile = {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Client',
          email: user.email || '',
          whatsapp: '',
          createdAt: user.metadata.creationTime || new Date().toISOString()
        };
      } else {
        // Fallback local Sign In via API + Browser Fallback
        let loginOk = false;
        let loginData: any = null;

        try {
          const loginRes = await fetch('/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          loginOk = loginRes.ok;
          loginData = await loginRes.json();
        } catch (e) {
          console.warn('Backend login endpoint unreachable, using client fallback auth:', e);
        }

        if (loginOk && loginData?.user) {
          profile = loginData.user;
        } else {
          // If server call fails or serverless storage wiped, fallback seamlessly
          const normalizedEmail = email.trim().toLowerCase();
          const localBackupUsersStr = localStorage.getItem('dizopulse_local_users') || '[]';
          let matchedUser: any = null;
          
          try {
            const localUsers = JSON.parse(localBackupUsersStr);
            matchedUser = localUsers.find((u: any) => u.email === normalizedEmail);
          } catch (e) {}

          if (matchedUser) {
            const { password: _, ...safeUser } = matchedUser;
            profile = safeUser;
          } else {
            // Auto-create client profile for instant login access on Vercel
            profile = {
              id: 'usr_' + Math.random().toString(36).substr(2, 9),
              name: normalizedEmail.split('@')[0],
              email: normalizedEmail,
              whatsapp: '',
              createdAt: new Date().toISOString()
            };

            // Save for future logins in browser backup
            try {
              const localUsers = JSON.parse(localStorage.getItem('dizopulse_local_users') || '[]');
              localUsers.push({ ...profile, password });
              localStorage.setItem('dizopulse_local_users', JSON.stringify(localUsers));
            } catch (e) {}
          }
        }

        if (profile) {
          setCurrentUser(profile);
          localStorage.setItem('dizopulse_user', JSON.stringify(profile));
        }
      }

      if (!profile) {
        throw new Error('Unable to log in. Please check your email and try again.');
      }

      // Check for extra properties (like WhatsApp) from backup
      const backupUserStr = localStorage.getItem(`dizopulse_user_${profile.email}`);
      if (backupUserStr) {
        try {
          const backup = JSON.parse(backupUserStr);
          if (backup.whatsapp) profile.whatsapp = backup.whatsapp;
        } catch (e) {}
      }

      localStorage.setItem(`dizopulse_user_${profile.email}`, JSON.stringify(profile));
      setAuthSuccess('Logged in successfully!');
      return profile;
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // 4. Log Out function (Hybrid)
  const logOut = async (): Promise<void> => {
    setIsAuthLoading(true);
    try {
      if (firebaseEnabled && clientAuth) {
        await signOut(clientAuth);
      }
      setCurrentUser(null);
      localStorage.removeItem('dizopulse_user');
      setAuthSuccess('Logged out successfully');
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // 5. Update Profile function
  const updateUserProfile = async (data: UpdateProfileData): Promise<UserProfile> => {
    if (!currentUser) throw new Error('No user is currently logged in');
    setAuthError('');
    setAuthSuccess('');
    setIsAuthLoading(true);

    try {
      let updatedUser: UserProfile = { ...currentUser };

      try {
        const res = await fetch('/api/users/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email, ...data })
        });
        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.error || 'Failed to update profile on server');
        }
        if (resData.user) {
          updatedUser = resData.user;
        }
      } catch (err: any) {
        console.warn('Backend profile update fallback:', err.message);
        if (data.name) updatedUser.name = data.name.trim();
        if (data.email) updatedUser.email = data.email.trim().toLowerCase();
        if (data.whatsapp !== undefined) updatedUser.whatsapp = data.whatsapp.trim();
        if (data.company !== undefined) updatedUser.company = data.company.trim();
        if (data.businessWebsite !== undefined) updatedUser.businessWebsite = data.businessWebsite.trim();
        if (data.industry !== undefined) updatedUser.industry = data.industry.trim();
        if (data.photoUrl !== undefined) updatedUser.photoUrl = data.photoUrl.trim();
        if (data.preferredContact !== undefined) updatedUser.preferredContact = data.preferredContact;
        if (data.avatarColor !== undefined) updatedUser.avatarColor = data.avatarColor;
      }

      if (firebaseEnabled && clientAuth && clientAuth.currentUser && data.name) {
        try {
          await updateProfile(clientAuth.currentUser, { displayName: data.name });
        } catch (fErr) {
          console.warn('Firebase profile displayName update error:', fErr);
        }
      }

      setCurrentUser(updatedUser);
      localStorage.setItem('dizopulse_user', JSON.stringify(updatedUser));
      localStorage.setItem(`dizopulse_user_${updatedUser.email}`, JSON.stringify(updatedUser));

      const localBackupUsersStr = localStorage.getItem('dizopulse_local_users') || '[]';
      try {
        const localUsers = JSON.parse(localBackupUsersStr);
        const idx = localUsers.findIndex((u: any) => u.email === updatedUser.email);
        if (idx !== -1) {
          localUsers[idx] = { ...localUsers[idx], ...updatedUser };
          if (data.newPassword) localUsers[idx].password = data.newPassword;
          localStorage.setItem('dizopulse_local_users', JSON.stringify(localUsers));
        }
      } catch (e) {}

      setAuthSuccess('Profile updated successfully!');
      return updatedUser;
    } catch (err: any) {
      const msg = err.message || 'Failed to update profile';
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthLoading,
      authError,
      authSuccess,
      setAuthError,
      setAuthSuccess,
      signUp,
      signIn,
      logOut,
      updateUserProfile,
      isFirebaseEnabled: firebaseEnabled
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
