/**
 * Mack ENADE Pilot Authentication Service (Frontend Client)
 * Handles Email + Access Code authentication against Google Sheets pilot backend.
 * NOTE: Raw access codes are NEVER stored in browser storage (localStorage, sessionStorage)
 * or transmitted in logs/analytics.
 */

import { InternalUserProfile, MackEnadeRole } from '../types';

export const APP_ENV = 'PILOT';

export interface PilotLoginResponse {
  success: boolean;
  user: {
    id: string;
    institutionalEmail: string;
    name: string;
    role: MackEnadeRole;
    courseId: string;
    courseName: string;
    status: string;
    cohort?: string;
    classGroup?: string;
    pilotEligible?: boolean;
    canCreateQuestions?: boolean;
    canCreateChallenges?: boolean;
    canViewAnalytics?: boolean;
    mentorArea?: string;
    isMentor?: boolean;
    lastLoginAt: string;
    isFirstLogin?: boolean;
  };
  role: MackEnadeRole;
  redirect?: string;
  message?: string;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: MackEnadeRole;
  course: string;
  loginActive: boolean;
  hasAccessCode: boolean;
  pilotEligible?: boolean;
}

const AUTH_STORAGE_KEY = 'mack_enade_pilot_auth_user';

/**
 * Normalizes email: trim whitespace and lowercase
 */
export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

/**
 * Normalizes access code: trim whitespace and uppercase
 */
export function normalizeAccessCode(code: string): string {
  return (code || '').trim().toUpperCase();
}

/**
 * Stores active pilot session in browser storage for instant recovery.
 * ONLY stores sanitized profile - NEVER stores raw access codes!
 */
export function saveAuthSession(profile: InternalUserProfile): void {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage quota or sandboxing fallback
  }
}

/**
 * Retrieves active cached session
 */
export function getAuthSession(): InternalUserProfile | null {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Clears active session on logout
 */
export function clearAuthSession(): void {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Authenticates user via Email + Individual Access Code against Google Sheets backend
 */
export async function loginWithEmailAndCode(
  email: string,
  accessCode: string,
  requestedRole?: MackEnadeRole
): Promise<InternalUserProfile> {
  const cleanEmail = normalizeEmail(email);
  const cleanCode = normalizeAccessCode(accessCode);

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail, accessCode: cleanCode, role: requestedRole }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error: any = new Error(
      data.userMessage || data.error || data.message || 'E-mail ou código de acesso inválido.'
    );
    error.statusCode = res.status;
    error.code = data.code;
    error.secondaryMessage =
      data.secondaryMessage || 'Verifique os dados informados e tente novamente.';
    throw error;
  }

  const user = data.user;
  const profile: InternalUserProfile = {
    id: user.id || 'usr-' + Date.now().toString(36),
    entraUserId: '',
    institutionalEmail: user.institutionalEmail || cleanEmail,
    name: user.name || cleanEmail.split('@')[0],
    role: user.role || data.role || 'STUDENT',
    course: user.courseName || user.courseId || 'Engenharia',
    class: user.classGroup || 'Turma Piloto ENADE 2026',
    status: (user.status || 'ACTIVE') as any,
    department: user.mentorArea || 'Universidade Presbiteriana Mackenzie',
    lastLoginAt: user.lastLoginAt || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  saveAuthSession(profile);
  return profile;
}

/**
 * Backwards compatible helper for existing callers
 */
export async function loginWithEmail(
  email: string,
  requestedRole?: MackEnadeRole
): Promise<InternalUserProfile> {
  return loginWithEmailAndCode(email, '1234', requestedRole);
}

/**
 * Verifies active session with backend
 */
export async function checkCurrentSession(): Promise<InternalUserProfile | null> {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      clearAuthSession();
      return null;
    }
    const data = await res.json();
    if (data.authenticated && data.user) {
      const u = data.user;
      const profile: InternalUserProfile = {
        id: u.id || 'usr-' + Date.now().toString(36),
        entraUserId: '',
        institutionalEmail: u.institutionalEmail,
        name: u.name,
        role: u.role,
        course: u.courseName || u.course || 'Engenharia',
        class: u.classGroup || u.class || 'Turma Piloto ENADE 2026',
        status: (u.status || 'ACTIVE') as any,
        department: u.mentorArea || u.department || 'Universidade Presbiteriana Mackenzie',
        lastLoginAt: u.lastLoginAt || new Date().toISOString(),
      };
      saveAuthSession(profile);
      return profile;
    }
    return null;
  } catch {
    return getAuthSession();
  }
}

/**
 * Ends active session
 */
export async function logoutSession(): Promise<void> {
  clearAuthSession();
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Ignore network error on logout
  }
}

/**
 * Admin helpers: list users, generate codes, toggle login
 */
export async function fetchAdminUsers(): Promise<AdminUserItem[]> {
  const res = await fetch('/api/auth/admin/users');
  if (!res.ok) {
    throw new Error('Falha ao obter lista de usuários do piloto.');
  }
  const data = await res.json();
  return data.users || [];
}

export async function generateUserAccessCode(
  email: string,
  role = 'STUDENT'
): Promise<{ email: string; accessCode: string; message: string }> {
  const res = await fetch('/api/auth/admin/generate-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) {
    throw new Error('Falha ao gerar novo código de acesso.');
  }
  return res.json();
}

export async function toggleUserLoginStatus(
  email: string,
  active: boolean,
  role = 'STUDENT'
): Promise<void> {
  const res = await fetch('/api/auth/admin/toggle-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, active, role }),
  });
  if (!res.ok) {
    throw new Error('Falha ao atualizar status de acesso.');
  }
}

/**
 * Screen redirect based on role
 */
export function getRedirectScreenForRole(
  role: MackEnadeRole
): 'dashboard' | 'professor-dashboard' | 'management-dashboard' {
  switch (role) {
    case 'STUDENT':
      return 'dashboard';
    case 'PROFESSOR':
      return 'professor-dashboard';
    case 'COORDINATOR':
    case 'ADMIN':
      return 'management-dashboard';
    default:
      return 'dashboard';
  }
}
