/**
 * Professor Service for Mack ENADE
 * Manages professor profiles and permissions connected to Google Sheets
 */

import { googleSheetsService, SheetProfessor } from './googleSheetsService';
import { authService } from './authService';

export class ProfessorService {
  public async getProfessors(): Promise<SheetProfessor[]> {
    return googleSheetsService.getProfessors();
  }

  public async getAllProfessors(): Promise<SheetProfessor[]> {
    return this.getProfessors();
  }

  public async getProfessorByEmail(email: string): Promise<SheetProfessor | null> {
    const professors = await googleSheetsService.getProfessors();
    const cleanEmail = authService.normalizeEmail(email);
    return professors.find((p) => authService.normalizeEmail(p.institutional_email) === cleanEmail) || null;
  }

  public async getProfessorById(id: string): Promise<SheetProfessor | null> {
    const professors = await googleSheetsService.getProfessors();
    return professors.find((p) => p.professor_id === id) || null;
  }
}

export const professorService = new ProfessorService();
