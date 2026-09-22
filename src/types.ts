export type AreaType = 'Formação Geral' | 'Componente Específico';

export interface Student {
  id: string;
  name: string;
  ra: string;
  email: string;
  course: string;
  campus: string;
  semester: number;
  xp: number;
  nextLevelXp: number;
  level: number;
  levelTitle: string;
  studyStreak: number;
  streakDays: boolean[]; // last 7 days mon-sun
  enadePreparationPercentage: number;
  questionsAnswered: number;
  correctAnswers: number;
  simulatedExamsCompleted: number;
  estimatedScore: number; // 1 to 5 (Conceito ENADE)
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: AreaType | 'Simulado' | 'Revisão';
  xpReward: number;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  deadline: string;
  iconName: 'target' | 'book' | 'zap' | 'check' | 'award';
  questionIds?: string[];
}

export interface Competency {
  id: string;
  name: string;
  area: AreaType;
  performancePercentage: number;
  questionsResolved: number;
  totalQuestions: number;
  status: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';
  description: string;
}

export interface Alternative {
  id: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
}

export interface Question {
  id: string;
  course: string;
  area: AreaType | string;
  competency: string;
  topic: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  type: 'Múltipla Escolha' | 'Discursiva' | string;
  statement: string;
  alternatives: Alternative[];
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
  commonError: string;
  source: string;
  year: number;

  // Additional display / legacy fields
  code?: string;
  component?: AreaType;
  prompt?: string;
  contextText?: string;
  highlightNote?: string;
  distractorExplanations?: Record<string, string>;
  keyTakeaway?: string;

  // Professor & workflow fields
  status?: 'draft' | 'published';
  review_status?: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | string;
  active?: boolean;
  question_id?: string;
  discipline_id?: string;
  course_id?: string;
  professor_id?: string;
  creation_method?: 'MANUAL' | 'AI' | 'BULK_IMPORT' | string;
  reviewed_by?: string;
  authorRole?: 'professor' | 'system' | 'ai';
  authorName?: string;
  createdAt?: string;
  analytics?: QuestionAnalytics;
}

export interface QuestionAnalytics {
  attempts: number;
  correctCount: number;
  accuracyRate: number;
  averageTimeSeconds: number;
  distractorSelections: Record<'A' | 'B' | 'C' | 'D' | 'E', number>;
}

export type MackEnadeRole = 'STUDENT' | 'PROFESSOR' | 'COORDINATOR' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'INACTIVE';

export interface InternalUserProfile {
  id: string;
  entraUserId?: string;
  institutionalEmail: string;
  name: string;
  role: MackEnadeRole;
  course: string;
  class: string;
  status: UserStatus;
  avatarUrl?: string;
  department?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export type UserRole = 'student' | 'professor' | 'coordinator' | 'admin';

export interface Professor {
  id: string;
  name: string;
  title: string;
  email: string;
  department: string;
  course: string;
  courses?: string[];
  campus: string;
  totalStudents: number;
  activeChallenges: number;
  answeredDoubtsCount: number;
  publishedTipsCount: number;
}

export interface ProfessorTip {
  id: string;
  professorId: string;
  professorName: string;
  authorName?: string;
  title: string;
  content: string;
  competency: string;
  area: AreaType;
  createdAt: string;
  likesCount: number;
  likes?: number;
  readsCount: number;
  readTimeMinutes?: number;
}

export interface StudentDoubt {
  id: string;
  studentId: string;
  studentName: string;
  studentRa: string;
  course: string;
  questionId?: string;
  topic: string;
  questionTitle: string;
  questionTopic?: string;
  competency?: string;
  doubtText: string;
  createdAt: string;
  status: 'pending' | 'answered';
  professorAnswer?: string;
  answeredBy?: string;
  answer?: {
    professorName: string;
    answerText: string;
    answeredAt: string;
  };
}

export interface MentorChallenge {
  id: string;
  professorId: string;
  professorName: string;
  title: string;
  description: string;
  competency: string;
  targetCount: number;
  targetQuestionCount?: number;
  xpReward: number;
  rewardBadge: string;
  badgeReward?: string;
  deadline: string;
  deadlineDays?: number;
  enrolledStudents: number;
  participantsCount?: number;
  completionRate: number;
  completedCount?: number;
  status: 'active' | 'completed';
}

export interface BossBattle {
  id: string;
  title: string;
  bossName: string;
  bossTitle: string;
  description: string;
  maxHp: number;
  currentHp: number;
  damagePerCorrectAnswer: number;
  participatingStudents: number;
  participantsCount?: number;
  rewardXp: number;
  xpReward?: number;
  course?: string;
  rewardBadge: string;
  endsIn: string;
  status: 'active' | 'defeated';
}

export interface MentorHourSession {
  id: string;
  title: string;
  professorName: string;
  topic: string;
  scheduledDate: string;
  date?: string;
  time: string;
  xpMultiplier: number;
  status: 'live' | 'scheduled' | 'ended';
  roomLink: string;
  meetingUrl?: string;
  platform?: string;
  activeParticipants: number;
}

export interface ClassStudentProgress {
  id: string;
  studentId?: string;
  name: string;
  ra: string;
  avatarInitials: string;
  level: number;
  xp: number;
  questionsAnswered: number;
  accuracy: number;
  accuracyRate?: number;
  streak: number;
  estimatedScore: number;
  status: 'Destaque' | 'No Ritmo' | 'Precisa de Apoio' | 'destaque' | 'no-ritmo' | 'atencao';
  weakestCompetency: string;
}

export type CompetencyPerformance = Competency;

export interface InstitutionalAchievement {
  id: string;
  title: string;
  category: 'Turma ENADE' | 'Desafio Coletivo' | 'Docente Destaque' | 'Conceito Máximo';
  metric: string;
  metricValue: string;
  description: string;
  date: string;
  professorName: string;
  course: string;
  suggestedCaption: string;
}

export interface QuestionResult {
  id: string;
  questionId: string;
  selectedAlternative: 'A' | 'B' | 'C' | 'D' | 'E';
  isCorrect: boolean;
  earnedXp: number;
  timestamp: string;
  competency: string;
  topic: string;
  area: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  currentProgress: number;
  maxProgress: number;
  category: 'streak' | 'questions' | 'simulated' | 'competency';
  xpReward: number;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
}

export interface SimulationExam {
  id: string;
  title: string;
  description: string;
  yearReference: string;
  durationMinutes: number;
  questionCount: number;
  generalQuestionsCount: number;
  specificQuestionsCount: number;
  xpReward: number;
}

export interface RecommendedActivity {
  id: string;
  title: string;
  reason: string;
  estimatedMinutes: number;
  xpReward: number;
  actionScreen: 'today-mission' | 'question' | 'simulation';
  targetQuestionId?: string;
}

export type ScreenType =
  | 'login'
  | 'dashboard'
  | 'today-mission'
  | 'rewards'
  | 'question'
  | 'feedback'
  | 'progress'
  | 'achievements'
  | 'simulation'
  | 'professor-dashboard'
  | 'professor-questions'
  | 'professor-mentorship'
  | 'professor-class-performance'
  | 'professor-challenges'
  | 'professor-rewards'
  | 'professor-social-share'
  | 'management-dashboard';

// ----------------------------------------------------
// REWARDS CENTER & REAL-WORLD PRIZES TYPES
// ----------------------------------------------------

export type RewardCategory =
  | 'enade-champion'     // Campeão ENADE
  | 'biggest-evolution'  // Maior Evolução
  | 'consistency-award'  // Prêmio Constância
  | 'mission-master'     // Mestre das Missões
  | 'collective-class'   // Recompensa Coletiva da Turma
  | 'mentor-special';    // Desafio com Prêmio do Mentor

export interface RewardEligibilityCriteria {
  minQuestions: number;
  minActiveDays: number;
  minMentorChallenges: number;
  minInstitutionalMissions: number;
  minAccuracyPercentage?: number;
  minCompetenciesExplored?: number;
  maxRepeatedQuestionsLimit?: number;
  minAverageTimeSeconds?: number;
  enforceAntiAbuseValidation: boolean;
}

export interface RewardWinner {
  id: string;
  campaignId: string;
  campaignTitle: string;
  category: RewardCategory;
  studentName: string;
  studentRaMasked: string;
  studentCourse: string;
  awardedAt: string;
  weekLabel: string;
  avatarInitials: string;
  voucherCode: string;
  claimed: boolean;
  prizeTitle: string;
}

export interface RewardCampaign {
  id: string;
  title: string;
  category: RewardCategory;
  categoryLabel: string;
  description: string;
  imageUrl: string;
  sponsorOrSource: string;
  totalQuantity: number;
  awardedQuantity: number;
  remainingQuantity: number;
  weekLabel: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'evaluating' | 'concluded';
  criteria: RewardEligibilityCriteria;
  deliveryDetails?: {
    pickupLocation: string;
    instructions: string;
    voucherExpirationDays: number;
  };
  winners?: RewardWinner[];
  isProfessorMentorReward?: boolean;
  professorMentorName?: string;
  mentorChallengeId?: string;
}

export interface AntiAbuseAuditReport {
  passed: boolean;
  riskLevel: 'clean' | 'low-risk' | 'flagged';
  validQuestionsCount: number;
  rejectedSpamCount: number;
  averageTimeSeconds: number;
  repeatedQuestionsDetected: number;
  distinctCompetenciesExplored: number;
  message: string;
}

export interface StudentRewardEligibility {
  campaignId: string;
  isEligible: boolean;
  overallProgressPercentage: number;
  status: 'in-progress' | 'eligible' | 'awarded' | 'not-eligible' | 'audit-flagged';
  criteriaProgress: {
    questions: { current: number; target: number; met: boolean; validCount: number; rejectedSpamCount: number };
    activeDays: { current: number; target: number; met: boolean };
    mentorChallenges: { current: number; target: number; met: boolean };
    missions: { current: number; target: number; met: boolean };
    accuracy: { current: number; target: number; met: boolean };
    competencyDiversity: { current: number; target: number; met: boolean };
    antiAbuseAudit: AntiAbuseAuditReport;
  };
  voucherCode?: string;
  redemptionStatus?: 'pending_draw' | 'won_ready_for_pickup' | 'redeemed';
  wonDate?: string;
}

export interface CollectiveClassReward {
  id: string;
  title: string;
  description: string;
  prizeDescription: string;
  imageUrl: string;
  cohortCourse: string;
  semester: string;
  metricType: 'total_questions' | 'simulations_participation' | 'average_score';
  targetValue: number;
  currentValue: number;
  unitLabel: string;
  status: 'in-progress' | 'unlocked' | 'delivered';
  deadline: string;
  sponsor: string;
  unlockedDate?: string;
}

export interface ShareableRewardCardData {
  type: 'student-reward' | 'professor-campaign' | 'institutional-milestone' | 'collective-reward';
  title: string;
  subtitle: string;
  metric: string;
  metricLabel: string;
  description: string;
  badgeLabel: string;
  date: string;
  authorOrStudent: string;
  voucherOrCode?: string;
  hashtags: string[];
  suggestedCaption: string;
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

