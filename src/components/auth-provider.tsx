"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import {
  getUserProfile,
  resolveUserRole,
  signOutUser,
  useDemoSession,
  type DemoSessionUser,
  type UserProfile,
} from "@/lib/auth";
import { setActiveUserRole, useUserRole } from "@/lib/use-user-role";

interface AuthContextType {
  user: User | null;
  demoUser: DemoSessionUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  activeRole: string;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  demoUser: null,
  profile: null,
  loading: false,
  isFirebaseConfigured: false,
  activeRole: "Buyer",
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(() => Boolean(auth));
  const demoUser = useDemoSession();
  const { role: activeRole } = useUserRole();

  const syncProfile = useCallback(async (currentUser: User) => {
    try {
      // The custom claim decides the role; the profile doc only feeds the UI.
      setActiveUserRole(await resolveUserRole(currentUser));
      setProfile(await getUserProfile(currentUser.uid));
    } catch (error) {
      // Non-fatal: the user stays signed in and the role falls back to the
      // claim already applied. A failure here usually means the profile doc is
      // missing or its read was denied, so it must not stay invisible.
      console.error("Could not sync the signed-in user's profile:", error);
    }
  }, []);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        await syncProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncProfile]);

  // The active role always follows the session. A visitor who is not signed in
  // sees the Buyer experience, which also clears any role left in storage by an
  // earlier session on this device.
  useEffect(() => {
    if (loading) return;
    if (demoUser?.role) {
      setActiveUserRole(demoUser.role);
    } else if (!firebaseUser) {
      setActiveUserRole("Buyer");
    }
  }, [loading, demoUser, firebaseUser]);

  const handleSignOut = useCallback(async () => {
    await signOutUser();
    setFirebaseUser(null);
    setProfile(null);
  }, []);

  const handleRefreshProfile = useCallback(async () => {
    if (firebaseUser) {
      await syncProfile(firebaseUser);
    }
  }, [firebaseUser, syncProfile]);

  const value = useMemo(
    () => ({
      user: firebaseUser,
      demoUser,
      profile,
      loading,
      isFirebaseConfigured,
      activeRole,
      signOut: handleSignOut,
      refreshProfile: handleRefreshProfile,
    }),
    [
      firebaseUser,
      demoUser,
      profile,
      loading,
      activeRole,
      handleSignOut,
      handleRefreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

