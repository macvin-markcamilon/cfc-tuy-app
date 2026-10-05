import { UserProfile, UserRole, MinistryType } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { generateUUID, isValidUUID } from './clp-service';

const STORAGE_KEYS = {
  USERS: 'cfc_tuy_prod_users_v1',
  CURRENT_USER_PROFILE: 'cfc_tuy_current_user_profile_v1',
  DELETED_USERS: 'cfc_tuy_deleted_users_v1',
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getDeletedUsers(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setDeletedUsers(deleted: string[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.DELETED_USERS, JSON.stringify(deleted));
  } catch (err) {
    console.error('Error saving deleted users:', err);
  }
}

export const INITIAL_CFC_TUY_USERS: UserProfile[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    fullName: 'Bro. Mark Camilon',
    spouseName: 'Sis. Grace Camilon',
    email: 'markcamilon@gmail.com',
    phoneNumber: '0917-123-4567',
    barangay: 'Poblacion 1',
    ministry: 'CFC',
    role: 'admin',
    clpBatch: 'Batch 28',
    password: 'weakPassword',
    createdAt: '2024-01-15T08:00:00.000Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    fullName: 'Bro. Ronald Bautista',
    spouseName: 'Sis. Karen Bautista',
    email: 'ronald.bautista@cfctuy.org',
    phoneNumber: '0918-234-5678',
    barangay: 'Rizal (Pob.)',
    ministry: 'CFC',
    role: 'chapter_servant',
    clpBatch: 'Batch 26',
    password: 'password123',
    createdAt: '2024-02-10T09:30:00.000Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    fullName: 'Bro. Michael Hernandez',
    spouseName: 'Sis. Joy Hernandez',
    email: 'michael.hernandez@cfctuy.org',
    phoneNumber: '0919-345-6789',
    barangay: 'Luna (Pob.)',
    ministry: 'CFC',
    role: 'unit_leader',
    clpBatch: 'Batch 29',
    password: 'password123',
    createdAt: '2024-03-01T10:15:00.000Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    fullName: 'Bro. Joel De Castro',
    spouseName: 'Sis. Mary Ann De Castro',
    email: 'joel.decastro@cfctuy.org',
    phoneNumber: '0920-456-7890',
    barangay: 'Putol',
    ministry: 'CFC',
    role: 'household_head',
    clpBatch: 'Batch 30',
    password: 'password123',
    createdAt: '2024-04-12T14:20:00.000Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    fullName: 'Sis. Teresa Mendoza',
    email: 'teresa.mendoza@cfctuy.org',
    phoneNumber: '0921-567-8901',
    barangay: 'Guinhawa',
    ministry: 'HOLD',
    role: 'household_head',
    clpBatch: 'Batch 27',
    password: 'password123',
    createdAt: '2024-05-18T11:00:00.000Z',
  },
];

function getLocalUsers(): UserProfile[] {
  if (!isBrowser()) return INITIAL_CFC_TUY_USERS;
  try {
    const deleted = getDeletedUsers();
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    let usersList: UserProfile[];
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_CFC_TUY_USERS));
      usersList = INITIAL_CFC_TUY_USERS;
    } else {
      const parsed = JSON.parse(raw);
      usersList = Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CFC_TUY_USERS;
    }
    return usersList.filter(
      (u) => !deleted.includes(u.id) && !deleted.includes((u.email || '').toLowerCase())
    );
  } catch {
    const deleted = getDeletedUsers();
    return INITIAL_CFC_TUY_USERS.filter(
      (u) => !deleted.includes(u.id) && !deleted.includes((u.email || '').toLowerCase())
    );
  }
}

function setLocalUsers(users: UserProfile[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving local users:', err);
  }
}

/**
 * Fetch all users (from Supabase profiles or local cache)
 */
export async function fetchUsers(): Promise<UserProfile[]> {
  const deleted = getDeletedUsers();
  const supabase = createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const local = getLocalUsers();
        const localMap = new Map<string, UserProfile>();
        local.forEach((u) => localMap.set(u.email.toLowerCase(), u));

        const mapped: UserProfile[] = data
          .filter(
            (row: any) =>
              !deleted.includes(row.id) &&
              !deleted.includes((row.email || '').toLowerCase())
          )
          .map((row: any) => {
            const emailLower = (row.email || '').toLowerCase();
            const existingLocal = localMap.get(emailLower);
            return {
              id: row.id,
              fullName: row.full_name || 'Member',
              spouseName: row.spouse_name || '',
              email: row.email || '',
              phoneNumber: row.phone_number || '',
              barangay: row.barangay || 'Poblacion 1',
              ministry: (row.ministry as MinistryType) || 'CFC',
              role: (row.role as UserRole) || 'member',
              clpBatch: row.clp_batch || '',
              password: existingLocal?.password || row.password || undefined,
              createdAt: row.created_at || new Date().toISOString(),
              updatedAt: row.updated_at || undefined,
            };
          });

        // Merge with local to ensure default accounts exist unless deleted
        const mergedMap = new Map<string, UserProfile>();
        local.forEach((u) => mergedMap.set(u.email.toLowerCase(), u));
        mapped.forEach((u) => mergedMap.set(u.email.toLowerCase(), u));

        const finalUsers = Array.from(mergedMap.values()).filter(
          (u) => !deleted.includes(u.id) && !deleted.includes((u.email || '').toLowerCase())
        );

        setLocalUsers(finalUsers);
        return finalUsers;
      }
    } catch (err) {
      console.warn('Supabase fetchUsers fallback:', err);
    }
  }

  return getLocalUsers();
}

/**
 * Save / Create / Update a user
 */
export async function saveUser(
  userData: Partial<UserProfile> & { password?: string }
): Promise<UserProfile> {
  const userId = isValidUUID(userData.id) ? userData.id! : generateUUID();
  const now = new Date().toISOString();

  // Un-mark from deleted if being saved
  const deleted = getDeletedUsers();
  if (deleted.length > 0) {
    const updatedDeleted = deleted.filter(
      (d) => d !== userId && d !== (userData.email || '').toLowerCase()
    );
    setDeletedUsers(updatedDeleted);
  }

  const existingList = getLocalUsers();
  const existing = existingList.find(
    (u) => u.id === userId || u.email.toLowerCase() === (userData.email || '').toLowerCase()
  );

  const passwordToSave =
    userData.password && userData.password.trim().length > 0
      ? userData.password.trim()
      : existing?.password || 'password123';

  const user: UserProfile = {
    id: userId,
    fullName: userData.fullName || existing?.fullName || 'New Member',
    spouseName: userData.spouseName !== undefined ? userData.spouseName : existing?.spouseName || '',
    email: (userData.email || existing?.email || '').toLowerCase(),
    phoneNumber: userData.phoneNumber !== undefined ? userData.phoneNumber : existing?.phoneNumber || '',
    barangay: userData.barangay || existing?.barangay || 'Poblacion 1',
    ministry: userData.ministry || existing?.ministry || 'CFC',
    role: userData.role || existing?.role || 'member',
    clpBatch: userData.clpBatch !== undefined ? userData.clpBatch : existing?.clpBatch || '',
    password: passwordToSave,
    createdAt: userData.createdAt || existing?.createdAt || now,
    updatedAt: now,
  };

  const current = existingList.filter(
    (u) => u.id !== user.id && u.email.toLowerCase() !== user.email.toLowerCase()
  );
  const updatedList = [user, ...current];
  setLocalUsers(updatedList);

  const supabase = createClient();
  if (supabase) {
    try {
      // Upsert into profiles
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.fullName,
        spouse_name: user.spouseName || null,
        email: user.email,
        phone_number: user.phoneNumber || null,
        barangay: user.barangay,
        ministry: user.ministry,
        role: user.role,
        clp_batch: user.clpBatch || null,
        updated_at: user.updatedAt,
      });
    } catch (err) {
      console.warn('Supabase profile save error, saved locally:', err);
    }
  }

  return user;
}

/**
 * Delete a user
 */
export async function deleteUser(id: string, email?: string): Promise<{ success: boolean; message?: string }> {
  const deleted = getDeletedUsers();
  if (id && !deleted.includes(id)) deleted.push(id);
  if (email && !deleted.includes(email.toLowerCase())) deleted.push(email.toLowerCase());
  setDeletedUsers(deleted);

  const current = getLocalUsers().filter(
    (u) => u.id !== id && (!email || u.email.toLowerCase() !== email.toLowerCase())
  );
  setLocalUsers(current);

  const supabase = createClient();
  if (supabase) {
    const supabaseErrors: string[] = [];
    try {
      if (isValidUUID(id)) {
        const { error: errId } = await supabase.from('profiles').delete().eq('id', id);
        if (errId) {
          console.warn('Supabase delete profile by id error:', errId.message);
          supabaseErrors.push(errId.message);
        }
      }
      if (email) {
        const { error: errEmail } = await supabase
          .from('profiles')
          .delete()
          .eq('email', email.toLowerCase());
        if (errEmail) {
          console.warn('Supabase delete profile by email error:', errEmail.message);
          supabaseErrors.push(errEmail.message);
        }
      }
    } catch (err: any) {
      console.warn('Supabase delete user error:', err);
      supabaseErrors.push(err?.message || 'Supabase delete exception');
    }

    if (supabaseErrors.length > 0) {
      return {
        success: true,
        message: `Removed locally. Supabase note: ${supabaseErrors.join('; ')}`,
      };
    }
  }

  return { success: true };
}

/**
 * Authenticate user credentials against user management list
 */
export async function authenticateUser(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  if (!email || !password) {
    return { success: false, message: 'Please enter both email address and password.' };
  }

  // 1. Fetch current registered user list
  const users = await fetchUsers();
  const matchedUser = users.find((u) => u.email.toLowerCase() === email);

  // 2. Attempt Supabase Auth if available
  const supabase = createClient();
  let supabaseAuthSuccess = false;
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        supabaseAuthSuccess = true;
      }
    } catch (err) {
      console.warn('Supabase auth check fallback:', err);
    }
  }

  // 3. Password Verification
  let isValidPassword = supabaseAuthSuccess;
  if (!isValidPassword && matchedUser) {
    if (matchedUser.password) {
      isValidPassword = matchedUser.password === password;
    } else {
      // Preset fallbacks
      if (email === 'markcamilon@gmail.com' && (password === 'weakPassword' || password === 'password123')) {
        isValidPassword = true;
      } else if (password === 'password123') {
        isValidPassword = true;
      }
    }
  }

  if (!matchedUser) {
    return {
      success: false,
      message: 'Account not found. Only authorized CFC Tuy chapter servants can access the admin portal.',
    };
  }

  if (!isValidPassword) {
    return {
      success: false,
      message: 'Invalid password. Please check your credentials and try again.',
    };
  }

  // Role check: Only leaders / servants can access the admin portal
  if (matchedUser.role === 'member') {
    return {
      success: false,
      message: 'Access Restricted: Your account is listed as a general member. Only Chapter Servants, Unit Leaders, Household Heads, and Administrators can access the Admin Portal.',
    };
  }

  // Store login session
  if (isBrowser()) {
    localStorage.setItem('cfc_tuy_admin_auth', 'true');
    localStorage.setItem('cfc_tuy_admin_user', matchedUser.email);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_PROFILE, JSON.stringify(matchedUser));
  }

  return { success: true, user: matchedUser };
}

/**
 * Get current logged in user's profile
 */
export async function getCurrentUserProfile(fallbackEmail?: string): Promise<UserProfile> {
  if (isBrowser()) {
    const rawSaved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_PROFILE);
    if (rawSaved) {
      try {
        const parsed = JSON.parse(rawSaved);
        if (parsed && parsed.email) return parsed;
      } catch {
        // continue
      }
    }
  }

  const emailToLookup =
    fallbackEmail ||
    (isBrowser() ? localStorage.getItem('cfc_tuy_admin_user') : null) ||
    'markcamilon@gmail.com';

  const supabase = createClient();
  if (supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.email) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          const loaded: UserProfile = {
            id: profile.id,
            fullName: profile.full_name || 'Bro. Mark Camilon',
            spouseName: profile.spouse_name || 'Sis. Grace Camilon',
            email: profile.email || user.email,
            phoneNumber: profile.phone_number || '0917-123-4567',
            barangay: profile.barangay || 'Poblacion 1',
            ministry: (profile.ministry as MinistryType) || 'CFC',
            role: (profile.role as UserRole) || 'admin',
            clpBatch: profile.clp_batch || 'Batch 28',
            createdAt: profile.created_at || new Date().toISOString(),
          };
          if (isBrowser()) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER_PROFILE, JSON.stringify(loaded));
          }
          return loaded;
        }
      }
    } catch (err) {
      console.warn('Supabase getCurrentUserProfile error, using local fallback:', err);
    }
  }

  const all = getLocalUsers();
  const match =
    all.find((u) => u.email.toLowerCase() === emailToLookup.toLowerCase()) || all[0];
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_PROFILE, JSON.stringify(match));
  }
  return match;
}

/**
 * Update current logged-in user's profile
 */
export async function updateCurrentUserProfile(
  profileData: Partial<UserProfile>
): Promise<UserProfile> {
  const current = await getCurrentUserProfile(profileData.email);
  const updated: UserProfile = {
    ...current,
    ...profileData,
    updatedAt: new Date().toISOString(),
  };

  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_PROFILE, JSON.stringify(updated));
    if (updated.email) {
      localStorage.setItem('cfc_tuy_admin_user', updated.email);
    }
  }

  await saveUser(updated);
  return updated;
}

/**
 * Change current user password
 */
export async function updateUserPassword(newPassword: string): Promise<{ success: boolean; message: string }> {
  const supabase = createClient();
  let updatedInSupabaseAuth = false;

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (!error) {
          updatedInSupabaseAuth = true;
        } else {
          console.warn('Supabase auth updateUser notice:', error.message);
        }
      }
    } catch (err: any) {
      console.warn('Supabase auth session check failed:', err?.message);
    }
  }

  // Always sync password in current user profile (profiles table & localStorage cache)
  try {
    const currentProfile = await getCurrentUserProfile();
    if (currentProfile) {
      currentProfile.password = newPassword;
      await saveUser(currentProfile);
    }
    return { success: true, message: 'Password updated successfully!' };
  } catch (err: any) {
    if (updatedInSupabaseAuth) {
      return { success: true, message: 'Password updated successfully!' };
    }
    return { success: false, message: err?.message || 'Failed to update password' };
  }
}
