/**
 * Student Service for Mack ENADE
 * Manages student profiles and progress connected to Google Sheets
 */

import { googleSheetsService, SheetStudent } from './googleSheetsService';
import { authService } from './authService';

export class StudentService {
  public async getStudents(): Promise<SheetStudent[]> {
    return googleSheetsService.getStudents();
  }

  public async getAllStudents(): Promise<SheetStudent[]> {
    return this.getStudents();
  }

  public async getStudentByEmail(email: string): Promise<SheetStudent | null> {
    const students = await googleSheetsService.getStudents();
    const cleanEmail = authService.normalizeEmail(email);
    return students.find((s) => authService.normalizeEmail(s.institutional_email) === cleanEmail) || null;
  }

  public async getStudentById(id: string): Promise<SheetStudent | null> {
    const students = await googleSheetsService.getStudents();
    return students.find((s) => s.student_id === id) || null;
  }
}

export const studentService = new StudentService();
