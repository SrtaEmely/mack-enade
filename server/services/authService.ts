/**
 * Mack ENADE Pilot authentication against private Google Sheets.
 * Validates email + access code. Session management lives in server.ts.
 */

import {
  googleSheetsService,
  generatePilotAccessCode,
  isSheetBoolTrue,
} from './googleSheetsService';
import { MackEnadeRole } from '../../src/types';

export interface PilotAuthUser {
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
}

export interface AdminUserView {
  id: string;
  name: string;
  email: string;
  role: MackEnadeRole;
  course: string;
  loginActive: boolean;
  hasAccessCode: boolean;
  pilotEligible?: boolean;
}

interface FailedAttemptRecord { count: number; blockedUntil: number; }

export class GoogleSheetsAccessCodeAuthService {
  private failedAttempts = new Map<string, FailedAttemptRecord>();
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly BLOCK_DURATION_MS = 3 * 60 * 1000;

  public normalizeEmail(email: string): string { return (email || '').trim().toLowerCase(); }
  public normalizeAccessCode(code: string): string { return (code || '').trim().toUpperCase(); }

  private resolveCourseName(courseId: string): string {
    const c = (courseId || '').toUpperCase().trim();
    if (c === 'CIVIL') return 'Engenharia Civil';
    if (c === 'PROD') return 'Engenharia de Produção';
    if (c === 'BOTH') return 'Engenharias (Civil e Produção)';
    return courseId || 'Engenharia';
  }

  private rateKey(clientIp: string, email: string): string { return `${clientIp}_${email}`; }

  private checkRateLimit(key: string): void {
    const r = this.failedAttempts.get(key);
    if (!r) return;
    const now = Date.now();
    if (r.blockedUntil && now < r.blockedUntil) {
      const err: any = new Error('Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.');
      err.statusCode = 429;
      err.code = 'RATE_LIMITED';
      err.userMessage = err.message;
      err.secondaryMessage = 'Bloqueio temporário de segurança.';
      throw err;
    }
    if (r.blockedUntil && now >= r.blockedUntil) this.failedAttempts.delete(key);
  }

  private fail(key: string): never {
    const now = Date.now();
    const r = this.failedAttempts.get(key) || { count: 0, blockedUntil: 0 };
    r.count += 1;
    if (r.count >= this.MAX_FAILED_ATTEMPTS) r.blockedUntil = now + this.BLOCK_DURATION_MS;
    this.failedAttempts.set(key, r);
    const err: any = new Error('E-mail ou código de acesso inválido.');
    err.statusCode = 401;
    err.code = 'INVALID_CREDENTIALS';
    err.userMessage = err.message;
    err.secondaryMessage = 'Verifique os dados informados e tente novamente.';
    throw err;
  }

  private explicitProfessorRole(role?: string, mentorArea?: string): MackEnadeRole {
    const r = (role || '').toUpperCase().trim();
    if (r === 'ADMIN') return 'ADMIN';
    if (r === 'COORDINATOR') return 'COORDINATOR';
    if (r === 'PROFESSOR') return 'PROFESSOR';
    if ((mentorArea || '').toLowerCase().includes('coordena')) return 'COORDINATOR';
    return 'PROFESSOR';
  }

  public async login(email: string, accessCode: string, clientIp = 'unknown-ip'): Promise<PilotAuthUser> {
    const cleanEmail = this.normalizeEmail(email);
    const cleanCode = this.normalizeAccessCode(accessCode);
    const key = this.rateKey(clientIp, cleanEmail);
    this.checkRateLimit(key);
    if (!cleanEmail || !cleanCode) this.fail(key);

    const [students, professors] = await Promise.all([
      googleSheetsService.getStudents(),
      googleSheetsService.getProfessors(),
    ]);
    const matchingStudents = students.filter((s) => this.normalizeEmail(s.institutional_email) === cleanEmail);
    const matchingProfessors = professors.filter((p) => this.normalizeEmail(p.institutional_email) === cleanEmail);

    if (matchingStudents.length > 1 || matchingProfessors.length > 1) {
      console.warn(`[Auth] Cadastro duplicado requer revisão: ${cleanEmail}`);
    }
    if (!matchingStudents.length && !matchingProfessors.length) this.fail(key);

    // If the same email is both student and professor, require an explicit role column on professor side.
    // This avoids silently escalating privileges.
    if (matchingStudents.length && matchingProfessors.length) {
      const profRole = (matchingProfessors[0].role || '').toUpperCase().trim();
      if (!['PROFESSOR', 'COORDINATOR', 'ADMIN'].includes(profRole)) {
        const err: any = new Error('Cadastro com papéis duplicados. Solicite revisão da coordenação.');
        err.statusCode = 409;
        err.code = 'DUPLICATE_ROLE';
        err.userMessage = err.message;
        throw err;
      }
      // Explicit professor role wins only if the professor access code matches; otherwise student may still authenticate.
      const profCode = this.normalizeAccessCode(matchingProfessors[0].access_code || '');
      if (profCode && profCode === cleanCode) {
        const p = matchingProfessors[0];
        const loginActive = p.login_active !== undefined ? isSheetBoolTrue(p.login_active) : p.status === 'ACTIVE';
        if (!loginActive) throw Object.assign(new Error('Seu acesso ao piloto Mack ENADE está desativado.'), { statusCode: 403, userMessage: 'Seu acesso ao piloto Mack ENADE está desativado.' });
        this.failedAttempts.delete(key);
        return {
          id: p.professor_id,
          institutionalEmail: p.institutional_email,
          name: p.full_name,
          role: this.explicitProfessorRole(p.role, p.mentor_area),
          courseId: p.course_id,
          courseName: this.resolveCourseName(p.course_id),
          status: p.status,
          canCreateQuestions: isSheetBoolTrue(p.can_create_questions),
          canCreateChallenges: isSheetBoolTrue(p.can_create_challenges),
          canViewAnalytics: isSheetBoolTrue(p.can_view_analytics),
          mentorArea: p.mentor_area,
          isMentor: isSheetBoolTrue(p.is_mentor),
          lastLoginAt: new Date().toISOString(),
        };
      }
    }

    if (matchingStudents.length) {
      const s = matchingStudents[0];
      const loginActive = s.login_active !== undefined ? isSheetBoolTrue(s.login_active) : s.status === 'ACTIVE';
      if (!loginActive) throw Object.assign(new Error('Seu acesso ao piloto Mack ENADE está desativado.'), { statusCode: 403, userMessage: 'Seu acesso ao piloto Mack ENADE está desativado.' });
      const eligible = s.pilot_eligible === undefined || s.pilot_eligible === '' ? true : isSheetBoolTrue(s.pilot_eligible);
      if (!eligible) throw Object.assign(new Error('Seu cadastro ainda não está habilitado para participar do piloto Mack ENADE.'), { statusCode: 403, userMessage: 'Seu cadastro ainda não está habilitado para participar do piloto Mack ENADE.' });
      const storedCode = this.normalizeAccessCode(s.access_code || '');
      if (!storedCode || storedCode !== cleanCode) this.fail(key);
      this.failedAttempts.delete(key);
      return {
        id: s.student_id,
        institutionalEmail: s.institutional_email,
        name: s.full_name,
        role: 'STUDENT',
        courseId: s.course_id,
        courseName: this.resolveCourseName(s.course_id),
        status: s.status,
        cohort: s.cohort_year,
        classGroup: s.class_group,
        pilotEligible: eligible,
        lastLoginAt: new Date().toISOString(),
      };
    }

    const p = matchingProfessors[0];
    const loginActive = p.login_active !== undefined ? isSheetBoolTrue(p.login_active) : p.status === 'ACTIVE';
    if (!loginActive) throw Object.assign(new Error('Seu acesso ao piloto Mack ENADE está desativado.'), { statusCode: 403, userMessage: 'Seu acesso ao piloto Mack ENADE está desativado.' });
    const storedCode = this.normalizeAccessCode(p.access_code || '');
    if (!storedCode || storedCode !== cleanCode) this.fail(key);
    this.failedAttempts.delete(key);
    return {
      id: p.professor_id,
      institutionalEmail: p.institutional_email,
      name: p.full_name,
      role: this.explicitProfessorRole(p.role, p.mentor_area),
      courseId: p.course_id,
      courseName: this.resolveCourseName(p.course_id),
      status: p.status,
      canCreateQuestions: isSheetBoolTrue(p.can_create_questions),
      canCreateChallenges: isSheetBoolTrue(p.can_create_challenges),
      canViewAnalytics: isSheetBoolTrue(p.can_view_analytics),
      mentorArea: p.mentor_area,
      isMentor: isSheetBoolTrue(p.is_mentor),
      lastLoginAt: new Date().toISOString(),
    };
  }

  public async generateAccessCode(email: string, role?: string): Promise<{ email: string; accessCode: string }> {
    const cleanEmail = this.normalizeEmail(email);
    const newCode = generatePilotAccessCode();
    if ((role || '').toUpperCase() === 'PROFESSOR' || (role || '').toUpperCase() === 'COORDINATOR' || (role || '').toUpperCase() === 'ADMIN') {
      await googleSheetsService.updateProfessorAccess(cleanEmail, { access_code: newCode });
    } else {
      await googleSheetsService.updateStudentAccess(cleanEmail, { access_code: newCode });
    }
    return { email: cleanEmail, accessCode: newCode };
  }

  public async updateUserLoginActive(email: string, active: boolean, role?: string): Promise<boolean> {
    const cleanEmail = this.normalizeEmail(email);
    const val = active ? 'TRUE' : 'FALSE';
    if ((role || '').toUpperCase() === 'PROFESSOR' || (role || '').toUpperCase() === 'COORDINATOR' || (role || '').toUpperCase() === 'ADMIN') {
      await googleSheetsService.updateProfessorAccess(cleanEmail, { login_active: val });
    } else {
      await googleSheetsService.updateStudentAccess(cleanEmail, { login_active: val });
    }
    return true;
  }

  public async listUsersForAdmin(): Promise<AdminUserView[]> {
    const [students, professors] = await Promise.all([googleSheetsService.getStudents(), googleSheetsService.getProfessors()]);
    const studentViews: AdminUserView[] = students.map((s) => ({
      id: s.student_id,
      name: s.full_name,
      email: s.institutional_email,
      role: 'STUDENT',
      course: this.resolveCourseName(s.course_id),
      loginActive: s.login_active !== undefined ? isSheetBoolTrue(s.login_active) : s.status === 'ACTIVE',
      hasAccessCode: Boolean(s.access_code?.trim()),
      pilotEligible: s.pilot_eligible === undefined ? true : isSheetBoolTrue(s.pilot_eligible),
    }));
    const professorViews: AdminUserView[] = professors.map((p) => ({
      id: p.professor_id,
      name: p.full_name,
      email: p.institutional_email,
      role: this.explicitProfessorRole(p.role, p.mentor_area),
      course: this.resolveCourseName(p.course_id),
      loginActive: p.login_active !== undefined ? isSheetBoolTrue(p.login_active) : p.status === 'ACTIVE',
      hasAccessCode: Boolean(p.access_code?.trim()),
    }));
    return [...studentViews, ...professorViews];
  }
}

export const authService = new GoogleSheetsAccessCodeAuthService();
