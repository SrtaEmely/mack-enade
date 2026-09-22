import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  initialStudent,
  initialMissions,
  initialCompetencies,
  sampleQuestions,
  initialAchievements,
  simulationExams,
  recommendedActivity,
  initialProfessor,
  initialProfessorTips,
  initialStudentDoubts,
  initialMentorChallenges,
  initialBossBattle,
  initialMentorHourSession,
  initialClassStudents,
  initialInstitutionalAchievements,
  initialRewardCampaigns,
  initialRewardWinners,
  initialCollectiveClassRewards,
} from './src/data/mockData.ts';
import {
  Question,
  RewardCampaign,
  RewardWinner,
  CollectiveClassReward,
  InternalUserProfile,
  MackEnadeRole,
  UserStatus,
} from './src/types.ts';
import { googleSheetsService, SheetQuestion, SheetPrize, parseFlexibleDate } from './server/services/googleSheetsService.ts';
import { authService, PilotAuthUser } from './server/services/authService.ts';
import { courseService } from './server/services/courseService.ts';
import { disciplineService } from './server/services/disciplineService.ts';
import { questionService } from './server/services/questionService.ts';
import { studentService } from './server/services/studentService.ts';
import { professorService } from './server/services/professorService.ts';

// Helper to format SheetQuestion to both frontend standard Question and SheetQuestion fields
function formatQuestionForClient(q: SheetQuestion): Question & Record<string, any> {
  const alternatives = [
    { id: 'A' as const, text: q.alternative_a || '' },
    { id: 'B' as const, text: q.alternative_b || '' },
    { id: 'C' as const, text: q.alternative_c || '' },
    { id: 'D' as const, text: q.alternative_d || '' },
    { id: 'E' as const, text: q.alternative_e || '' },
  ].filter((a) => a.text.trim() !== '');

  const difficultyMap: Record<string, 'Fácil' | 'Médio' | 'Difícil'> = {
    EASY: 'Fácil',
    MEDIUM: 'Médio',
    HARD: 'Difícil',
    FÁCIL: 'Fácil',
    MÉDIO: 'Médio',
    DIFÍCIL: 'Difícil',
  };

  const areaMap: Record<string, string> = {
    SPECIFIC: 'Componente Específico',
    GENERAL: 'Formação Geral',
  };

  const courseDisplay =
    q.course_id === 'CIVIL'
      ? 'Engenharia Civil'
      : q.course_id === 'PROD'
      ? 'Engenharia de Produção'
      : q.course_id === 'BOTH'
      ? 'Engenharias'
      : q.course_id || 'Engenharia';

  return {
    id: q.question_id,
    question_id: q.question_id,
    course: courseDisplay,
    course_id: q.course_id,
    discipline_id: q.discipline_id,
    professor_id: q.professor_id,
    enade_component: q.enade_component,
    area: areaMap[q.enade_component] || q.enade_component || 'Componente Específico',
    competency: q.competency || 'Competência Técnica ENADE',
    topic: q.topic || 'Conhecimento Geral',
    difficulty: difficultyMap[(q.difficulty || '').toUpperCase()] || 'Médio',
    type: q.question_type === 'MULTIPLE_CHOICE' ? 'Múltipla Escolha' : q.question_type || 'Múltipla Escolha',
    statement: q.statement,
    supporting_text: q.supporting_text,
    contextText: q.supporting_text,
    image_url: q.image_url,
    alternatives,
    correctAnswer: ((q.correct_answer || 'A').toUpperCase() as any),
    explanation: q.explanation || 'Resolução fundamentada para o ENADE.',
    commonError: q.common_error || 'Equívoco conceitual frequente.',
    source: q.source || 'Banco Mack ENADE',
    year: Number(q.source_year) || 2026,
    status: q.review_status === 'APPROVED' && q.active ? 'published' : 'draft',
    review_status: q.review_status,
    active: q.active,
    creation_method: q.creation_method,
    reviewed_by: q.reviewed_by,
    created_at: q.created_at,
    updated_at: q.updated_at,
    tags: q.tags,
    expected_response_time: q.expected_response_time,
    analytics: {
      attempts: 42,
      correctCount: 31,
      accuracyRate: 73.8,
      averageTimeSeconds: 110,
      distractorSelections: { A: 4, B: 31, C: 3, D: 2, E: 2 },
    },
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory state for runtime
  let currentStudent = { ...initialStudent };
  let currentMissions = [...initialMissions];
  let currentCompetencies = [...initialCompetencies];
  const currentAchievements = [...initialAchievements];
  const questionResultsHistory: any[] = [];

  let currentQuestions: Question[] = sampleQuestions.map((q) => ({
    ...q,
    status: q.status || 'published',
    authorRole: q.authorRole || 'system',
    analytics: q.analytics || {
      attempts: 86,
      correctCount: 62,
      accuracyRate: 72.1,
      averageTimeSeconds: 110,
      distractorSelections: { A: 8, B: 62, C: 6, D: 7, E: 3 },
    },
  }));

  const currentProfessor = { ...initialProfessor };
  let currentProfessorTips = [...initialProfessorTips];
  let currentStudentDoubts = [...initialStudentDoubts];
  let currentMentorChallenges = [...initialMentorChallenges];
  let currentBossBattle = { ...initialBossBattle };
  let currentMentorHourSession = { ...initialMentorHourSession };
  const currentClassStudents = [...initialClassStudents];
  const currentInstitutionalAchievements = [...initialInstitutionalAchievements];
  let currentRewardCampaigns: RewardCampaign[] = [...initialRewardCampaigns];
  let currentRewardWinners: RewardWinner[] = [...initialRewardWinners];
  let currentCollectiveClassRewards: CollectiveClassReward[] = [...initialCollectiveClassRewards];

  // Lazy Gemini AI helper
  let aiClient: GoogleGenAI | null = null;
  function getAi(): GoogleGenAI | null {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });
    }
    return aiClient;
  }

  // API Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      app: 'Mack ENADE',
      environment: 'PILOT',
      database: 'Google Sheets (MACK_ENADE_SPREADSHEET_ID)',
      timestamp: new Date().toISOString(),
    });
  });

  // --------------------------------------------------------------------------
  // PILOT AUTHENTICATION ENDPOINTS (GOOGLE SHEETS BACKED - NO MICROSOFT ENTRA)
  // --------------------------------------------------------------------------

  // Get current active session
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = authService.getCurrentUser();
    if (!user) {
      return res.status(401).json({ authenticated: false, user: null });
    }
    res.json({ authenticated: true, user });
  });

  // Pilot email + access code login against Google Sheets
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, accessCode, role } = req.body;
      const clientIp =
        (req.headers['x-forwarded-for'] as string) ||
        req.ip ||
        req.socket.remoteAddress ||
        '127.0.0.1';

      const user = await authService.login(email, accessCode, clientIp, role);

      // Synchronize in-memory session user for existing features
      if (user.role === 'STUDENT') {
        currentStudent.name = user.name;
        currentStudent.email = user.institutionalEmail;
        currentStudent.course = user.courseName;
      } else if (user.role === 'PROFESSOR' || user.role === 'COORDINATOR' || user.role === 'ADMIN') {
        currentProfessor.name = user.name;
        currentProfessor.email = user.institutionalEmail;
        currentProfessor.course = user.courseName;
      }

      const redirect =
        user.role === 'PROFESSOR'
          ? '/professor-dashboard'
          : user.role === 'COORDINATOR' || user.role === 'ADMIN'
          ? '/management-dashboard'
          : '/dashboard';

      res.json({
        success: true,
        user,
        role: user.role,
        redirect,
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 401;
      res.status(statusCode).json({
        error: err.userMessage || 'E-mail ou código de acesso inválido.',
        message: err.userMessage || 'E-mail ou código de acesso inválido.',
        secondaryMessage:
          err.secondaryMessage || 'Verifique os dados informados e tente novamente.',
        code: err.code || 'INVALID_CREDENTIALS',
      });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    authService.logout();
    res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
  });

  // Pilot Authorized Users list (for Management/Coordinator inspection - NEVER exposes access_code)
  app.get('/api/auth/users', async (req: Request, res: Response) => {
    try {
      const users = await authService.listUsersForAdmin();
      res.json({ users });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao listar usuários do piloto' });
    }
  });

  // Admin: list users with access status (NEVER exposes access_code)
  app.get('/api/auth/admin/users', async (req: Request, res: Response) => {
    try {
      const users = await authService.listUsersForAdmin();
      res.json({ success: true, users });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao carregar diretório de acesso' });
    }
  });

  // Admin: generate / regenerate access code
  app.post('/api/auth/admin/generate-code', (req: Request, res: Response) => {
    try {
      const { email, role } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'E-mail é obrigatório.' });
      }
      const result = authService.generateAccessCode(email, role);
      res.json({
        success: true,
        message: 'Novo código de acesso gerado.',
        email: result.email,
        accessCode: result.accessCode, // Provided only to the administrator to copy
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao gerar código de acesso' });
    }
  });

  // Admin: activate or deactivate login
  app.post('/api/auth/admin/toggle-login', (req: Request, res: Response) => {
    try {
      const { email, active, role } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'E-mail é obrigatório.' });
      }
      authService.updateUserLoginActive(email, Boolean(active), role);
      res.json({
        success: true,
        message: active ? 'Acesso ativado com sucesso.' : 'Acesso desativado com sucesso.',
        email,
        active: Boolean(active),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao alterar status de login' });
    }
  });

  // --------------------------------------------------------------------------
  // COURSES & DISCIPLINES ENDPOINTS (GOOGLE SHEETS PILOT DATA SOURCE)
  // --------------------------------------------------------------------------

  // List all active courses
  app.get('/api/courses', async (req: Request, res: Response) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const courses = await courseService.getCourses(forceRefresh);
      res.json(courses);
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      res.status(500).json({
        error: 'Não foi possível carregar os dados do Mack ENADE neste momento. Tente novamente.',
      });
    }
  });

  // List disciplines (optionally filtered by courseId)
  app.get(['/api/courses/:courseId/disciplines', '/api/disciplines'], async (req: Request, res: Response) => {
    try {
      const courseId = req.params.courseId || (req.query.course_id as string);
      const forceRefresh = req.query.refresh === 'true';
      const disciplines = await disciplineService.getDisciplines(courseId, forceRefresh);
      res.json(disciplines);
    } catch (err: any) {
      console.error('Error fetching disciplines:', err);
      res.status(500).json({
        error: 'Não foi possível carregar as disciplinas do Mack ENADE neste momento. Tente novamente.',
      });
    }
  });

  // Refresh server-side Google Sheets cache
  app.post('/api/cache/refresh', (req: Request, res: Response) => {
    googleSheetsService.clearCache();
    res.json({ success: true, message: 'Cache do Google Sheets renovado com sucesso.' });
  });

  // Coordinator Overview (pilot metrics from Google Sheets)
  app.get('/api/coordinator/overview', async (req: Request, res: Response) => {
    try {
      const courses = await courseService.getCourses();
      const disciplines = await disciplineService.getDisciplines();
      const students = await studentService.getStudents();
      const professors = await professorService.getProfessors();
      const questions = await questionService.getQuestions();

      const approvedQuestions = questions.filter((q) => q.review_status === 'APPROVED' && q.active);
      const draftQuestions = questions.filter((q) => q.review_status === 'DRAFT');
      const pendingReviewQuestions = questions.filter((q) => q.review_status === 'PENDING_REVIEW');

      res.json({
        totalCourses: courses.length,
        totalDisciplines: disciplines.length,
        totalStudents: students.length,
        totalProfessors: professors.length,
        totalQuestions: questions.length,
        approvedQuestionsCount: approvedQuestions.length,
        draftQuestionsCount: draftQuestions.length,
        pendingReviewCount: pendingReviewQuestions.length,
        coursesSummary: courses.map((c) => ({
          courseId: c.course_id,
          name: c.course_name_pt || c.course_id,
          active: c.active,
          enadeYear: c.enade_year,
        })),
      });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao gerar visão da coordenação' });
    }
  });

  // Student profile
  app.get('/api/student', (req: Request, res: Response) => {
    res.json(currentStudent);
  });

  // Professor profile & overview
  app.get(['/api/professor', '/api/professor/profile'], (req: Request, res: Response) => {
    res.json(currentProfessor);
  });

  app.get('/api/professor/overview', (req: Request, res: Response) => {
    const totalClassStudents = currentClassStudents.length;
    const avgScore = (
      currentClassStudents.reduce((acc, s) => acc + s.estimatedScore, 0) / totalClassStudents
    ).toFixed(1);
    const pendingDoubts = currentStudentDoubts.filter((d) => d.status === 'pending').length;
    const activeChallenges = currentMentorChallenges.filter((c) => c.status === 'active').length;
    const draftQuestions = currentQuestions.filter((q) => q.status === 'draft').length;

    res.json({
      professor: currentProfessor,
      totalStudents: 142,
      averageEstimatedScore: Number(avgScore),
      pendingDoubtsCount: pendingDoubts,
      activeChallengesCount: activeChallenges,
      draftQuestionsCount: draftQuestions,
      publishedQuestionsCount: currentQuestions.filter((q) => q.status === 'published').length,
      publishedTipsCount: currentProfessorTips.length,
      bossBattle: currentBossBattle,
      mentorHour: currentMentorHourSession,
    });
  });

  // Class progress (student list)
  app.get('/api/professor/class-progress', (req: Request, res: Response) => {
    res.json(currentClassStudents);
  });

  // Class performance
  app.get('/api/professor/class-performance', (req: Request, res: Response) => {
    res.json({
      competencies: currentCompetencies,
      students: currentClassStudents,
      classAverageScore: 4.1,
      readinessRate: 76.5,
      participationRate: 91.2,
    });
  });

  // Professor Tips
  app.get('/api/professor/tips', (req: Request, res: Response) => {
    res.json(currentProfessorTips);
  });

  app.post('/api/professor/tips', (req: Request, res: Response) => {
    const { title, content, competency, area } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' });
    }
    const newTip = {
      id: 'tip-' + Date.now(),
      professorId: currentProfessor.id,
      professorName: `${currentProfessor.title} ${currentProfessor.name}`,
      title,
      content,
      competency: competency || 'Formação Geral',
      area: area || 'Formação Geral',
      createdAt: 'Agora',
      likesCount: 0,
      readsCount: 0,
    };
    currentProfessorTips.unshift(newTip);
    currentProfessor.publishedTipsCount += 1;
    res.status(201).json(newTip);
  });

  // Student Doubts & Answers
  app.get('/api/professor/doubts', (req: Request, res: Response) => {
    res.json(currentStudentDoubts);
  });

  app.post('/api/professor/doubts', (req: Request, res: Response) => {
    const { topic, questionTitle, doubtText, questionId } = req.body;
    const newDoubt = {
      id: 'doubt-' + Date.now(),
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      studentRa: currentStudent.ra,
      course: currentStudent.course,
      questionId,
      topic: topic || 'Dúvida Geral',
      questionTitle: questionTitle || 'Dúvida enviada pelo estudante',
      doubtText,
      createdAt: 'Agora',
      status: 'pending' as const,
    };
    currentStudentDoubts.unshift(newDoubt);
    res.status(201).json(newDoubt);
  });

  app.post('/api/professor/doubts/:id/answer', (req: Request, res: Response) => {
    const { id } = req.params;
    const { answerText, answer } = req.body;
    const doubt = currentStudentDoubts.find((d) => d.id === id);
    if (!doubt) {
      return res.status(404).json({ error: 'Dúvida não encontrada' });
    }
    doubt.status = 'answered';
    doubt.answer = {
      professorName: `${currentProfessor.title} ${currentProfessor.name}`,
      answerText: answerText || answer || 'Resposta registrada pelo docente.',
      answeredAt: 'Hoje',
    };
    currentProfessor.answeredDoubtsCount += 1;
    res.json(doubt);
  });

  // Mentor Challenges
  app.get(['/api/professor/challenges', '/api/professor/mentor-challenges'], (req: Request, res: Response) => {
    res.json(currentMentorChallenges);
  });

  app.post(['/api/professor/challenges', '/api/professor/mentor-challenges'], (req: Request, res: Response) => {
    const { title, description, competency, targetCount, targetQuestionCount, xpReward, rewardBadge, deadline } = req.body;
    const newChallenge = {
      id: 'm-chal-' + Date.now(),
      professorId: currentProfessor.id,
      professorName: `${currentProfessor.title} ${currentProfessor.name}`,
      title: title || 'Desafio do Mentor',
      description: description || 'Desafio criado pelo docente para reforço no ENADE.',
      competency: competency || 'Componente Específico',
      targetCount: Number(targetCount || targetQuestionCount) || 3,
      xpReward: Number(xpReward) || 300,
      rewardBadge: rewardBadge || 'Conquista Docente Mackenzie',
      deadline: deadline || 'Domingo às 23:59',
      enrolledStudents: 1,
      completionRate: 0,
      status: 'active' as const,
    };
    currentMentorChallenges.unshift(newChallenge);
    currentProfessor.activeChallenges += 1;
    res.status(201).json(newChallenge);
  });

  // Boss Battle
  app.get('/api/professor/boss-battle', (req: Request, res: Response) => {
    res.json(currentBossBattle);
  });

  app.post('/api/professor/boss-battle/damage', (req: Request, res: Response) => {
    const { damage = 150 } = req.body;
    const newHp = Math.max(0, currentBossBattle.currentHp - damage);
    currentBossBattle.currentHp = newHp;
    if (newHp === 0) {
      currentBossBattle.status = 'defeated';
    }
    res.json(currentBossBattle);
  });

  // Mentor Hour
  app.get('/api/professor/mentor-hour', (req: Request, res: Response) => {
    res.json(currentMentorHourSession);
  });

  app.post('/api/professor/mentor-hour/toggle', (req: Request, res: Response) => {
    currentMentorHourSession.status =
      currentMentorHourSession.status === 'live' ? 'scheduled' : 'live';
    res.json(currentMentorHourSession);
  });

  // Institutional Achievements (Social Sharing)
  app.get(['/api/professor/achievements', '/api/professor/institutional-achievements'], (req: Request, res: Response) => {
    res.json(currentInstitutionalAchievements);
  });

  // Question results history
  app.get('/api/results', (req: Request, res: Response) => {
    res.json(questionResultsHistory);
  });

  // Login simulation
  app.post('/api/login', (req: Request, res: Response) => {
    const { email, password, course, role = 'student' } = req.body;
    if (course) {
      currentStudent.course = course;
    }
    res.json({
      success: true,
      token: 'mack-mock-token-' + Date.now(),
      role,
      student: currentStudent,
      professor: currentProfessor,
    });
  });

  // Missions
  app.get('/api/missions', (req: Request, res: Response) => {
    res.json(currentMissions);
  });

  // Competencies
  app.get('/api/competencies', (req: Request, res: Response) => {
    res.json(currentCompetencies);
  });

  // Recommended Activity
  app.get('/api/recommended-activity', (req: Request, res: Response) => {
    res.json(recommendedActivity);
  });

  // --------------------------------------------------------------------------
  // QUESTIONS ENDPOINTS (ENADE GOVERNANCE & REVIEW WORKFLOW)
  // --------------------------------------------------------------------------

  // List questions with filtering and student governance
  app.get('/api/questions', async (req: Request, res: Response) => {
    try {
      const {
        course_id,
        discipline_id,
        difficulty,
        question_type,
        competency,
        enade_component,
        professor_id,
        active,
        review_status,
        role,
        includeDrafts,
      } = req.query;

      // Identify requestor role: if authenticated as student or role='STUDENT', enforce governance
      const currentUser = authService.getCurrentUser();
      const effectiveRole: MackEnadeRole =
        (role as MackEnadeRole) || (currentUser?.role ?? 'STUDENT');

      const filters: any = {
        role: effectiveRole,
      };

      if (course_id) filters.course_id = String(course_id);
      if (discipline_id) filters.discipline_id = String(discipline_id);
      if (difficulty) filters.difficulty = String(difficulty);
      if (question_type) filters.question_type = String(question_type);
      if (competency) filters.competency = String(competency);
      if (enade_component) filters.enade_component = String(enade_component);
      if (professor_id) filters.professor_id = String(professor_id);
      if (active !== undefined) filters.active = active === 'true';
      if (review_status) filters.review_status = String(review_status);

      // Fetch from Google Sheets question service
      const sheetQuestions = await questionService.getQuestions(filters);

      // Map to full client format
      const formattedSheetQuestions = sheetQuestions.map(formatQuestionForClient);

      // Also incorporate in-memory questions if relevant
      let localPool = currentQuestions;
      if (effectiveRole === 'STUDENT') {
        localPool = currentQuestions.filter((q) => q.status === 'published');
      } else if (includeDrafts !== 'true' && !review_status) {
        // Professor view without includeDrafts
      }

      // Combine Google Sheets questions first, then unique local questions
      const seenIds = new Set<string>();
      const combined: (Question & Record<string, any>)[] = [];

      for (const q of formattedSheetQuestions) {
        if (!seenIds.has(q.id)) {
          seenIds.add(q.id);
          combined.push(q);
        }
      }

      for (const q of localPool) {
        if (!seenIds.has(q.id)) {
          seenIds.add(q.id);
          combined.push(q);
        }
      }

      res.json(combined);
    } catch (err) {
      console.error('Error fetching questions:', err);
      res.json(currentQuestions.filter((q) => q.status === 'published'));
    }
  });

  // Get question by ID
  app.get('/api/questions/:id', async (req: Request, res: Response) => {
    try {
      const qId = req.params.id;
      const sheetQ = await questionService.getQuestionById(qId);
      if (sheetQ) {
        return res.json(formatQuestionForClient(sheetQ));
      }
      const localQ = currentQuestions.find((q) => q.id === qId);
      if (localQ) {
        return res.json(localQ);
      }
      res.status(404).json({ error: 'Questão não encontrada' });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar questão' });
    }
  });

  // Create question (Professor creation - defaults to DRAFT, active: false)
  app.post(['/api/questions', '/api/professor/questions'], async (req: Request, res: Response) => {
    try {
      const qData = req.body;
      const currentUser = authService.getCurrentUser();
      const professorId = currentUser?.id || currentProfessor.id || 'prof-upm';

      // Map alternatives if array provided
      let altA = qData.alternative_a || '';
      let altB = qData.alternative_b || '';
      let altC = qData.alternative_c || '';
      let altD = qData.alternative_d || '';
      let altE = qData.alternative_e || '';

      if (Array.isArray(qData.alternatives)) {
        for (const alt of qData.alternatives) {
          if (alt.id === 'A') altA = alt.text;
          if (alt.id === 'B') altB = alt.text;
          if (alt.id === 'C') altC = alt.text;
          if (alt.id === 'D') altD = alt.text;
          if (alt.id === 'E') altE = alt.text;
        }
      }

      const newSheetQ = await questionService.createProfessorQuestion(
        {
          course_id: qData.course_id || (qData.course?.includes('Civil') ? 'CIVIL' : 'PROD'),
          discipline_id: qData.discipline_id || 'PROD-01',
          enade_component: qData.enade_component || (qData.area?.includes('Geral') ? 'GENERAL' : 'SPECIFIC'),
          question_type: qData.question_type || 'MULTIPLE_CHOICE',
          difficulty: (qData.difficulty?.includes('Fácil')
            ? 'EASY'
            : qData.difficulty?.includes('Difícil')
            ? 'HARD'
            : 'MEDIUM') as any,
          topic: qData.topic || 'Conhecimento Específico',
          competency: qData.competency || 'Competência Técnica',
          statement: qData.statement || '',
          supporting_text: qData.supporting_text || qData.contextText || '',
          image_url: qData.image_url || '',
          alternative_a: altA,
          alternative_b: altB,
          alternative_c: altC,
          alternative_d: altD,
          alternative_e: altE,
          correct_answer: (qData.correctAnswer || qData.correct_answer || 'A').toUpperCase() as any,
          explanation: qData.explanation || '',
          common_error: qData.commonError || qData.common_error || '',
          tags: qData.tags || 'enade;mackenzie;piloto',
        },
        professorId
      );

      const clientQ = formatQuestionForClient(newSheetQ);
      currentQuestions.unshift(clientQ);
      res.status(201).json(clientQ);
    } catch (err: any) {
      console.error('Error creating question:', err);
      res.status(500).json({ error: 'Erro ao criar questão no banco Mack ENADE' });
    }
  });

  // Submit question for institutional review (review_status = PENDING_REVIEW)
  app.post(
    ['/api/questions/:id/submit-review', '/api/professor/questions/:id/submit-review'],
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const updated = await questionService.submitForReview(id);
        const formatted = formatQuestionForClient(updated);

        // Update in-memory if present
        const idx = currentQuestions.findIndex((q) => q.id === id);
        if (idx !== -1) {
          currentQuestions[idx].review_status = 'PENDING_REVIEW';
          currentQuestions[idx].status = 'draft';
        }

        res.json({
          success: true,
          message: 'Questão submetida para revisão institucional com sucesso.',
          question: formatted,
        });
      } catch (err: any) {
        res.status(404).json({ error: err.message || 'Erro ao submeter questão para revisão' });
      }
    }
  );

  // Approve question (review_status = APPROVED, active = true)
  app.post(
    ['/api/questions/:id/approve', '/api/professor/questions/:id/approve'],
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const currentUser = authService.getCurrentUser();
        const reviewer = currentUser?.name || 'Coordenação ENADE / NDE';
        const updated = await questionService.approveQuestion(id, reviewer);
        const formatted = formatQuestionForClient(updated);

        const idx = currentQuestions.findIndex((q) => q.id === id);
        if (idx !== -1) {
          currentQuestions[idx].review_status = 'APPROVED';
          currentQuestions[idx].active = true;
          currentQuestions[idx].status = 'published';
        }

        res.json({
          success: true,
          message: 'Questão aprovada e disponibilizada no banco ENADE com sucesso.',
          question: formatted,
        });
      } catch (err: any) {
        res.status(404).json({ error: err.message || 'Erro ao aprovar questão' });
      }
    }
  );

  // Update question
  app.patch(
    ['/api/questions/:id', '/api/professor/questions/:id'],
    async (req: Request, res: Response) => {
      const { id } = req.params;
      try {
        const updated = await questionService.updateQuestion(id, req.body);
        const formatted = formatQuestionForClient(updated);
        const index = currentQuestions.findIndex((q) => q.id === id);
        if (index !== -1) {
          currentQuestions[index] = { ...currentQuestions[index], ...formatted };
        }
        res.json(formatted);
      } catch {
        const index = currentQuestions.findIndex((q) => q.id === id);
        if (index !== -1) {
          currentQuestions[index] = { ...currentQuestions[index], ...req.body };
          return res.json(currentQuestions[index]);
        }
        res.status(404).json({ error: 'Questão não encontrada' });
      }
    }
  );

  // Delete question
  app.delete(
    ['/api/questions/:id', '/api/professor/questions/:id'],
    (req: Request, res: Response) => {
      const { id } = req.params;
      currentQuestions = currentQuestions.filter((q) => q.id !== id);
      res.json({ success: true, message: 'Questão excluída com sucesso.' });
    }
  );

  // AI Generation with Gemini (sets status to 'draft')
  app.post('/api/gemini/generate-question', async (req: Request, res: Response) => {
    const {
      topic = 'Estruturas de Dados e Algoritmos',
      area = 'Componente Específico',
      competency = 'Algoritmos e Estruturas de Dados',
      difficulty = 'Médio',
      course = 'Ciência da Computação',
      promptKeywords = '',
    } = req.body;

    const ai = getAi();
    if (ai) {
      try {
        const prompt = `Você é um professor titular da Universidade Presbiteriana Mackenzie e especialista em elaboração de itens para o Exame Nacional de Desempenho dos Estudantes (ENADE / INEP).
Elabore UMA questão inédita e rigorosa de Múltipla Escolha no formato oficial do ENADE com as seguintes especificações:
- Curso: ${course}
- Área: ${area}
- Competência: ${competency}
- Tópico: ${topic} ${promptKeywords ? `(Foco: ${promptKeywords})` : ''}
- Dificuldade: ${difficulty}

A questão deve conter:
1. Um enunciado contextualizado e técnico típico do ENADE (situação-problema ou asserções I e II).
2. Exatamente 5 alternativas identificadas pelas letras A, B, C, D, E.
3. Indicação clara da alternativa correta (apenas uma letra entre A, B, C, D, E).
4. Explicação detalhada e fundamentada do porquê a resposta correta é a válida.
5. Indicação do "Erro Comum" (o distrator mais atraente e o equívoco conceitual típico do estudante).

Responda ESTRITAMENTE em formato JSON com a seguinte estrutura:
{
  "statement": "texto do enunciado completo",
  "alternatives": [
    {"id": "A", "text": "texto da alternativa A"},
    {"id": "B", "text": "texto da alternativa B"},
    {"id": "C", "text": "texto da alternativa C"},
    {"id": "D", "text": "texto da alternativa D"},
    {"id": "E", "text": "texto da alternativa E"}
  ],
  "correctAnswer": "A",
  "explanation": "explicação da solução",
  "commonError": "erro comum do aluno",
  "keyTakeaway": "dica pedagógica central para o ENADE"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);

        const sheetAiQ = await questionService.createAiQuestion({
          course_id: course.includes('Civil') ? 'CIVIL' : 'PROD',
          discipline_id: 'PROD-01',
          enade_component: area.includes('Geral') ? 'GENERAL' : 'SPECIFIC',
          topic,
          competency,
          difficulty: (difficulty.includes('Fácil')
            ? 'EASY'
            : difficulty.includes('Difícil')
            ? 'HARD'
            : 'MEDIUM') as any,
          statement: parsed.statement,
          alternative_a: parsed.alternatives?.[0]?.text || '',
          alternative_b: parsed.alternatives?.[1]?.text || '',
          alternative_c: parsed.alternatives?.[2]?.text || '',
          alternative_d: parsed.alternatives?.[3]?.text || '',
          alternative_e: parsed.alternatives?.[4]?.text || '',
          correct_answer: (parsed.correctAnswer || 'A').toUpperCase() as any,
          explanation: parsed.explanation,
          common_error: parsed.commonError,
        });

        const formatted = formatQuestionForClient(sheetAiQ);
        currentQuestions.unshift(formatted);
        return res.status(201).json(formatted);
      } catch (err: any) {
        console.error('Gemini generation error, falling back to pedagogical generator:', err);
      }
    }

    // Intelligent pedagogical fallback if API key not set or API error
    const fallbackTemplates: Record<string, Partial<Question>> = {
      'Algoritmos e Estruturas de Dados': {
        statement: `Considere um sistema distribuído de indexação em larga escala que precisa manter um dicionário de chaves dinâmicas com suporte a inserção, busca e deleção eficientes. A equipe de engenharia analisa a substituição de uma Árvore AVL por uma Árvore Rubro-Negra (Red-Black Tree).

Considerando as propriedades fundamentais das Árvores Rubro-Negras segundo a literatura clássica de Estruturas de Dados (Cormen et al.), assinale a opção correta:`,
        alternatives: [
          { id: 'A', text: 'O caminho mais longo da raiz até qualquer folha nula não é maior do que duas vezes o comprimento do caminho mais curto, garantindo altura O(log n).' },
          { id: 'B', text: 'A altura máxima de uma árvore rubro-negra com n nós internos é estritamente inferior a log₂(n + 1), sendo mais balanceada que uma AVL.' },
          { id: 'C', text: 'Cada nó vermelho deve possuir obrigatoriamente dois filhos também vermelhos para preservar a propriedade da altura-preta.' },
          { id: 'D', text: 'As operações de balanceamento exigem O(log n) rotações simples e duplas após cada remoção, tornando-a inviável para bancos relacionais.' },
          { id: 'E', text: 'A raiz pode ser alternadamente preta ou vermelha de acordo com a paridade do número total de nós inseridos.' },
        ],
        correctAnswer: 'A',
        explanation: `Pela definição formal das Árvores Rubro-Negras (Propriedade 4 e 5), nenhum caminho contém dois nós vermelhos consecutivos e todo caminho simples da raiz a uma folha possui o mesmo número de nós pretos (black-height). Isso garante que o caminho mais longo seja no máximo 2 * (caminho mais curto), assegurando operações assintóticas O(log n).`,
        commonError: 'Achar que a árvore rubro-negra é mais rigidamente balanceada que a AVL (na verdade a AVL é mais rígida, com diferença de altura de no máximo 1).',
        keyTakeaway: 'Em questões do ENADE sobre balanceamento de árvores, diferencie rotações de nós pretos vs vermelhos.',
      },
      'Bancos de Dados e Consistência de Dados': {
        statement: `Em um sistema de pagamento eletrônico de alta disponibilidade, duas transações concorrentes T1 e T2 tentam debitar o saldo de uma conta bancária compartilhada. Se o SGBD permitir que T2 leia o saldo atualizado por T1 antes que T1 execute o COMMIT ou ROLLBACK, pode ocorrer uma inconsistência grave caso T1 seja abortada.

A anomalia descrita e o nível de isolamento mínimo ANSI SQL capaz de impedi-la são, respectivamente:`,
        alternatives: [
          { id: 'A', text: 'Dirty Read (Leitura Suja) e READ COMMITTED.' },
          { id: 'B', text: 'Non-Repeatable Read e READ UNCOMMITTED.' },
          { id: 'C', text: 'Phantom Read e REPEATABLE READ.' },
          { id: 'D', text: 'Lost Update e SNAPSHOT ISOLATION.' },
          { id: 'E', text: 'Write Skew e SERIALIZABLE.' },
        ],
        correctAnswer: 'A',
        explanation: `Uma leitura suja (Dirty Read) ocorre quando uma transação lê dados não confirmados (uncommitted) de outra transação. O nível READ COMMITTED impede leituras sujas, permitindo apenas a leitura de transações já confirmadas.`,
        commonError: 'Confundir Leitura Suja com Leitura Não-Repetível (que ocorre quando uma mesma consulta em T1 retorna valores diferentes porque T2 comitou no intervalo).',
        keyTakeaway: 'Tabela de fenômenos ANSI SQL: READ UNCOMMITTED permite Dirty Read; READ COMMITTED elimina Dirty Read.',
      },
    };

    const template = fallbackTemplates[competency] || {
      statement: `No contexto da governança de Tecnologia da Informação e avaliação institucional do ENADE no curso de ${course}, avalie os impactos da competência "${competency}" no ciclo de vida de soluções escaláveis. Considerando as diretrizes do INEP, assinale a opção que reflete as melhores práticas aplicadas:`,
      alternatives: [
        { id: 'A', text: 'Adoção de padrões arquiteturais consolidados com métricas contínuas de qualidade e aderência aos requisitos não-funcionais de desempenho e conformidade legal.' },
        { id: 'B', text: 'Isolamento estrito dos desenvolvedores em relação às demandas de governança para acelerar entregas sem auditoria.' },
        { id: 'C', text: 'Substituição integral de testes automatizados por inspeções manuais nos estágios finais de produção.' },
        { id: 'D', text: 'Centralização de todas as decisões em um único monólito sem desacoplamento de responsabilidades.' },
        { id: 'E', text: 'Eliminação da documentação de requisitos para priorizar exclusivamente código compilável.' },
      ],
      correctAnswer: 'A',
      explanation: 'A resposta A sintetiza as recomendações das diretrizes curriculares nacionais e do ENADE, equilibrando arquitetura de software, conformidade técnica e métricas contínuas.',
      commonError: 'Desconsiderar a importância de requisitos não-funcionais e conformidade nas avaliações do ENADE.',
      keyTakeaway: 'O ENADE valoriza a visão holística entre engenharia de software e governança corporativa.',
    };

    const aiQuestion: Question = {
      id: 'q-ai-' + Date.now(),
      course,
      area,
      competency,
      topic: topic || 'Tópico de Avaliação',
      difficulty: difficulty as any,
      type: 'Múltipla Escolha',
      statement: template.statement!,
      alternatives: template.alternatives!,
      correctAnswer: template.correctAnswer as any,
      explanation: template.explanation!,
      commonError: template.commonError!,
      keyTakeaway: template.keyTakeaway,
      source: 'Mackenzie AI / Curadoria Docente ENADE',
      year: 2024,
      status: 'draft', // ALWAYS draft until professor approves
      authorRole: 'ai',
      authorName: 'Gemini AI Assistant',
      createdAt: new Date().toISOString(),
      analytics: {
        attempts: 0,
        correctCount: 0,
        accuracyRate: 0,
        averageTimeSeconds: 0,
        distractorSelections: { A: 0, B: 0, C: 0, D: 0, E: 0 },
      },
    };

    currentQuestions.unshift(aiQuestion);
    res.status(201).json(aiQuestion);
  });

  // Generate question from uploaded educational material
  app.post('/api/gemini/generate-from-material', async (req: Request, res: Response) => {
    const { materialText, fileName, competency, area, course = 'Ciência da Computação' } = req.body;

    if (!materialText || materialText.trim().length < 20) {
      return res.status(400).json({ error: 'Conteúdo educacional insuficiente para gerar questão.' });
    }

    const ai = getAi();
    if (ai) {
      try {
        const prompt = `Você é um docente da Universidade Presbiteriana Mackenzie. Com base no material didático institucional transcrito a seguir (extraído de "${fileName || 'Material de Aula'}"):

--- INÍCIO DO MATERIAL DIDÁTICO ---
${materialText.slice(0, 3000)}
--- FIM DO MATERIAL DIDÁTICO ---

Elabore UMA questão técnica rigorosa no padrão oficial do ENADE/INEP que avalie se o aluno compreendeu os conceitos essenciais do material fornecido.
Estruture a resposta em formato JSON:
{
  "statement": "enunciado com contextualização técnica e pergunta",
  "alternatives": [
    {"id": "A", "text": "alternativa A"},
    {"id": "B", "text": "alternativa B"},
    {"id": "C", "text": "alternativa C"},
    {"id": "D", "text": "alternativa D"},
    {"id": "E", "text": "alternativa E"}
  ],
  "correctAnswer": "A",
  "explanation": "explicação da solução",
  "commonError": "erro comum",
  "topic": "tópico principal abordado",
  "competency": "${competency || 'Engenharia de Software e Métodos Ágeis'}"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);

        const aiQuestion: Question = {
          id: 'q-mat-' + Date.now(),
          course,
          area: area || 'Componente Específico',
          competency: parsed.competency || competency || 'Componente Específico',
          topic: parsed.topic || `Conteúdo de ${fileName || 'Material Didático'}`,
          difficulty: 'Médio',
          type: 'Múltipla Escolha',
          statement: parsed.statement,
          alternatives: parsed.alternatives,
          correctAnswer: parsed.correctAnswer,
          explanation: parsed.explanation,
          commonError: parsed.commonError,
          source: `Material Didático (${fileName || 'Arquivo Upload'}) / Curadoria UPM`,
          year: 2024,
          status: 'draft', // ALWAYS draft
          authorRole: 'ai',
          authorName: `Material Didático (${fileName})`,
          createdAt: new Date().toISOString(),
          analytics: {
            attempts: 0,
            correctCount: 0,
            accuracyRate: 0,
            averageTimeSeconds: 0,
            distractorSelections: { A: 0, B: 0, C: 0, D: 0, E: 0 },
          },
        };

        currentQuestions.unshift(aiQuestion);
        return res.status(201).json(aiQuestion);
      } catch (err) {
        console.error('Gemini material generation error, using fallback:', err);
      }
    }

    // Material fallback
    const snippet = materialText.slice(0, 150).replace(/[\n\r]+/g, ' ');
    const fallbackQuestion: Question = {
      id: 'q-mat-' + Date.now(),
      course,
      area: area || 'Componente Específico',
      competency: competency || 'Engenharia de Software e Métodos Ágeis',
      topic: `Síntese de Conteúdo: ${fileName || 'Material de Aula'}`,
      difficulty: 'Médio',
      type: 'Múltipla Escolha',
      statement: `A partir do material instrucional selecionado ("${snippet}..."), o professor mentor propõe uma reflexão crítica sobre a consolidação prática dos conceitos abordados. Considerando as aplicações no contexto do ENADE, assinale a proposição correta:`,
      alternatives: [
        { id: 'A', text: 'A correta aplicação dos conceitos expostos no material permite garantir rastreabilidade, redução de retrabalho e conformidade com as diretrizes do curso.' },
        { id: 'B', text: 'Os tópicos apresentados são de caráter exclusivamente teórico sem aplicabilidade na prática de projetos reais de software.' },
        { id: 'C', text: 'A metodologia dispensa completamente a análise prévia de requisitos funcionais.' },
        { id: 'D', text: 'Recomenda-se a supressão de padrões de projeto quando a equipe atua sob prazos reduzidos.' },
        { id: 'E', text: 'O desempenho do sistema independe da escolha correta das estruturas de dados e arquitetura.' },
      ],
      correctAnswer: 'A',
      explanation: 'A alternativa A sintetiza os princípios pedagógicos do material didático institucional fornecido pelo professor.',
      commonError: 'Desconsiderar o impacto direto da fundamentação teórica nas decisões arquiteturais.',
      source: `Material Didático (${fileName || 'Documento Upload'}) / UPM`,
      year: 2024,
      status: 'draft',
      authorRole: 'ai',
      authorName: `Material Didático (${fileName || 'Upload'})`,
      createdAt: new Date().toISOString(),
      analytics: {
        attempts: 0,
        correctCount: 0,
        accuracyRate: 0,
        averageTimeSeconds: 0,
        distractorSelections: { A: 0, B: 0, C: 0, D: 0, E: 0 },
      },
    };

    currentQuestions.unshift(fallbackQuestion);
    res.status(201).json(fallbackQuestion);
  });

  // Submit Answer
  app.post('/api/answer-question', (req: Request, res: Response) => {
    const { questionId, selectedAlternative } = req.body;
    const question = currentQuestions.find((q) => q.id === questionId);

    if (!question) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }

    const isCorrect = question.correctAnswer === selectedAlternative;
    const isMentorHourLive = currentMentorHourSession.status === 'live';
    const multiplier = isMentorHourLive ? currentMentorHourSession.xpMultiplier : 1;
    const baseEarnedXp = isCorrect ? 50 : 15;
    const earnedXp = Math.round(baseEarnedXp * multiplier);

    // Update Boss Battle if correct
    if (isCorrect) {
      currentBossBattle.currentHp = Math.max(
        0,
        currentBossBattle.currentHp - currentBossBattle.damagePerCorrectAnswer
      );
      if (currentBossBattle.currentHp === 0) {
        currentBossBattle.status = 'defeated';
      }
    }

    // Update question analytics
    if (question.analytics) {
      question.analytics.attempts += 1;
      if (isCorrect) question.analytics.correctCount += 1;
      question.analytics.accuracyRate = +(
        (question.analytics.correctCount / question.analytics.attempts) *
        100
      ).toFixed(1);
      if (
        selectedAlternative &&
        question.analytics.distractorSelections &&
        question.analytics.distractorSelections[selectedAlternative as 'A' | 'B' | 'C' | 'D' | 'E'] !== undefined
      ) {
        question.analytics.distractorSelections[selectedAlternative as 'A' | 'B' | 'C' | 'D' | 'E'] += 1;
      }
    }

    const newAnswered = currentStudent.questionsAnswered + 1;
    const newCorrect = isCorrect ? currentStudent.correctAnswers + 1 : currentStudent.correctAnswers;
    const accuracy = newCorrect / newAnswered;
    const calculatedScore = +(1.0 + accuracy * 4.0).toFixed(1);
    const calculatedPrep = Math.min(100, Math.round((newAnswered / 30) * 85));

    currentStudent = {
      ...currentStudent,
      xp: currentStudent.xp + earnedXp,
      questionsAnswered: newAnswered,
      correctAnswers: newCorrect,
      estimatedScore: calculatedScore,
      enadePreparationPercentage: Math.max(currentStudent.enadePreparationPercentage, calculatedPrep),
    };

    // Recalculate level if XP exceeds threshold
    if (currentStudent.xp >= currentStudent.nextLevelXp) {
      currentStudent.level += 1;
      currentStudent.nextLevelXp += 1000;
    }

    // Update competency performance
    currentCompetencies = currentCompetencies.map((comp) => {
      if (comp.name === question.competency || comp.area === question.area) {
        const updatedResolved = comp.questionsResolved + 1;
        const adjustment = isCorrect ? 4 : -2;
        const newPerformance = Math.min(98, Math.max(25, comp.performancePercentage + adjustment));
        return {
          ...comp,
          questionsResolved: updatedResolved,
          performancePercentage: newPerformance,
        };
      }
      return comp;
    });

    // Record result history
    const resultRecord = {
      id: 'res-' + Date.now(),
      questionId,
      course: question.course,
      area: question.area,
      competency: question.competency,
      topic: question.topic,
      selectedAlternative,
      correctAnswer: question.correctAnswer,
      isCorrect,
      earnedXp,
      timestamp: new Date().toISOString(),
    };
    questionResultsHistory.unshift(resultRecord);

    res.json({
      success: true,
      isCorrect,
      earnedXp,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      commonError: question.commonError,
      keyTakeaway: question.keyTakeaway,
      student: currentStudent,
      competencies: currentCompetencies,
      result: resultRecord,
    });
  });

  // Achievements
  app.get('/api/achievements', (req: Request, res: Response) => {
    res.json(currentAchievements);
  });

  // Simulation exams
  app.get('/api/simulation-exams', (req: Request, res: Response) => {
    res.json(simulationExams);
  });

  // ----------------------------------------------------
  // REWARDS CENTER & REAL-WORLD PRIZES API
  // ----------------------------------------------------

  /**
   * GET /api/prizes
   * Dynamically loads real prize information from the 'prizes' worksheet in Google Sheets database.
   * Query filters:
   * - course_id: 'PROD', 'CIVIL', 'ALL'
   * - status: 'ACTIVE', 'DRAFT', etc.
   * - active: 'true', 'false', 'ALL'
   * - refresh: 'true' (force bypass cache)
   * - include_dates: 'true'/'false'
   */
  app.get('/api/prizes', async (req: Request, res: Response) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const allPrizes = await googleSheetsService.getPrizes(forceRefresh);

      const { course_id, status, active, include_dates } = req.query;

      let filtered = [...allPrizes];

      // 1. Filter by active boolean
      if (active !== undefined && active !== 'ALL') {
        const wantActive =
          active === 'true' ||
          active === 'TRUE' ||
          active === '1' ||
          active === 'VERDADEIRO' ||
          active === 'verdadeiro';
        filtered = filtered.filter((p) => p.active === wantActive);
      }

      // 2. Filter by status (e.g. ACTIVE, DRAFT, ARCHIVED)
      if (status !== undefined && status !== 'ALL') {
        const wantStatus = String(status).trim().toUpperCase();
        filtered = filtered.filter((p) => (p.status || '').toUpperCase() === wantStatus);
      }

      // 3. Filter by course_id:
      // If course_id = ALL, show to both Civil Engineering and Production Engineering students.
      // If course_id = CIVIL, show only to Civil Engineering students.
      // If course_id = PROD, show only to Production Engineering students.
      if (course_id && course_id !== 'ALL') {
        const targetCourse = String(course_id).trim().toUpperCase();
        filtered = filtered.filter((p) => {
          const prizeCourse = (p.course_id || 'ALL').trim().toUpperCase();
          if (prizeCourse === 'ALL' || prizeCourse === 'BOTH' || prizeCourse === '') {
            return true;
          }
          return prizeCourse === targetCourse;
        });
      }

      // 4. Filter by date window (start_date / end_date)
      // "and the current date falls between start_date and end_date, when these dates are provided."
      if (include_dates !== 'false') {
        const now = new Date();
        filtered = filtered.filter((p) => {
          if (p.start_date && p.start_date.trim()) {
            const start = parseFlexibleDate(p.start_date);
            if (start && now < start) return false;
          }
          if (p.end_date && p.end_date.trim()) {
            const end = parseFlexibleDate(p.end_date, true);
            if (end && now > end) return false;
          }
          return true;
        });
      }

      // 5. Order cards by display_order
      filtered.sort((a, b) => (Number(a.display_order) || 999) - (Number(b.display_order) || 999));

      res.json(filtered);
    } catch (err: any) {
      console.error('[API /api/prizes] Erro ao buscar prêmios do Google Sheets:', err);
      res.status(500).json({ error: 'Erro ao carregar prêmios', message: err.message });
    }
  });

  /**
   * POST /api/prizes/:id/toggle-active
   * Coordinator / Admin utility to toggle active status or publish a prize for the pilot
   */
  app.post('/api/prizes/:id/toggle-active', async (req: Request, res: Response) => {
    try {
      const prizeId = req.params.id;
      const all = await googleSheetsService.getPrizes();
      const existing = all.find((p) => p.prize_id === prizeId);
      if (!existing) {
        return res.status(404).json({ error: 'Prêmio não encontrado.' });
      }

      const nextActive = req.body.active !== undefined ? Boolean(req.body.active) : !existing.active;
      const nextStatus = nextActive ? 'ACTIVE' : 'DRAFT';
      const updated = googleSheetsService.updatePrize(prizeId, {
        active: nextActive,
        status: nextStatus,
      });

      res.json({
        success: true,
        message: `Status do prêmio ${prizeId} alterado com sucesso.`,
        prize: { ...existing, ...updated },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * PUT /api/prizes/:id
   * Update prize details (in-memory overlay for pilot testing)
   */
  app.put('/api/prizes/:id', async (req: Request, res: Response) => {
    try {
      const prizeId = req.params.id;
      const updated = googleSheetsService.updatePrize(prizeId, req.body);
      res.json({ success: true, prize: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all reward campaigns
  app.get('/api/rewards/campaigns', (req: Request, res: Response) => {
    res.json(currentRewardCampaigns);
  });

  // Create a new reward campaign (Administrator / Coordinator / Professor)
  app.post('/api/rewards/campaigns', (req: Request, res: Response) => {
    const {
      title,
      category,
      categoryLabel,
      description,
      imageUrl,
      sponsorOrSource,
      totalQuantity,
      weekLabel,
      startDate,
      endDate,
      criteria,
      deliveryDetails,
      isProfessorMentorReward,
      professorMentorName,
      mentorChallengeId,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Título e descrição da premiação são obrigatórios.' });
    }

    const newCampaign: RewardCampaign = {
      id: 'camp-' + Date.now(),
      title,
      category: category || 'enade-champion',
      categoryLabel: categoryLabel || 'Campeão ENADE',
      description,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
      sponsorOrSource: sponsorOrSource || 'Faculdade de Computação e Informática (FCI) Mackenzie',
      totalQuantity: Number(totalQuantity) || 3,
      awardedQuantity: 0,
      remainingQuantity: Number(totalQuantity) || 3,
      weekLabel: weekLabel || 'Semana ' + (Math.floor(Date.now() / (7 * 24 * 3600 * 1000)) % 52) + ' • 2026',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'active',
      criteria: {
        minQuestions: Number(criteria?.minQuestions) || 30,
        minActiveDays: Number(criteria?.minActiveDays) || 4,
        minMentorChallenges: Number(criteria?.minMentorChallenges) || 1,
        minInstitutionalMissions: Number(criteria?.minInstitutionalMissions) || 2,
        minAccuracyPercentage: Number(criteria?.minAccuracyPercentage) || 60,
        minCompetenciesExplored: Number(criteria?.minCompetenciesExplored) || 3,
        maxRepeatedQuestionsLimit: Number(criteria?.maxRepeatedQuestionsLimit) || 2,
        minAverageTimeSeconds: Number(criteria?.minAverageTimeSeconds) || 30,
        enforceAntiAbuseValidation: criteria?.enforceAntiAbuseValidation !== false,
      },
      deliveryDetails: deliveryDetails || {
        pickupLocation: 'Secretaria da FCI - Prédio 32, Sala 204',
        instructions: 'Apresentar documento de identificação e código do voucher gerado.',
        voucherExpirationDays: 14,
      },
      isProfessorMentorReward: Boolean(isProfessorMentorReward),
      professorMentorName: professorMentorName || (isProfessorMentorReward ? currentProfessor.name : undefined),
      mentorChallengeId: mentorChallengeId || undefined,
    };

    currentRewardCampaigns.unshift(newCampaign);
    res.status(201).json(newCampaign);
  });

  // Update a reward campaign
  app.put('/api/rewards/campaigns/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = currentRewardCampaigns.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Campanha não encontrada.' });
    }

    currentRewardCampaigns[index] = {
      ...currentRewardCampaigns[index],
      ...req.body,
    };

    res.json(currentRewardCampaigns[index]);
  });

  // Delete a reward campaign
  app.delete('/api/rewards/campaigns/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    currentRewardCampaigns = currentRewardCampaigns.filter((c) => c.id !== id);
    res.json({ success: true, message: 'Campanha removida com sucesso.' });
  });

  // Get weekly winners
  app.get('/api/rewards/winners', (req: Request, res: Response) => {
    res.json(currentRewardWinners);
  });

  // Get collective class rewards
  app.get('/api/rewards/collective', (req: Request, res: Response) => {
    res.json(currentCollectiveClassRewards);
  });

  // Update collective class reward (e.g. contribution progress)
  app.put('/api/rewards/collective/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = currentCollectiveClassRewards.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Meta coletiva não encontrada.' });
    }

    currentCollectiveClassRewards[index] = {
      ...currentCollectiveClassRewards[index],
      ...req.body,
    };

    res.json(currentCollectiveClassRewards[index]);
  });

  // Draw or award winners for a campaign
  app.post('/api/rewards/draw-winners', (req: Request, res: Response) => {
    const { campaignId, studentIds } = req.body;
    const campaign = currentRewardCampaigns.find((c) => c.id === campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada.' });
    }

    // Default to awarding the student or provided studentIds
    const awardedStudents = (studentIds && studentIds.length > 0)
      ? currentClassStudents.filter((s) => studentIds.includes(s.id))
      : [currentClassStudents[0] || { name: currentStudent.name, ra: currentStudent.ra, course: currentStudent.course }];

    const newWinners: RewardWinner[] = awardedStudents.map((st, i) => ({
      id: 'win-' + Date.now() + '-' + i,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      category: campaign.category,
      prizeTitle: campaign.title,
      studentName: st.name,
      studentRaMasked: st.ra.slice(0, 3) + '***' + st.ra.slice(-2),
      studentCourse: currentStudent.course,
      awardedAt: new Date().toLocaleDateString('pt-BR'),
      weekLabel: campaign.weekLabel,
      avatarInitials: st.name.split(' ').map((p: string) => p[0]).slice(0, 2).join(''),
      voucherCode: `MACK-ENADE-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      claimed: false,
    }));

    currentRewardWinners = [...newWinners, ...currentRewardWinners];
    campaign.awardedQuantity = Math.min(campaign.totalQuantity, campaign.awardedQuantity + newWinners.length);
    campaign.remainingQuantity = Math.max(0, campaign.totalQuantity - campaign.awardedQuantity);

    res.json({
      success: true,
      winners: newWinners,
      campaign,
    });
  });

  // Claim voucher
  app.post('/api/rewards/claim-voucher', (req: Request, res: Response) => {
    const { voucherCode } = req.body;
    const winner = currentRewardWinners.find((w) => w.voucherCode === voucherCode);
    if (winner) {
      winner.claimed = true;
    }
    res.json({ success: true, winner });
  });


  // Catch-all 404 for unhandled API endpoints to prevent falling through to Vite HTML
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ error: `Rota da API não encontrada: ${req.method} ${req.path}` });
  });

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mack ENADE server rodando em http://localhost:${PORT}`);
  });
}

startServer();
