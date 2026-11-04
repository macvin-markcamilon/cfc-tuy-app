'use client';

import { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';
import { getCurrentUserProfile, getCurrentUserRole } from '@/lib/data/user-service';

export function useCurrentUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const profile = await getCurrentUserProfile();
      setUser(profile);
      setRole((profile?.role as UserRole) || getCurrentUserRole());
    } catch {
      setRole(getCurrentUserRole());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === 'cfc_tuy_current_user_profile_v1' ||
        e.key === 'cfc_tuy_admin_role'
      ) {
        refreshUser();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('cfc_user_profile_updated', refreshUser);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('cfc_user_profile_updated', refreshUser);
    };
  }, []);

  return {
    user,
    role,
    isAdmin: role === 'admin',
    isMember: role === 'member',
    loading,
    refreshUser,
  };
}
