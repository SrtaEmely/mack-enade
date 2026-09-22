/**
 * Discipline Service for Mack ENADE
 * Retrieves ENADE disciplines linked to specific courses from Google Sheets
 */

import { googleSheetsService, SheetDiscipline } from './googleSheetsService';

export class DisciplineService {
  public async getDisciplines(courseId?: string, forceRefresh = false): Promise<SheetDiscipline[]> {
    return googleSheetsService.getDisciplines(courseId, forceRefresh);
  }

  public async getDisciplineById(disciplineId: string): Promise<SheetDiscipline | null> {
    const disciplines = await this.getDisciplines();
    return disciplines.find((d) => d.discipline_id === disciplineId) || null;
  }
}

export const disciplineService = new DisciplineService();
