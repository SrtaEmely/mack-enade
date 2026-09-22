/**
 * Course Service for Mack ENADE
 * Accesses courses via Google Sheets with caching
 */

import { googleSheetsService, SheetCourse } from './googleSheetsService';

export class CourseService {
  public async getCourses(forceRefresh = false): Promise<SheetCourse[]> {
    return googleSheetsService.getCourses(forceRefresh);
  }

  public async getCourseById(courseId: string): Promise<SheetCourse | null> {
    const courses = await this.getCourses();
    const normalized = (courseId || '').toUpperCase().trim();
    return courses.find((c) => c.course_id === normalized) || null;
  }
}

export const courseService = new CourseService();
