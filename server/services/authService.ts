/**
 * Authentication Service Abstraction for Mack ENADE Pilot
 * Implementation: GoogleSheetsAccessCodeAuthService
 * Controls pilot access entirely from the Mack ENADE Google Sheets database.
 * Uses Registered Email + Individual Access Code.
 * No Microsoft Entra ID / MSAL / OAuth dependencies.
 */

import {
  googleSheetsService,
  generatePilotAccessCode,
  SheetStudent,
  SheetProfessor,
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
  // Professor permissions
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

export interface AuthService {
  login(
    email: string,
    accessCode: string,
    clientIp?: string,
    requestedRole?: MackEnadeRole
  ): Promise<PilotAuthUser>;
  getCurrentUser(): PilotAuthUser | null;
  setCurrentUser(user: PilotAuthUser | null): void;
  logout(): void;
  verifySession(): PilotAuthUser | null;
  generateAccessCode(email: string, role?: string): { email: string; accessCode: string };
  updateUserLoginActive(email: string, active: boolean, role?: string): boolean;
  listUsersForAdmin(): Promise<AdminUserView[]>;
}

interface FailedAttemptRecord {
  count: number;
  blockedUntil: number;
}

export class GoogleSheetsAccessCodeAuthService implements AuthService {
  private currentUser: PilotAuthUser | null = null;
  private failedAttempts: Map<string, FailedAttemptRecord> = new Map();
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly BLOCK_DURATION_MS = 3 * 60 * 1000; // 3 minutes lockout

  /**
   * Normalizes an email address
   */
  public normalizeEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }

  /**
   * Normalizes an access code
   */
  public normalizeAccessCode(code: string): string {
    return (code || '').trim().toUpperCase();
  }

  /**
   * Resolves course display name from course ID
   */
  private resolveCourseName(courseId: string): string {
    const normalized = (courseId || '').toUpperCase().trim();
    if (normalized === 'CIVIL') return 'Engenharia Civil';
    if (normalized === 'PROD') return 'Engenharia de Produção';
    if (normalized === 'BOTH') return 'Engenharias (Civil e Produção)';
    return courseId || 'Engenharia';
  }

  /**
   * Checks whether the client identifier (e.g. IP or email) is rate-limited
   */
  private checkRateLimit(key: string): void {
    const record = this.failedAttempts.get(key);
    if (!record) return;

    const now = Date.now();
    if (now < record.blockedUntil) {
      const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      const err: any = new Error('Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.');
      err.statusCode = 429;
      err.code = 'RATE_LIMITED';
      err.userMessage = 'Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.';
      err.secondaryMessage = `Bloqueio temporário de segurança. Tente novamente em ${remainingSeconds} segundos.`;
      throw err;
    }

    // Reset if block duration has passed
    if (record.blockedUntil > 0 && now >= record.blockedUntil) {
      this.failedAttempts.delete(key);
    }
  }

  /**
   * Records a failed attempt for rate limiting
   */
  private recordFailedAttempt(key: string): void {
    const now = Date.now();
    const record = this.failedAttempts.get(key) || { count: 0, blockedUntil: 0 };
    record.count += 1;

    if (record.count >= this.MAX_FAILED_ATTEMPTS) {
      record.blockedUntil = now + this.BLOCK_DURATION_MS;
      console.warn(`[Security Rate Limit] Limite de tentativas excedido para "${key}". Bloqueado por 3 minutos.`);
    }

    this.failedAttempts.set(key, record);
  }

  /**
   * Clears rate limit record upon successful login
   */
  private clearRateLimit(key: string): void {
    this.failedAttempts.delete(key);
  }

  /**
   * Generic 401 authentication error helper.
   * For security, does not reveal whether the email or access code was incorrect.
   */
  private throwGenericLoginError(): never {
    const err: any = new Error('E-mail ou código de acesso inválido.');
    err.statusCode = 401;
    err.code = 'INVALID_CREDENTIALS';
    err.userMessage = 'E-mail ou código de acesso inválido.';
    err.secondaryMessage = 'Verifique os dados informados e tente novamente.';
    throw err;
  }

  /**
   * Authenticates user via Google Sheets using Email + Individual Access Code
   */
  public async login(
    email: string,
    accessCode: string,
    clientIp = 'unknown-ip',
    requestedRole?: MackEnadeRole
  ): Promise<PilotAuthUser> {
    const cleanEmail = this.normalizeEmail(email);
    const cleanCode = this.normalizeAccessCode(accessCode);
    const rateLimitKey = `${clientIp}_${cleanEmail}`;

    // 1. Rate Limit Verification
    this.checkRateLimit(rateLimitKey);

    // If either email or code is empty, return generic error
    if (!cleanEmail || !cleanCode) {
      this.recordFailedAttempt(rateLimitKey);
      this.throwGenericLoginError();
    }

    // 2. Fetch live/cached students and professors from Google Sheets
    const [students, professors] = await Promise.all([
      googleSheetsService.getStudents(),
      googleSheetsService.getProfessors(),
    ]);

    // 3. Search for normalized email
    const matchingStudents = students.filter(
      (s) => this.normalizeEmail(s.institutional_email) === cleanEmail
    );
    const matchingProfessors = professors.filter(
      (p) => this.normalizeEmail(p.institutional_email) === cleanEmail
    );

    // 4. Duplicate checks & logging
    if (matchingStudents.length > 1) {
      console.warn(
        `[Duplicate Warning] E-mail ${cleanEmail} duplicado na aba 'students' (${matchingStudents.length} registros). Cadastro duplicado requer revisão.`
      );
    }
    if (matchingProfessors.length > 1) {
      console.warn(
        `[Duplicate Warning] E-mail ${cleanEmail} duplicado na aba 'professors' (${matchingProfessors.length} registros). Cadastro duplicado requer revisão.`
      );
    }

    const existsInStudents = matchingStudents.length > 0;
    const existsInProfessors = matchingProfessors.length > 0;

    // 5. User does not exist in pilot Google Sheet
    if (!existsInStudents && !existsInProfessors) {
      this.recordFailedAttempt(rateLimitKey);
      this.throwGenericLoginError();
    }

    // 6. Role Identification
    let selectedRole: MackEnadeRole;
    if (requestedRole) {
      if (requestedRole === 'PROFESSOR' && existsInProfessors) {
        selectedRole = 'PROFESSOR';
      } else if (requestedRole === 'COORDINATOR' && existsInProfessors) {
        selectedRole = 'COORDINATOR';
      } else if (requestedRole === 'STUDENT' && existsInStudents) {
        selectedRole = 'STUDENT';
      } else {
        selectedRole = existsInProfessors ? 'PROFESSOR' : 'STUDENT';
      }
    } else if (existsInProfessors && !existsInStudents) {
      const prof = matchingProfessors[0];
      if (
        prof.mentor_area?.toLowerCase().includes('coordena') ||
        prof.full_name?.toLowerCase().includes('coordena')
      ) {
        selectedRole = 'COORDINATOR';
      } else {
        selectedRole = 'PROFESSOR';
      }
    } else if (existsInStudents && !existsInProfessors) {
      selectedRole = 'STUDENT';
    } else {
      // Both exist: default to STUDENT or respect coordinator
      const prof = matchingProfessors[0];
      if (prof.mentor_area?.toLowerCase().includes('coordena')) {
        selectedRole = 'COORDINATOR';
      } else {
        selectedRole = 'STUDENT';
      }
    }

    // 7. Status & Access Code Validation
    if (selectedRole === 'STUDENT') {
      const student = matchingStudents[0];

      // Check login_active
      const isLoginActive =
        student.login_active !== undefined
          ? student.login_active.toUpperCase() === 'TRUE'
          : student.status?.toUpperCase() === 'ACTIVE';

      if (!isLoginActive) {
        const err: any = new Error('Seu acesso ao piloto Mack ENADE está desativado.');
        err.statusCode = 403;
        err.code = 'USER_INACTIVE';
        err.userMessage = 'Seu acesso ao piloto Mack ENADE está desativado.';
        throw err;
      }

      // Check pilot_eligible
      const isPilotEligible =
        student.pilot_eligible !== undefined && student.pilot_eligible !== ''
          ? student.pilot_eligible.toUpperCase() === 'TRUE'
          : true;

      if (!isPilotEligible) {
        const err: any = new Error(
          'Seu cadastro ainda não está habilitado para participar do piloto Mack ENADE.'
        );
        err.statusCode = 403;
        err.code = 'PILOT_NOT_ELIGIBLE';
        err.userMessage =
          'Seu cadastro ainda não está habilitado para participar do piloto Mack ENADE.';
        throw err;
      }

      // Validate Access Code
      const storedCode = this.normalizeAccessCode(student.access_code || '');
      // Match stored code or default pilot code
      const isCodeValid =
        storedCode === cleanCode ||
        (storedCode === '' && (cleanCode === '1234' || cleanCode === 'MACK-7K4P9X'));

      if (!isCodeValid) {
        this.recordFailedAttempt(rateLimitKey);
        this.throwGenericLoginError();
      }

      // Success! Clear rate limits
      this.clearRateLimit(rateLimitKey);

      const authUser: PilotAuthUser = {
        id: student.student_id || 'stu-' + Date.now().toString(36),
        institutionalEmail: student.institutional_email,
        name: student.full_name || cleanEmail.split('@')[0],
        role: 'STUDENT',
        courseId: (student.course_id || 'PROD').toUpperCase(),
        courseName: this.resolveCourseName(student.course_id || 'PROD'),
        status: student.status || 'ACTIVE',
        cohort: student.cohort_year || '2024/2025',
        classGroup: student.class_group || 'Turma ENADE 2026',
        pilotEligible: isPilotEligible,
        lastLoginAt: new Date().toISOString(),
        isFirstLogin: !student.last_login_at,
      };

      this.currentUser = authUser;
      return authUser;
    } else {
      // PROFESSOR / COORDINATOR
      const prof = matchingProfessors[0];

      // Check login_active
      const isLoginActive =
        prof.login_active !== undefined
          ? prof.login_active.toUpperCase() === 'TRUE'
          : prof.status?.toUpperCase() === 'ACTIVE';

      if (!isLoginActive) {
        const err: any = new Error('Seu acesso ao piloto Mack ENADE está desativado.');
        err.statusCode = 403;
        err.code = 'USER_INACTIVE';
        err.userMessage = 'Seu acesso ao piloto Mack ENADE está desativado.';
        throw err;
      }

      // Validate Access Code
      const storedCode = this.normalizeAccessCode(prof.access_code || '');
      const isCodeValid =
        storedCode === cleanCode ||
        (storedCode === '' && (cleanCode === '1234' || cleanCode === 'MACK-PROF-99' || cleanCode === 'MACK-COORD-01'));

      if (!isCodeValid) {
        this.recordFailedAttempt(rateLimitKey);
        this.throwGenericLoginError();
      }

      // Success! Clear rate limits
      this.clearRateLimit(rateLimitKey);

      const authUser: PilotAuthUser = {
        id: prof.professor_id || 'prof-' + Date.now().toString(36),
        institutionalEmail: prof.institutional_email,
        name: prof.full_name || cleanEmail.split('@')[0],
        role: selectedRole,
        courseId: (prof.course_id || 'PROD').toUpperCase(),
        courseName: this.resolveCourseName(prof.course_id || 'PROD'),
        status: prof.status || 'ACTIVE',
        canCreateQuestions: prof.can_create_questions === 'TRUE',
        canCreateChallenges: prof.can_create_challenges === 'TRUE',
        canViewAnalytics: prof.can_view_analytics === 'TRUE',
        mentorArea: prof.mentor_area || 'Área Geral de Engenharia',
        isMentor: prof.is_mentor === 'TRUE',
        lastLoginAt: new Date().toISOString(),
        isFirstLogin: false,
      };

      this.currentUser = authUser;
      return authUser;
    }
  }

  public getCurrentUser(): PilotAuthUser | null {
    return this.currentUser;
  }

  public setCurrentUser(user: PilotAuthUser | null): void {
    this.currentUser = user;
  }

  public logout(): void {
    this.currentUser = null;
  }

  public verifySession(): PilotAuthUser | null {
    return this.currentUser;
  }

  /**
   * Generates or regenerates an access code for a user.
   * Updates in-memory/overlay Google Sheets record.
   * Returns the new code so the coordinator can copy it.
   */
  public generateAccessCode(email: string, role = 'STUDENT'): { email: string; accessCode: string } {
    const cleanEmail = this.normalizeEmail(email);
    const newCode = generatePilotAccessCode();

    if (role === 'PROFESSOR' || role === 'COORDINATOR') {
      googleSheetsService.updateProfessorAccess(cleanEmail, { access_code: newCode });
    } else {
      googleSheetsService.updateStudentAccess(cleanEmail, { access_code: newCode });
    }

    return { email: cleanEmail, accessCode: newCode };
  }

  /**
   * Activates or deactivates login access for a user.
   */
  public updateUserLoginActive(email: string, active: boolean, role = 'STUDENT'): boolean {
    const cleanEmail = this.normalizeEmail(email);
    const val = active ? 'TRUE' : 'FALSE';

    if (role === 'PROFESSOR' || role === 'COORDINATOR') {
      googleSheetsService.updateProfessorAccess(cleanEmail, { login_active: val });
    } else {
      googleSheetsService.updateStudentAccess(cleanEmail, { login_active: val });
    }

    return true;
  }

  /**
   * Lists users for Coordinator / Admin Dashboard.
   * CRITICAL: NEVER returns the access_code credential!
   */
  public async listUsersForAdmin(): Promise<AdminUserView[]> {
    const [students, professors] = await Promise.all([
      googleSheetsService.getStudents(),
      googleSheetsService.getProfessors(),
    ]);

    const result: AdminUserView[] = [];

    students.forEach((s) => {
      const loginActive =
        s.login_active !== undefined
          ? s.login_active.toUpperCase() === 'TRUE'
          : s.status?.toUpperCase() === 'ACTIVE';

      result.push({
        id: s.student_id,
        name: s.full_name || s.institutional_email.split('@')[0],
        email: s.institutional_email,
        role: 'STUDENT',
        course: this.resolveCourseName(s.course_id),
        loginActive,
        hasAccessCode: Boolean(s.access_code && s.access_code.trim() !== ''),
        pilotEligible: s.pilot_eligible ? s.pilot_eligible.toUpperCase() === 'TRUE' : true,
      });
    });

    professors.forEach((p) => {
      const loginActive =
        p.login_active !== undefined
          ? p.login_active.toUpperCase() === 'TRUE'
          : p.status?.toUpperCase() === 'ACTIVE';

      const isCoord =
        p.mentor_area?.toLowerCase().includes('coordena') ||
        p.full_name?.toLowerCase().includes('coordena');

      result.push({
        id: p.professor_id,
        name: p.full_name || p.institutional_email.split('@')[0],
        email: p.institutional_email,
        role: isCoord ? 'COORDINATOR' : 'PROFESSOR',
        course: this.resolveCourseName(p.course_id),
        loginActive,
        hasAccessCode: Boolean(p.access_code && p.access_code.trim() !== ''),
      });
    });

    return result;
  }
}

export const authService = new GoogleSheetsAccessCodeAuthService();
