import { UserProfile, UserRole, MinistryType } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { generateUUID, isValidUUID } from './clp-service';

const STORAGE_KEYS = {
  USERS: 'cfc_tuy_prod_users_v1',
  CURRENT_USER_PROFILE: 'cfc_tuy_current_user_profile_v1',
  CURRENT_USER_ROLE: 'cfc_tuy_admin_role',
  DELETED_USERS: 'cfc_tuy_deleted_users_v1',
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function normalizeRole(role?: any): UserRole {
  if (!role) return 'member';
  const r = String(role).toLowerCase().trim();
  if (r === 'admin' || r === 'administrator') return 'admin';
  return 'member';
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
    barangay: 'Rizal (Pob.)',
    ministry: 'CFC',
    role: 'admin',
    clpBatch: 'Batch 28',
    password: 'weakPassword',
    createdAt: '2024-01-15T08:00:00.000Z',
  },
];

const LEGACY_MOCK_USER_IDS = new Set([
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
]);

export function getLocalUsers(): UserProfile[] {
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
    return usersList
      .filter(
        (u) =>
          !deleted.includes(u.id) &&
          !deleted.includes((u.email || '').toLowerCase()) &&
          !LEGACY_MOCK_USER_IDS.has(u.id)
      )
      .map((u) => ({
        ...u,
        role: normalizeRole(u.role),
      }));
  } catch {
    const deleted = getDeletedUsers();
    return INITIAL_CFC_TUY_USERS.filter(
      (u) =>
        !deleted.includes(u.id) &&
        !deleted.includes((u.email || '').toLowerCase()) &&
        !LEGACY_MOCK_USER_IDS.has(u.id)
    ).map((u) => ({ ...u, role: normalizeRole(u.role) }));
  }
}

export function setLocalUsers(users: UserProfile[]): void {
  if (!isBrowser()) return;
  try {
    const normalized = users.map((u) => ({
      ...u,
      role: normalizeRole(u.role),
    }));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(normalized));
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
              barangay: row.barangay || 'Rizal (Pob.)',
              ministry: (row.ministry as MinistryType) || 'CFC',
              role: normalizeRole(row.role),
              clpBatch: row.clp_batch || '',
              password: existingLocal?.password || row.password || undefined,
              createdAt: row.created_at || new Date().toISOString(),
              updatedAt: row.updated_at || undefined,
            };
          });

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
 * - Saves in Supabase Auth (signUp) so they can log in with credentials
 * - Saves in public.profiles table in Supabase
 * - Saves in local cache
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
    barangay: userData.barangay || existing?.barangay || 'Rizal (Pob.)',
    ministry: userData.ministry || existing?.ministry || 'CFC',
    role: normalizeRole(userData.role || existing?.role),
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
    // 1. Attempt Supabase Auth creation if password provided
    if (user.email && passwordToSave) {
      try {
        await supabase.auth.signUp({
          email: user.email,
          password: passwordToSave,
          options: {
            data: {
              full_name: user.fullName,
              role: user.role,
              phone_number: user.phoneNumber,
              barangay: user.barangay,
              ministry: user.ministry,
              clp_batch: user.clpBatch,
            },
          },
        });
      } catch (authErr) {
        console.warn('Supabase auth signUp note:', authErr);
      }
    }

    // 2. Upsert into public.profiles
    try {
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

  if (isBrowser()) {
    window.dispatchEvent(new Event('cfc_user_profile_updated'));
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
    try {
      if (isValidUUID(id)) {
        await supabase.from('profiles').delete().eq('id', id);
      }
      if (email) {
        await supabase.from('profiles').delete().eq('email', email.toLowerCase());
      }
    } catch (err: any) {
      console.warn('Supabase delete user error:', err);
    }
  }

  if (isBrowser()) {
    window.dispatchEvent(new Event('cfc_user_profile_updated'));
  }

  return { success: true };
}

/**
 * Authenticate user credentials against registered users and Supabase Auth
 * - Admins and Members are both allowed to log in!
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

  // 2. Attempt Supabase Auth signInWithPassword
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
      // Default initial fallbacks
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
      message: 'Account not found. Please verify your email or ask an administrator to register your account.',
    };
  }

  if (!isValidPassword) {
    return {
      success: false,
      message: 'Invalid password. Please check your credentials and try again.',
    };
  }

  // Normalize user role
  matchedUser.role = normalizeRole(matchedUser.role);

  // Store login session
  if (isBrowser()) {
    localStorage.setItem('cfc_tuy_admin_auth', 'true');
    localStorage.setItem('cfc_tuy_admin_user', matchedUser.email);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ROLE, matchedUser.role);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_PROFILE, JSON.stringify(matchedUser));
    window.dispatchEvent(new Event('cfc_user_profile_updated'));
  }

  return { success: true, user: matchedUser };
}

/**
 * Get current logged in user's role: 'admin' | 'member'
 */
export function getCurrentUserRole(): 'admin' | 'member' {
  if (!isBrowser()) return 'admin';
  try {
    const role = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ROLE);
    if (role === 'member') return 'member';
    if (role === 'admin') return 'admin';
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_PROFILE);
    if (raw) {
      const p = JSON.parse(raw);
      if (p?.role) return normalizeRole(p.role);
    }
  } catch {}
  return 'admin';
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
        if (parsed && parsed.email) {
          parsed.role = normalizeRole(parsed.role);
          return parsed;
        }
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
            barangay: profile.barangay || 'Rizal (Pob.)',
            ministry: (profile.ministry as MinistryType) || 'CFC',
            role: normalizeRole(profile.role),
            clpBatch: profile.clp_batch || 'Batch 28',
            createdAt: profile.created_at || new Date().toISOString(),
          };
          if (isBrowser()) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER_PROFILE, JSON.stringify(loaded));
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ROLE, loaded.role);
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
  match.role = normalizeRole(match.role);
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_PROFILE, JSON.stringify(match));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ROLE, match.role);
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
    role: normalizeRole(profileData.role || current.role),
    updatedAt: new Date().toISOString(),
  };

  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_PROFILE, JSON.stringify(updated));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ROLE, updated.role);
    if (updated.email) {
      localStorage.setItem('cfc_tuy_admin_user', updated.email);
    }
    window.dispatchEvent(new Event('cfc_user_profile_updated'));
  }

  await saveUser(updated);
  return updated;
}

/**
 * Change current user password
 * - Updates Supabase Auth if session exists
 * - Updates local user profile and credentials
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
      console.warn('Supabase auth session check notice:', err?.message);
    }
  }

  try {
    const currentProfile = await getCurrentUserProfile();
    if (currentProfile) {
      currentProfile.password = newPassword;
      await saveUser(currentProfile);
      if (isBrowser()) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_PROFILE, JSON.stringify(currentProfile));
        window.dispatchEvent(new Event('cfc_user_profile_updated'));
      }
    }
    return { success: true, message: 'Password updated successfully!' };
  } catch (err: any) {
    if (updatedInSupabaseAuth) {
      return { success: true, message: 'Password updated successfully!' };
    }
    return { success: false, message: err?.message || 'Failed to update password' };
  }
}

/**
 * Save multiple user profiles in bulk
 */
export async function saveUsersBulk(
  usersList: Array<Partial<UserProfile> & { password?: string }>
): Promise<UserProfile[]> {
  const saved: UserProfile[] = [];
  for (const u of usersList) {
    if (!u.email) continue;
    try {
      const user = await saveUser(u);
      saved.push(user);
    } catch (err) {
      console.error('Failed to save bulk user profile:', u.email, err);
    }
  }
  return saved;
}
