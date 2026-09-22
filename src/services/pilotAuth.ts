/**
 * Frontend client for Mack ENADE pilot authentication.
 * Authentication state is authoritative only on the server via HttpOnly cookie.
 */

import { InternalUserProfile, MackEnadeRole } from '../types';

export const APP_ENV = 'PILOT';

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

export function normalizeEmail(email: string): string { return (email || '').trim().toLowerCase(); }
export function normalizeAccessCode(code: string): string { return (code || '').trim().toUpperCase(); }

function toProfile(user: any): InternalUserProfile {
  return {
    id: user.id || 'usr-' + Date.now().toString(36),
    institutionalEmail: user.institutionalEmail,
    name: user.name,
    role: user.role,
    course: user.courseName || user.course || user.courseId || 'Engenharia',
    class: user.classGroup || user.class || 'Turma Piloto ENADE 2026',
    status: (user.status || 'ACTIVE') as any,
    department: user.mentorArea || user.department || 'Universidade Presbiteriana Mackenzie',
    lastLoginAt: user.lastLoginAt || new Date().toISOString(),
  };
}

export async function loginWithEmailAndCode(email: string, accessCode: string): Promise<InternalUserProfile> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: normalizeEmail(email),
      accessCode: normalizeAccessCode(accessCode),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error: any = new Error(data.error || data.message || 'E-mail ou código de acesso inválido.');
    error.statusCode = res.status;
    error.code = data.code;
    error.secondaryMessage = data.secondaryMessage || 'Verifique os dados informados e tente novamente.';
    throw error;
  }
  return toProfile(data.user);
}

export async function checkCurrentSession(): Promise<InternalUserProfile | null> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.authenticated && data.user ? toProfile(data.user) : null;
  } catch {
    return null;
  }
}

export async function logoutSession(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch {
    // Local UI will still return to login screen.
  }
}

export async function fetchAdminUsers(): Promise<AdminUserItem[]> {
  const res = await fetch('/api/auth/admin/users', { credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao obter lista de usuários do piloto.');
  const data = await res.json();
  return data.users || [];
}

export async function generateUserAccessCode(email: string, role = 'STUDENT'): Promise<{ email: string; accessCode: string; message: string }> {
  const res = await fetch('/api/auth/admin/generate-code', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Falha ao gerar novo código de acesso.');
  return data;
}

export async function toggleUserLoginStatus(email: string, active: boolean, role = 'STUDENT'): Promise<void> {
  const res = await fetch('/api/auth/admin/toggle-login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, active, role }),
  });
  if (!res.ok) throw new Error('Falha ao atualizar status de acesso.');
}

export function getRedirectScreenForRole(role: MackEnadeRole): 'dashboard' | 'professor-dashboard' | 'management-dashboard' {
  if (role === 'PROFESSOR') return 'professor-dashboard';
  if (role === 'COORDINATOR' || role === 'ADMIN') return 'management-dashboard';
  return 'dashboard';
}
