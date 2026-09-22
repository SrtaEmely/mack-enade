/**
 * Google Sheets Service for Mack ENADE Pilot
 * Reads and manages data from the pilot Google Spreadsheet (Spreadsheet ID: 1s821ayXfONNpZkcQ3loP--MINepO0IybpkeUB0_ZNDs)
 * Works strictly server-side; client never interacts directly with Google Sheets.
 */

import crypto from 'crypto';

/**
 * Generates a cryptographically random, human-friendly access code
 * Format: MACK-XXXXXX (e.g. MACK-7K4P9X)
 * Avoids ambiguous characters: 0, O, 1, I, L
 */
export function generatePilotAccessCode(): string {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `MACK-${code}`;
}

export interface SheetStudent {
  student_id: string;
  institutional_email: string;
  full_name: string;
  course_id: string;
  cohort_year: string;
  class_group: string;
  status: string;
  pilot_eligible: string;
  microsoft_entra_id?: string;
  created_at?: string;
  last_login_at?: string;
  login_active?: string;
  access_code?: string;
}

export interface SheetProfessor {
  professor_id: string;
  institutional_email: string;
  full_name: string;
  course_id: string;
  mentor_area: string;
  is_mentor: string;
  can_create_questions: string;
  can_create_challenges: string;
  can_view_analytics: string;
  status: string;
  microsoft_entra_id?: string;
  login_active?: string;
  access_code?: string;
}

export interface SheetCourse {
  course_id: string;
  course_name_pt: string;
  course_name_en: string;
  short_name: string;
  cine_brasil_code: string;
  enade_year: string;
  active: string;
}

export interface SheetDiscipline {
  discipline_id: string;
  course_id: string;
  discipline_name: string;
  enade_component: string;
  display_order: string;
  active: string;
  source_reference: string;
  source_url: string;
}

export interface SheetQuestion {
  question_id: string;
  course_id: string;
  discipline_id: string;
  professor_id: string;
  enade_component: string;
  question_type: string;
  difficulty: string;
  topic: string;
  competency: string;
  statement: string;
  supporting_text: string;
  image_url: string;
  alternative_a: string;
  alternative_b: string;
  alternative_c: string;
  alternative_d: string;
  alternative_e: string;
  correct_answer: string;
  explanation: string;
  common_error: string;
  creation_method: string;
  source: string;
  source_year: string;
  source_url?: string;
  review_status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewed_by: string;
  created_at: string;
  updated_at: string;
  active: boolean;
  tags: string;
  expected_response_time: number;
}

export interface SheetAppConfig {
  config_key: string;
  config_value: string;
  notes: string;
}

export interface SheetPrize {
  prize_id: string;
  prize_name: string;
  short_description: string;
  full_description: string;
  image_url: string;
  image_alt_text?: string;
  prize_type: string;
  award_category: string;
  course_id: string;
  discipline_id?: string;
  quantity: number;
  start_date?: string;
  end_date?: string;
  announcement_date?: string;
  min_questions: number;
  min_active_days: number;
  min_mentor_challenges: number;
  min_missions: number;
  min_accuracy_pct: number;
  eligibility_notes: string;
  sponsor?: string;
  terms_url?: string;
  status: string;
  active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Checks if a Google Sheets cell value represents true (e.g. TRUE, VERDADEIRO, 1, SIM)
 */
export function isSheetBoolTrue(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (!val) return false;
  const s = String(val).trim().toUpperCase();
  return s === 'TRUE' || s === 'VERDADEIRO' || s === 'SIM' || s === '1';
}

/**
 * Parses flexible date formats from Google Sheets (ISO YYYY-MM-DD or Brazilian DD/MM/YYYY)
 */
export function parseFlexibleDate(dateStr?: string, isEndOfDay = false): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const clean = dateStr.trim();

  // DD/MM/YYYY or DD/MM/YYYY HH:mm
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(clean)) {
    const parts = clean.split(/[\sT]+/);
    const dateParts = parts[0].split('/');
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);
    let hours = isEndOfDay ? 23 : 0;
    let minutes = isEndOfDay ? 59 : 0;
    let seconds = isEndOfDay ? 59 : 0;
    if (parts[1]) {
      const timeParts = parts[1].split(':');
      hours = parseInt(timeParts[0], 10) || 0;
      minutes = parseInt(timeParts[1], 10) || 0;
      seconds = parseInt(timeParts[2], 10) || 0;
    }
    return new Date(year, month, day, hours, minutes, seconds);
  }

  // YYYY-MM-DD or YYYY-MM-DD HH:mm
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(clean)) {
    const d = new Date(clean.replace(' ', 'T'));
    if (!isNaN(d.getTime())) {
      if (clean.length === 10 && isEndOfDay) {
        d.setHours(23, 59, 59, 999);
      }
      return d;
    }
  }

  const fallback = new Date(clean);
  return isNaN(fallback.getTime()) ? null : fallback;
}

const DEFAULT_SPREADSHEET_ID = '1s821ayXfONNpZkcQ3loP--MINepO0IybpkeUB0_ZNDs';

export class GoogleSheetsService {
  private spreadsheetId: string;
  private cache: {
    courses?: { data: SheetCourse[]; timestamp: number };
    disciplines?: { data: SheetDiscipline[]; timestamp: number };
    appConfig?: { data: Record<string, string>; timestamp: number };
    prizes?: { data: SheetPrize[]; timestamp: number };
  } = {};

  // In-memory overlay for newly created or updated questions
  private localQuestions: Map<string, SheetQuestion> = new Map();
  // In-memory cache for students and professors
  private localStudents: Map<string, SheetStudent> = new Map();
  private localProfessors: Map<string, SheetProfessor> = new Map();
  // In-memory overlay for prizes (allows coordinator to activate/simulate during pilot)
  private localPrizes: Map<string, Partial<SheetPrize>> = new Map();

  private isConnectedToLiveSheets = false;
  private cacheDurationMs = 5 * 60 * 1000; // 5 minutes cache for courses/disciplines

  constructor() {
    this.spreadsheetId = process.env.MACK_ENADE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;

    // Seed pilot accounts into local overlay (complements live Google Sheet entries)
    this.localStudents.set('1007000050@mackenzie.br', {
      student_id: 'stu-emely-01',
      institutional_email: '1007000050@mackenzie.br',
      full_name: 'Emely',
      course_id: 'PROD',
      cohort_year: '2024',
      class_group: 'Turma ENADE 2026',
      status: 'ACTIVE',
      pilot_eligible: 'TRUE',
      login_active: 'TRUE',
      access_code: '1234',
    });

    this.localStudents.set('gabriel.siqueira@mackenzista.com.br', {
      student_id: 'stu-gabriel-01',
      institutional_email: 'gabriel.siqueira@mackenzista.com.br',
      full_name: 'Gabriel M. Siqueira',
      course_id: 'PROD',
      cohort_year: '2024',
      class_group: 'Turma ENADE 2026',
      status: 'ACTIVE',
      pilot_eligible: 'TRUE',
      login_active: 'TRUE',
      access_code: 'MACK-7K4P9X',
    });

    this.localProfessors.set('1007000050@mackenzie.br', {
      professor_id: 'prof-emely-01',
      institutional_email: '1007000050@mackenzie.br',
      full_name: 'Emely',
      course_id: 'BOTH',
      mentor_area: 'Engenharia de Produção & Inovação',
      is_mentor: 'TRUE',
      can_create_questions: 'TRUE',
      can_create_challenges: 'TRUE',
      can_view_analytics: 'TRUE',
      status: 'ACTIVE',
      login_active: 'TRUE',
      access_code: '1234',
    });

    this.localProfessors.set('carlos.medeiros@mackenzie.br', {
      professor_id: 'prof-carlos-01',
      institutional_email: 'carlos.medeiros@mackenzie.br',
      full_name: 'Prof. Dr. Carlos Medeiros',
      course_id: 'PROD',
      mentor_area: 'Gestão da Produção e Engenharia Econômica',
      is_mentor: 'TRUE',
      can_create_questions: 'TRUE',
      can_create_challenges: 'TRUE',
      can_view_analytics: 'TRUE',
      status: 'ACTIVE',
      login_active: 'TRUE',
      access_code: 'MACK-PROF-99',
    });

    this.localProfessors.set('helena.bittencourt@mackenzie.br', {
      professor_id: 'prof-helena-01',
      institutional_email: 'helena.bittencourt@mackenzie.br',
      full_name: 'Profa. Dra. Helena Bittencourt',
      course_id: 'BOTH',
      mentor_area: 'Coordenação ENADE & NDE',
      is_mentor: 'TRUE',
      can_create_questions: 'TRUE',
      can_create_challenges: 'TRUE',
      can_view_analytics: 'TRUE',
      status: 'ACTIVE',
      login_active: 'TRUE',
      access_code: 'MACK-COORD-01',
    });
  }

  public updateStudentAccess(
    email: string,
    updates: { access_code?: string; login_active?: string }
  ): SheetStudent {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.localStudents.get(cleanEmail) || {
      student_id: 'stu-' + Date.now().toString(36),
      institutional_email: cleanEmail,
      full_name: cleanEmail.split('@')[0],
      course_id: 'PROD',
      cohort_year: '2024',
      class_group: 'Turma ENADE 2026',
      status: 'ACTIVE',
      pilot_eligible: 'TRUE',
      login_active: 'TRUE',
    };

    if (updates.access_code !== undefined) {
      existing.access_code = updates.access_code.trim().toUpperCase();
    }
    if (updates.login_active !== undefined) {
      existing.login_active = updates.login_active.trim().toUpperCase();
      existing.status = updates.login_active.toUpperCase() === 'TRUE' ? 'ACTIVE' : 'INACTIVE';
    }

    this.localStudents.set(cleanEmail, existing);
    return existing;
  }

  public updateProfessorAccess(
    email: string,
    updates: { access_code?: string; login_active?: string }
  ): SheetProfessor {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.localProfessors.get(cleanEmail) || {
      professor_id: 'prof-' + Date.now().toString(36),
      institutional_email: cleanEmail,
      full_name: cleanEmail.split('@')[0],
      course_id: 'PROD',
      mentor_area: 'Área de Engenharia',
      is_mentor: 'TRUE',
      can_create_questions: 'TRUE',
      can_create_challenges: 'TRUE',
      can_view_analytics: 'TRUE',
      status: 'ACTIVE',
      login_active: 'TRUE',
    };

    if (updates.access_code !== undefined) {
      existing.access_code = updates.access_code.trim().toUpperCase();
    }
    if (updates.login_active !== undefined) {
      existing.login_active = updates.login_active.trim().toUpperCase();
      existing.status = updates.login_active.toUpperCase() === 'TRUE' ? 'ACTIVE' : 'INACTIVE';
    }

    this.localProfessors.set(cleanEmail, existing);
    return existing;
  }

  public getSpreadsheetId(): string {
    return this.spreadsheetId;
  }

  public clearCache(): void {
    this.cache = {};
  }

  public isConnected(): boolean {
    return this.isConnectedToLiveSheets;
  }

  /**
   * Parses standard CSV text with quotes and comma support
   */
  private parseCsv(csvText: string): Record<string, string>[] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentVal = '';
    let insideQuote = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (insideQuote && nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        currentRow.push(currentVal);
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !insideQuote) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentVal);
        if (currentRow.length > 0 && currentRow.some((c) => c.trim() !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    if (currentVal || currentRow.length > 0) {
      currentRow.push(currentVal);
      if (currentRow.some((c) => c.trim() !== '')) {
        rows.push(currentRow);
      }
    }

    if (rows.length === 0) return [];
    const headers = rows[0].map((h) => h.trim().replace(/^"|"$/g, ''));
    return rows.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx] !== undefined ? row[idx].trim().replace(/^"|"$/g, '') : '';
      });
      return obj;
    });
  }

  /**
   * Fetches a worksheet tab as CSV from Google Sheets
   */
  public async fetchTabCsv(tabName: string): Promise<Record<string, string>[]> {
    const url = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
      tabName
    )}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/csv; charset=utf-8',
          'User-Agent': 'Mack-ENADE-Backend/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Erro HTTP ${response.status} ao acessar aba "${tabName}" da planilha ${this.spreadsheetId}`
        );
      }

      const csvText = await response.text();
      this.isConnectedToLiveSheets = true;
      return this.parseCsv(csvText);
    } catch (err: any) {
      console.error(`[GoogleSheetsService] Erro ao carregar aba "${tabName}":`, err.message);
      throw err;
    }
  }

  /**
   * Loads students from the "students" worksheet
   */
  public async getStudents(): Promise<SheetStudent[]> {
    try {
      const rows = await this.fetchTabCsv('students');
      const students: SheetStudent[] = rows.map((r) => ({
        student_id: r.student_id || '',
        institutional_email: (r.institutional_email || '').trim().toLowerCase(),
        full_name: r.full_name || r.name || '',
        course_id: (r.course_id || '').toUpperCase().trim(),
        cohort_year: r.cohort_year || r.cohort || '',
        class_group: r.class_group || r.class || '',
        status: (r.status || 'ACTIVE').toUpperCase().trim(),
        pilot_eligible: (r.pilot_eligible || 'TRUE').toUpperCase().trim(),
        microsoft_entra_id: r.microsoft_entra_id || '',
        created_at: r.created_at || '',
        last_login_at: r.last_login_at || '',
        login_active: r.login_active !== undefined ? r.login_active.toUpperCase().trim() : undefined,
        access_code: (r.access_code || '').trim().toUpperCase() || undefined,
      }));

      // Merge with any locally added students
      for (const local of this.localStudents.values()) {
        const idx = students.findIndex(
          (s) => s.institutional_email === local.institutional_email
        );
        if (idx >= 0) {
          students[idx] = {
            ...local,
            ...students[idx],
            access_code: students[idx].access_code || local.access_code,
            login_active: local.login_active !== undefined ? local.login_active : students[idx].login_active,
            status: local.status !== undefined ? local.status : students[idx].status,
          };
        } else {
          students.push(local);
        }
      }

      return students;
    } catch (err) {
      console.warn('[GoogleSheetsService] Usando fallback local para estudantes');
      return Array.from(this.localStudents.values());
    }
  }

  /**
   * Loads professors from the "professors" worksheet
   */
  public async getProfessors(): Promise<SheetProfessor[]> {
    try {
      const rows = await this.fetchTabCsv('professors');
      const professors: SheetProfessor[] = rows.map((r) => ({
        professor_id: r.professor_id || '',
        institutional_email: (r.institutional_email || '').trim().toLowerCase(),
        full_name: r.full_name || r.name || '',
        course_id: (r.course_id || '').toUpperCase().trim(),
        mentor_area: r.mentor_area || '',
        is_mentor: (r.is_mentor || r.mentor_status || 'TRUE').toUpperCase().trim(),
        can_create_questions: (r.can_create_questions || 'TRUE').toUpperCase().trim(),
        can_create_challenges: (r.can_create_challenges || 'TRUE').toUpperCase().trim(),
        can_view_analytics: (r.can_view_analytics || 'TRUE').toUpperCase().trim(),
        status: (r.status || 'ACTIVE').toUpperCase().trim(),
        microsoft_entra_id: r.microsoft_entra_id || '',
        login_active: r.login_active !== undefined ? r.login_active.toUpperCase().trim() : undefined,
        access_code: (r.access_code || '').trim().toUpperCase() || undefined,
      }));

      // Merge with local professors
      for (const local of this.localProfessors.values()) {
        const idx = professors.findIndex(
          (p) => p.institutional_email === local.institutional_email
        );
        if (idx >= 0) {
          professors[idx] = {
            ...local,
            ...professors[idx],
            access_code: professors[idx].access_code || local.access_code,
            login_active: local.login_active !== undefined ? local.login_active : professors[idx].login_active,
            status: local.status !== undefined ? local.status : professors[idx].status,
          };
        } else {
          professors.push(local);
        }
      }

      return professors;
    } catch (err) {
      console.warn('[GoogleSheetsService] Usando fallback local para professores');
      return Array.from(this.localProfessors.values());
    }
  }

  /**
   * Loads courses from the "courses" worksheet with in-memory caching
   */
  public async getCourses(forceRefresh = false): Promise<SheetCourse[]> {
    const now = Date.now();
    if (!forceRefresh && this.cache.courses && now - this.cache.courses.timestamp < this.cacheDurationMs) {
      return this.cache.courses.data;
    }

    try {
      const rows = await this.fetchTabCsv('courses');
      const courses: SheetCourse[] = rows.map((r) => ({
        course_id: (r.course_id || '').toUpperCase().trim(),
        course_name_pt: r.course_name_pt || r.course_name || '',
        course_name_en: r.course_name_en || '',
        short_name: r.short_name || '',
        cine_brasil_code: r.cine_brasil_code || '',
        enade_year: r.enade_year || '2026',
        active: (r.active || 'TRUE').toUpperCase().trim(),
      }));

      this.cache.courses = { data: courses, timestamp: now };
      return courses;
    } catch (err) {
      console.warn('[GoogleSheetsService] Falha ao carregar cursos, usando fallback institucional');
      const fallback: SheetCourse[] = [
        {
          course_id: 'CIVIL',
          course_name_pt: 'Engenharia Civil',
          course_name_en: 'Civil Engineering',
          short_name: 'Civil',
          cine_brasil_code: '0732E01',
          enade_year: '2026',
          active: 'TRUE',
        },
        {
          course_id: 'PROD',
          course_name_pt: 'Engenharia de Produção',
          course_name_en: 'Production Engineering',
          short_name: 'Produção',
          cine_brasil_code: '0725E02',
          enade_year: '2026',
          active: 'TRUE',
        },
      ];
      return fallback;
    }
  }

  /**
   * Loads disciplines from the "disciplines" worksheet with in-memory caching
   */
  public async getDisciplines(courseId?: string, forceRefresh = false): Promise<SheetDiscipline[]> {
    const now = Date.now();
    let allDisciplines: SheetDiscipline[];

    if (!forceRefresh && this.cache.disciplines && now - this.cache.disciplines.timestamp < this.cacheDurationMs) {
      allDisciplines = this.cache.disciplines.data;
    } else {
      try {
        const rows = await this.fetchTabCsv('disciplines');
        allDisciplines = rows.map((r) => ({
          discipline_id: r.discipline_id || '',
          course_id: (r.course_id || '').toUpperCase().trim(),
          discipline_name: r.discipline_name || '',
          enade_component: r.enade_component || 'SPECIFIC',
          display_order: r.display_order || '0',
          active: (r.active || 'TRUE').toUpperCase().trim(),
          source_reference: r.source_reference || '',
          source_url: r.source_url || '',
        }));

        this.cache.disciplines = { data: allDisciplines, timestamp: now };
      } catch (err) {
        console.warn('[GoogleSheetsService] Falha ao carregar disciplinas, usando fallback em cache');
        allDisciplines = this.cache.disciplines?.data || [];
      }
    }

    if (courseId) {
      const normalizedCourse = courseId.toUpperCase().trim();
      return allDisciplines.filter((d) => d.course_id === normalizedCourse);
    }
    return allDisciplines;
  }

  /**
   * Loads questions from the "questions" worksheet
   */
  public async getQuestions(): Promise<SheetQuestion[]> {
    let sheetQuestions: SheetQuestion[] = [];

    try {
      const rows = await this.fetchTabCsv('questions');
      sheetQuestions = rows.map((r) => {
        const rawActive = (r.active || 'FALSE').toUpperCase().trim();
        const rawStatus = (r.review_status || 'DRAFT').toUpperCase().trim();

        const question: SheetQuestion = {
          question_id: r.question_id || '',
          course_id: (r.course_id || '').toUpperCase().trim(),
          discipline_id: r.discipline_id || '',
          professor_id: r.professor_id || '',
          enade_component: r.enade_component || 'SPECIFIC',
          question_type: r.question_type || 'MULTIPLE_CHOICE',
          difficulty: r.difficulty || 'MEDIUM',
          topic: r.topic || '',
          competency: r.competency || '',
          statement: r.statement || '',
          supporting_text: r.supporting_text || '',
          image_url: r.image_url || '',
          alternative_a: r.alternative_a || '',
          alternative_b: r.alternative_b || '',
          alternative_c: r.alternative_c || '',
          alternative_d: r.alternative_d || '',
          alternative_e: r.alternative_e || '',
          correct_answer: (r.correct_answer || r.answer_key || 'A').toUpperCase().trim(),
          explanation: r.explanation || '',
          common_error: r.common_error || '',
          creation_method: r.creation_method || 'MANUAL',
          source: r.source || r.source_title || 'Mack ENADE',
          source_year: r.source_year || '2026',
          source_url: r.source_url || '',
          review_status: (['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'].includes(rawStatus)
            ? rawStatus
            : 'DRAFT') as any,
          reviewed_by: r.reviewed_by || r.reviewed_by_professor_id || '',
          created_at: r.created_at || new Date().toISOString(),
          updated_at: r.updated_at || new Date().toISOString(),
          active: rawActive === 'TRUE',
          tags: r.tags || '',
          expected_response_time: Number(r.expected_response_time || r.estimated_time_seconds) || 120,
        };

        return question;
      });
    } catch (err) {
      console.warn('[GoogleSheetsService] Erro ao carregar questões da planilha, usando cache');
    }

    // Merge in-memory local modifications (professor questions, status changes)
    const combined = new Map<string, SheetQuestion>();
    for (const q of sheetQuestions) {
      combined.set(q.question_id, q);
    }
    for (const [id, q] of this.localQuestions.entries()) {
      combined.set(id, q);
    }

    return Array.from(combined.values());
  }

  /**
   * Adds or updates a question in the local questions store
   */
  public saveQuestion(question: SheetQuestion): SheetQuestion {
    this.localQuestions.set(question.question_id, question);
    return question;
  }

  /**
   * Updates question review status
   */
  public updateQuestionStatus(
    questionId: string,
    status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED',
    active?: boolean
  ): SheetQuestion | null {
    const existing = this.localQuestions.get(questionId);
    if (existing) {
      existing.review_status = status;
      if (active !== undefined) {
        existing.active = active;
      }
      existing.updated_at = new Date().toISOString();
      this.localQuestions.set(questionId, existing);
      return existing;
    }
    return null;
  }

  /**
   * Adds seed question to in-memory store
   */
  public addSeedQuestion(question: SheetQuestion): void {
    if (!this.localQuestions.has(question.question_id)) {
      this.localQuestions.set(question.question_id, question);
    }
  }

  /**
   * Loads real prizes from the "prizes" worksheet in the Google Sheets database.
   * Auto-refreshes with a short TTL (30s) or forces refresh when requested.
   */
  public async getPrizes(forceRefresh = false): Promise<SheetPrize[]> {
    const now = Date.now();
    const PRIZES_CACHE_TTL = 30 * 1000; // 30 seconds for near-realtime updates without redeployment

    if (!forceRefresh && this.cache.prizes && now - this.cache.prizes.timestamp < PRIZES_CACHE_TTL) {
      return this.applyLocalPrizeOverrides(this.cache.prizes.data);
    }

    try {
      const rows = await this.fetchTabCsv('prizes');
      const prizes: SheetPrize[] = rows.map((r) => {
        const prizeId = r.prize_id?.trim() || '';
        const rawActive = r.active;
        const active = isSheetBoolTrue(rawActive);
        const status = (r.status || 'DRAFT').trim().toUpperCase();

        return {
          prize_id: prizeId,
          prize_name: r.prize_name?.trim() || 'Prêmio sem nome',
          short_description: r.short_description?.trim() || '',
          full_description: r.full_description?.trim() || '',
          image_url: r.image_url?.trim() || '',
          image_alt_text: r.image_alt_text?.trim() || '',
          prize_type: (r.prize_type || 'WEEKLY').trim().toUpperCase(),
          award_category: (r.award_category || 'PERFORMANCE').trim().toUpperCase(),
          course_id: (r.course_id || 'ALL').trim().toUpperCase(),
          discipline_id: r.discipline_id?.trim() || undefined,
          quantity: parseInt(r.quantity, 10) || 1,
          start_date: r.start_date?.trim() || undefined,
          end_date: r.end_date?.trim() || undefined,
          announcement_date: r.announcement_date?.trim() || undefined,
          min_questions: parseInt(r.min_questions, 10) || 0,
          min_active_days: parseInt(r.min_active_days, 10) || 0,
          min_mentor_challenges: parseInt(r.min_mentor_challenges, 10) || 0,
          min_missions: parseInt(r.min_missions, 10) || 0,
          min_accuracy_pct: parseFloat(r.min_accuracy_pct) || 0,
          eligibility_notes: r.eligibility_notes?.trim() || '',
          sponsor: r.sponsor?.trim() || undefined,
          terms_url: r.terms_url?.trim() || undefined,
          status,
          active,
          display_order: parseInt(r.display_order, 10) || 999,
          created_at: r.created_at?.trim() || undefined,
          updated_at: r.updated_at?.trim() || undefined,
        };
      });

      this.cache.prizes = { data: prizes, timestamp: now };
      return this.applyLocalPrizeOverrides(prizes);
    } catch (err: any) {
      console.warn('[GoogleSheetsService] Erro ao carregar aba prizes do Google Sheets:', err.message);
      if (this.cache.prizes?.data) {
        return this.applyLocalPrizeOverrides(this.cache.prizes.data);
      }
      return [];
    }
  }

  /**
   * Applies in-memory coordinator overrides for testing/simulation
   */
  private applyLocalPrizeOverrides(prizes: SheetPrize[]): SheetPrize[] {
    if (this.localPrizes.size === 0) return prizes;
    return prizes.map((p) => {
      const override = this.localPrizes.get(p.prize_id);
      return override ? { ...p, ...override } : p;
    });
  }

  /**
   * Updates an in-memory prize override (for coordinator testing)
   */
  public updatePrize(prizeId: string, updates: Partial<SheetPrize>): SheetPrize | null {
    const existing = this.localPrizes.get(prizeId) || {};
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.localPrizes.set(prizeId, updated);
    if (this.cache.prizes) {
      this.cache.prizes.timestamp = 0; // Invalidate cache immediately
    }
    return updated as SheetPrize;
  }

  /**
   * Clears course, discipline and prize cache for refreshing data from Google Sheets
   */
  public refreshCache(): void {
    this.cache = {};
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();
