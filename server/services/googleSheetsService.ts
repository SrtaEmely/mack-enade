/**
 * Google Sheets Service for Mack ENADE Pilot
 * Server-side only. Uses Google Sheets API with a service account.
 */

import crypto from 'crypto';

export function generatePilotAccessCode(): string {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[bytes[i] % chars.length];
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
  role?: string;
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

export function isSheetBoolTrue(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (!val) return false;
  const s = String(val).trim().toUpperCase();
  return ['TRUE', 'VERDADEIRO', 'SIM', '1'].includes(s);
}

export function parseFlexibleDate(dateStr?: string, isEndOfDay = false): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const clean = dateStr.trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(clean)) {
    const [datePart, timePart] = clean.split(/[\sT]+/);
    const [day, monthRaw, year] = datePart.split('/').map(Number);
    const month = monthRaw - 1;
    let hours = isEndOfDay ? 23 : 0;
    let minutes = isEndOfDay ? 59 : 0;
    let seconds = isEndOfDay ? 59 : 0;
    if (timePart) {
      const parts = timePart.split(':').map(Number);
      hours = parts[0] || 0;
      minutes = parts[1] || 0;
      seconds = parts[2] || 0;
    }
    return new Date(year, month, day, hours, minutes, seconds);
  }
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(clean)) {
    const d = new Date(clean.replace(' ', 'T'));
    if (!Number.isNaN(d.getTime())) {
      if (clean.length === 10 && isEndOfDay) d.setHours(23, 59, 59, 999);
      return d;
    }
  }
  const fallback = new Date(clean);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri?: string;
  project_id?: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

const DEFAULT_SPREADSHEET_ID = '1s821ayXfONNpZkcQ3loP--MINepO0IybpkeUB0_ZNDs';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function columnLetter(index: number): string {
  let n = index + 1;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

export class GoogleSheetsService {
  private spreadsheetId: string;
  private credentials: ServiceAccountCredentials | null = null;
  private tokenCache: CachedToken | null = null;
  private isConnectedToLiveSheets = false;
  private cacheDurationMs = 5 * 60 * 1000;
  private cache: {
    courses?: { data: SheetCourse[]; timestamp: number };
    disciplines?: { data: SheetDiscipline[]; timestamp: number };
    prizes?: { data: SheetPrize[]; timestamp: number };
  } = {};

  // Development-only seed questions; never used for pilot users/authentication.
  private localQuestions: Map<string, SheetQuestion> = new Map();

  constructor() {
    this.spreadsheetId = process.env.MACK_ENADE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ServiceAccountCredentials;
        parsed.private_key = parsed.private_key?.replace(/\\n/g, '\n');
        if (parsed.client_email && parsed.private_key) this.credentials = parsed;
      } catch (err) {
        console.error('[GoogleSheetsService] GOOGLE_SERVICE_ACCOUNT_JSON inválido.');
      }
    }
  }

  public getSpreadsheetId(): string { return this.spreadsheetId; }
  public clearCache(): void { this.cache = {}; }
  public refreshCache(): void { this.clearCache(); }
  public isConnected(): boolean { return this.isConnectedToLiveSheets; }

  private ensureCredentials(): ServiceAccountCredentials {
    if (!this.credentials) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON não configurado. Configure uma Service Account e compartilhe a planilha com seu e-mail.');
    }
    return this.credentials;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.tokenCache && this.tokenCache.expiresAt - 60_000 > now) return this.tokenCache.token;

    const c = this.ensureCredentials();
    const issuedAt = Math.floor(now / 1000);
    const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = base64Url(JSON.stringify({
      iss: c.client_email,
      scope: SHEETS_SCOPE,
      aud: c.token_uri || 'https://oauth2.googleapis.com/token',
      exp: issuedAt + 3600,
      iat: issuedAt,
    }));
    const unsigned = `${header}.${payload}`;
    const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), c.private_key);
    const assertion = `${unsigned}.${base64Url(signature)}`;

    const response = await fetch(c.token_uri || 'https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });
    if (!response.ok) throw new Error(`Falha ao autenticar Service Account (${response.status}).`);
    const data: any = await response.json();
    this.tokenCache = { token: data.access_token, expiresAt: now + Number(data.expires_in || 3600) * 1000 };
    return this.tokenCache.token;
  }

  private async apiRequest(path: string, init: RequestInit = {}): Promise<any> {
    const token = await this.getAccessToken();
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Google Sheets API ${response.status}: ${body.slice(0, 500)}`);
    }
    this.isConnectedToLiveSheets = true;
    return response.status === 204 ? null : response.json();
  }

  private rowsToObjects(values: any[][]): Record<string, string>[] {
    if (!values?.length) return [];
    const headers = (values[0] || []).map((h: any) => String(h || '').trim());
    return values.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => { if (h) obj[h] = row[idx] === undefined ? '' : String(row[idx]).trim(); });
      return obj;
    }).filter((r) => Object.values(r).some((v) => v !== ''));
  }

  public async fetchTabCsv(tabName: string): Promise<Record<string, string>[]> {
    // Kept for backward compatibility; now reads privately via Sheets API.
    const encodedRange = encodeURIComponent(`'${tabName.replace(/'/g, "''")}'!A:ZZ`);
    const data = await this.apiRequest(`/values/${encodedRange}?majorDimension=ROWS`);
    return this.rowsToObjects(data.values || []);
  }

  private async getHeader(tabName: string): Promise<string[]> {
    const encodedRange = encodeURIComponent(`'${tabName.replace(/'/g, "''")}'!1:1`);
    const data = await this.apiRequest(`/values/${encodedRange}?majorDimension=ROWS`);
    return (data.values?.[0] || []).map((v: any) => String(v || '').trim());
  }

  private serializeValue(value: any): string | number | boolean {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    return value;
  }

  private async appendRecord(tabName: string, record: Record<string, any>): Promise<void> {
    const headers = await this.getHeader(tabName);
    if (!headers.length) throw new Error(`A aba ${tabName} não possui cabeçalho.`);
    const row = headers.map((h) => this.serializeValue(record[h]));
    const range = encodeURIComponent(`'${tabName.replace(/'/g, "''")}'!A:${columnLetter(headers.length - 1)}`);
    await this.apiRequest(`/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      body: JSON.stringify({ majorDimension: 'ROWS', values: [row] }),
    });
  }

  private async updateRecordByKey(tabName: string, keyName: string, keyValue: string, updates: Record<string, any>): Promise<boolean> {
    const encodedRange = encodeURIComponent(`'${tabName.replace(/'/g, "''")}'!A:ZZ`);
    const data = await this.apiRequest(`/values/${encodedRange}?majorDimension=ROWS`);
    const values: any[][] = data.values || [];
    if (!values.length) return false;
    const headers = values[0].map((h: any) => String(h || '').trim());
    const keyIndex = headers.indexOf(keyName);
    if (keyIndex < 0) throw new Error(`Coluna ${keyName} não encontrada na aba ${tabName}.`);
    const normalizeKey = (v: any) => keyName.toLowerCase().includes('email') ? String(v || '').trim().toLowerCase() : String(v || '').trim();
    const rowIndex = values.findIndex((row, idx) => idx > 0 && normalizeKey(row[keyIndex]) === normalizeKey(keyValue));
    if (rowIndex < 1) return false;

    const row = headers.map((h, idx) => {
      if (Object.prototype.hasOwnProperty.call(updates, h)) return this.serializeValue(updates[h]);
      return values[rowIndex][idx] ?? '';
    });
    const startRow = rowIndex + 1;
    const range = encodeURIComponent(`'${tabName.replace(/'/g, "''")}'!A${startRow}:${columnLetter(headers.length - 1)}${startRow}`);
    await this.apiRequest(`/values/${range}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({ majorDimension: 'ROWS', values: [row] }),
    });
    return true;
  }

  public async getStudents(): Promise<SheetStudent[]> {
    const rows = await this.fetchTabCsv('students');
    return rows.map((r) => ({
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
    })).filter((s) => Boolean(s.institutional_email));
  }

  public async getProfessors(): Promise<SheetProfessor[]> {
    const rows = await this.fetchTabCsv('professors');
    return rows.map((r) => ({
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
      role: (r.role || '').toUpperCase().trim() || undefined,
      microsoft_entra_id: r.microsoft_entra_id || '',
      login_active: r.login_active !== undefined ? r.login_active.toUpperCase().trim() : undefined,
      access_code: (r.access_code || '').trim().toUpperCase() || undefined,
    })).filter((p) => Boolean(p.institutional_email));
  }

  public async updateStudentAccess(email: string, updates: { access_code?: string; login_active?: string }): Promise<SheetStudent> {
    const cleanEmail = email.trim().toLowerCase();
    const payload: Record<string, any> = { ...updates };
    if (updates.access_code !== undefined) payload.access_code = updates.access_code.trim().toUpperCase();
    if (updates.login_active !== undefined) {
      payload.login_active = updates.login_active.trim().toUpperCase();
      payload.status = isSheetBoolTrue(updates.login_active) ? 'ACTIVE' : 'INACTIVE';
    }
    const ok = await this.updateRecordByKey('students', 'institutional_email', cleanEmail, payload);
    if (!ok) throw new Error('Estudante não encontrado na planilha.');
    const students = await this.getStudents();
    const found = students.find((s) => s.institutional_email === cleanEmail);
    if (!found) throw new Error('Estudante não encontrado após atualização.');
    return found;
  }

  public async updateProfessorAccess(email: string, updates: { access_code?: string; login_active?: string }): Promise<SheetProfessor> {
    const cleanEmail = email.trim().toLowerCase();
    const payload: Record<string, any> = { ...updates };
    if (updates.access_code !== undefined) payload.access_code = updates.access_code.trim().toUpperCase();
    if (updates.login_active !== undefined) {
      payload.login_active = updates.login_active.trim().toUpperCase();
      payload.status = isSheetBoolTrue(updates.login_active) ? 'ACTIVE' : 'INACTIVE';
    }
    const ok = await this.updateRecordByKey('professors', 'institutional_email', cleanEmail, payload);
    if (!ok) throw new Error('Professor não encontrado na planilha.');
    const professors = await this.getProfessors();
    const found = professors.find((p) => p.institutional_email === cleanEmail);
    if (!found) throw new Error('Professor não encontrado após atualização.');
    return found;
  }

  public async getCourses(forceRefresh = false): Promise<SheetCourse[]> {
    const now = Date.now();
    if (!forceRefresh && this.cache.courses && now - this.cache.courses.timestamp < this.cacheDurationMs) return this.cache.courses.data;
    const rows = await this.fetchTabCsv('courses');
    const courses = rows.map((r) => ({
      course_id: (r.course_id || '').toUpperCase().trim(),
      course_name_pt: r.course_name_pt || r.course_name || '',
      course_name_en: r.course_name_en || '',
      short_name: r.short_name || '',
      cine_brasil_code: r.cine_brasil_code || '',
      enade_year: r.enade_year || '2026',
      active: (r.active || 'TRUE').toUpperCase().trim(),
    })).filter((c) => c.course_id);
    this.cache.courses = { data: courses, timestamp: now };
    return courses;
  }

  public async getDisciplines(courseId?: string, forceRefresh = false): Promise<SheetDiscipline[]> {
    const now = Date.now();
    let all: SheetDiscipline[];
    if (!forceRefresh && this.cache.disciplines && now - this.cache.disciplines.timestamp < this.cacheDurationMs) all = this.cache.disciplines.data;
    else {
      const rows = await this.fetchTabCsv('disciplines');
      all = rows.map((r) => ({
        discipline_id: r.discipline_id || '',
        course_id: (r.course_id || '').toUpperCase().trim(),
        discipline_name: r.discipline_name || '',
        enade_component: r.enade_component || 'SPECIFIC',
        display_order: r.display_order || '0',
        active: (r.active || 'TRUE').toUpperCase().trim(),
        source_reference: r.source_reference || '',
        source_url: r.source_url || '',
      })).filter((d) => d.discipline_id);
      this.cache.disciplines = { data: all, timestamp: now };
    }
    if (!courseId) return all;
    const target = courseId.toUpperCase().trim();
    return all.filter((d) => d.course_id === target || d.course_id === 'BOTH');
  }

  public async getQuestions(): Promise<SheetQuestion[]> {
    const rows = await this.fetchTabCsv('questions');
    const sheet = rows.map((r) => {
      const rawStatus = (r.review_status || 'DRAFT').toUpperCase().trim();
      return {
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
        review_status: (['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'].includes(rawStatus) ? rawStatus : 'DRAFT') as SheetQuestion['review_status'],
        reviewed_by: r.reviewed_by || '',
        created_at: r.created_at || '',
        updated_at: r.updated_at || '',
        active: isSheetBoolTrue(r.active),
        tags: r.tags || '',
        expected_response_time: Number(r.expected_response_time || r.estimated_time_seconds) || 120,
      } as SheetQuestion;
    }).filter((q) => q.question_id);

    // Development seed questions remain available only if the sheet does not contain them.
    const combined = new Map(sheet.map((q) => [q.question_id, q]));
    for (const [id, q] of this.localQuestions) if (!combined.has(id)) combined.set(id, q);
    return [...combined.values()];
  }

  public async saveQuestion(question: SheetQuestion): Promise<SheetQuestion> {
    const exists = (await this.getQuestions()).some((q) => q.question_id === question.question_id);
    const record: Record<string, any> = { ...question, active: question.active ? 'TRUE' : 'FALSE' };
    if (exists) {
      await this.updateRecordByKey('questions', 'question_id', question.question_id, record);
    } else {
      await this.appendRecord('questions', record);
    }
    return question;
  }

  public async updateQuestionStatus(questionId: string, status: SheetQuestion['review_status'], active?: boolean): Promise<SheetQuestion | null> {
    const existing = (await this.getQuestions()).find((q) => q.question_id === questionId);
    if (!existing) return null;
    const updated = { ...existing, review_status: status, active: active ?? existing.active, updated_at: new Date().toISOString() };
    await this.saveQuestion(updated);
    return updated;
  }

  public addSeedQuestion(question: SheetQuestion): void {
    if (!this.localQuestions.has(question.question_id)) this.localQuestions.set(question.question_id, question);
  }

  public async getPrizes(forceRefresh = false): Promise<SheetPrize[]> {
    const now = Date.now();
    const ttl = 30_000;
    if (!forceRefresh && this.cache.prizes && now - this.cache.prizes.timestamp < ttl) return this.cache.prizes.data;
    const rows = await this.fetchTabCsv('prizes');
    const prizes = rows.map((r) => ({
      prize_id: r.prize_id?.trim() || '',
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
      status: (r.status || 'DRAFT').trim().toUpperCase(),
      active: isSheetBoolTrue(r.active),
      display_order: parseInt(r.display_order, 10) || 999,
      created_at: r.created_at?.trim() || undefined,
      updated_at: r.updated_at?.trim() || undefined,
    })).filter((p) => p.prize_id);
    this.cache.prizes = { data: prizes, timestamp: now };
    return prizes;
  }

  public async updatePrize(prizeId: string, updates: Partial<SheetPrize>): Promise<SheetPrize | null> {
    const existing = (await this.getPrizes(true)).find((p) => p.prize_id === prizeId);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() } as SheetPrize;
    const ok = await this.updateRecordByKey('prizes', 'prize_id', prizeId, {
      ...updated,
      active: updated.active ? 'TRUE' : 'FALSE',
    });
    if (!ok) return null;
    this.cache.prizes = undefined;
    return updated;
  }
}

export const googleSheetsService = new GoogleSheetsService();
