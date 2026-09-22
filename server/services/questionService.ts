/**
 * Question Service for Mack ENADE
 * Manages question bank from Google Sheets + session modifications
 * Enforces pilot governance: only APPROVED + active questions are visible to students.
 */

import { googleSheetsService, SheetQuestion } from './googleSheetsService';
import { MackEnadeRole } from '../../src/types';

export interface QuestionFilters {
  course_id?: string;
  discipline_id?: string;
  difficulty?: string;
  question_type?: string;
  competency?: string;
  enade_component?: string;
  professor_id?: string;
  active?: boolean;
  review_status?: string;
  role?: MackEnadeRole;
}

// Initial approved seed questions for immediate student practice
const INITIAL_APPROVED_QUESTIONS: SheetQuestion[] = [
  {
    question_id: 'ENADE-PROD-2026-01',
    course_id: 'PROD',
    discipline_id: 'PROD-14',
    professor_id: 'prof-upm-prod',
    enade_component: 'SPECIFIC',
    question_type: 'MULTIPLE_CHOICE',
    difficulty: 'MEDIUM',
    topic: 'Pesquisa Operacional e Otimização',
    competency: 'Modelagem de Sistemas Produtivos',
    statement: 'Uma empresa fabrica dois produtos A e B. O produto A requer 2 horas de usinagem e gera R$ 40 de lucro; o produto B requer 3 horas de usinagem e gera R$ 50 de lucro. Há 120 horas de usinagem disponíveis por semana. A restrição 2A + 3B ≤ 120 expressa corretamente a limitação desse recurso. Qual das afirmações a seguir descreve com precisão o impacto de aumentar a capacidade em 10 horas?',
    supporting_text: 'Considere a teoria de sensibilidade e preço-sombra (dual) da programação linear aplicada a sistemas produtivos discretos.',
    image_url: '',
    alternative_a: 'O lucro total aumentará necessariamente em R$ 400 por semana.',
    alternative_b: 'O novo ponto ótimo dependerá do preço-sombra da restrição de usinagem dentro do intervalo de viabilidade.',
    alternative_c: 'A solução ótima passará a produzir exclusivamente o produto B, eliminando o produto A.',
    alternative_d: 'A região viável diminui proporcionalmente ao acréscimo de capacidade horária.',
    alternative_e: 'O problema se tornará inviável devido à superalocação do recurso de usinagem.',
    correct_answer: 'B',
    explanation: 'O preço-sombra (shadow price) indica a taxa marginal de variação da função objetivo por unidade adicional do recurso restrito, válida dentro de um intervalo de variação permitido.',
    common_error: 'Assumir que acréscimo de recurso sempre gera lucro linear proporcional ao maior coeficiente unitário.',
    creation_method: 'MANUAL',
    source: 'Portaria INEP ENADE 2026 - Engenharia de Produção',
    source_year: '2026',
    review_status: 'APPROVED',
    reviewed_by: 'Comissão Própria ENADE Mackenzie',
    created_at: '2026-09-18T10:00:00Z',
    updated_at: '2026-09-18T10:00:00Z',
    active: true,
    tags: 'pesquisa operacional;programação linear;otimização;enade 2026',
    expected_response_time: 120,
  },
  {
    question_id: 'ENADE-PROD-2026-02',
    course_id: 'PROD',
    discipline_id: 'PROD-03',
    professor_id: 'prof-upm-prod',
    enade_component: 'SPECIFIC',
    question_type: 'MULTIPLE_CHOICE',
    difficulty: 'EASY',
    topic: 'Gestão da Qualidade',
    competency: 'Controle Estatístico de Processos',
    statement: 'No Controle Estatístico de Processo (CEP), um gráfico de controle X-barra com limites 3-sigma tem por objetivo principal:',
    supporting_text: 'Distinga causas comuns (aleatórias inerentes) de causas especiais (atribuíveis).',
    image_url: '',
    alternative_a: 'Garantir que 100% dos produtos estejam isentos de qualquer desvio geométrico.',
    alternative_b: 'Substituir a inspeção dimensional e os testes de conformidade na linha final.',
    alternative_c: 'Identificar a ocorrência de causas especiais de variação para manter o processo sob controle estatístico.',
    alternative_d: 'Eliminar completamente todas as causas aleatórias inerentes à tecnologia empregada.',
    alternative_e: 'Determinar a precificação de venda com base no custo de não conformidade interna.',
    correct_answer: 'C',
    explanation: 'Os gráficos de controle diferenciam variações por causas comuns (estáveis) de variações por causas especiais (atribuíveis), sinalizando quando ações corretivas devem ser tomadas.',
    common_error: 'Acreditar que o CEP elimina causas comuns de variação.',
    creation_method: 'MANUAL',
    source: 'Banco Oficial ENADE Mackenzie',
    source_year: '2026',
    review_status: 'APPROVED',
    reviewed_by: 'Comissão Própria ENADE Mackenzie',
    created_at: '2026-09-18T10:00:00Z',
    updated_at: '2026-09-18T10:00:00Z',
    active: true,
    tags: 'qualidade;cep;estatística;produção',
    expected_response_time: 90,
  },
  {
    question_id: 'ENADE-CIVIL-2026-01',
    course_id: 'CIVIL',
    discipline_id: 'CIV-06',
    professor_id: 'prof-upm-civil',
    enade_component: 'SPECIFIC',
    question_type: 'MULTIPLE_CHOICE',
    difficulty: 'EASY',
    topic: 'Estatística e Ensaios Tecnológicos',
    competency: 'Interpretação Quantitativa de Ensaios',
    statement: 'Em um ensaio de controle tecnológico de concreto estrutural (NBR 5739), cinco corpos de prova de uma mesma concretagem apresentaram as seguintes resistências à compressão axial aos 28 dias: 28 MPa, 30 MPa, 30 MPa, 32 MPa e 35 MPa. Qual é a mediana e a moda dessa amostra?',
    supporting_text: 'A mediana é o elemento central do rol ordenado; a moda é o valor de maior frequência absoluta.',
    image_url: '',
    alternative_a: 'Mediana: 30 MPa; Moda: 30 MPa.',
    alternative_b: 'Mediana: 31 MPa; Moda: 32 MPa.',
    alternative_c: 'Mediana: 30 MPa; Moda: 35 MPa.',
    alternative_d: 'Mediana: 29 MPa; Moda: 28 MPa.',
    alternative_e: 'Mediana: 32 MPa; Amostra amodal.',
    correct_answer: 'A',
    explanation: 'No rol ordenado [28, 30, 30, 32, 35], a posição central (3º elemento de 5) é 30 MPa. O valor com maior repetição é 30 MPa (frequência 2). Logo, mediana = 30 MPa e moda = 30 MPa.',
    common_error: 'Calcular a média aritmética simples (31 MPa) e confundi-la com a mediana.',
    creation_method: 'MANUAL',
    source: 'Portaria INEP ENADE 2026 - Engenharia Civil',
    source_year: '2026',
    review_status: 'APPROVED',
    reviewed_by: 'Comissão Própria ENADE Mackenzie',
    created_at: '2026-09-18T10:00:00Z',
    updated_at: '2026-09-18T10:00:00Z',
    active: true,
    tags: 'concreto;resistência;estatística;civil',
    expected_response_time: 90,
  },
  {
    question_id: 'ENADE-CIVIL-2026-02',
    course_id: 'CIVIL',
    discipline_id: 'CIV-09',
    professor_id: 'prof-upm-civil',
    enade_component: 'SPECIFIC',
    question_type: 'MULTIPLE_CHOICE',
    difficulty: 'MEDIUM',
    topic: 'Mecânica dos Sólidos e Resistência dos Materiais',
    competency: 'Dimensionamento Estrutural',
    statement: 'Uma viga biapoiada de vão L = 6,0 m está submetida a uma carga uniformemente distribuída q = 10 kN/m ao longo de todo o seu comprimento. Desprezando o peso próprio, o momento fletor máximo atuante no meio do vão vale:',
    supporting_text: 'Fórmula clássica para viga biapoiada sob carga uniforme: Mmax = (q * L²) / 8.',
    image_url: '',
    alternative_a: '30 kNm',
    alternative_b: '45 kNm',
    alternative_c: '60 kNm',
    alternative_d: '75 kNm',
    alternative_e: '90 kNm',
    correct_answer: 'B',
    explanation: 'Mmax = (q * L²) / 8 = (10 * 6²) / 8 = (10 * 36) / 8 = 360 / 8 = 45 kNm.',
    common_error: 'Dividir por 4 em vez de 8, calculando como se fosse carga concentrada pontual (90 kNm).',
    creation_method: 'MANUAL',
    source: 'Portaria INEP ENADE 2026 - Engenharia Civil',
    source_year: '2026',
    review_status: 'APPROVED',
    reviewed_by: 'Comissão Própria ENADE Mackenzie',
    created_at: '2026-09-18T10:00:00Z',
    updated_at: '2026-09-18T10:00:00Z',
    active: true,
    tags: 'estruturas;momento fletor;vigas;civil',
    expected_response_time: 120,
  },
];

export class QuestionService {
  constructor() {
    // Development-only demo questions. PILOT/PRODUCTION use Google Sheets as source of truth.
    if ((process.env.APP_ENV || 'PILOT').toUpperCase() === 'DEVELOPMENT') {
      for (const q of INITIAL_APPROVED_QUESTIONS) googleSheetsService.addSeedQuestion(q);
    }
  }

  /**
   * Retrieves questions filtered by parameters and user role
   */
  public async getQuestions(filters: QuestionFilters = {}): Promise<SheetQuestion[]> {
    const all = await googleSheetsService.getQuestions();

    return all.filter((q) => {
      // 1. Governance Rule: STUDENTS can ONLY see APPROVED and ACTIVE questions!
      if (filters.role === 'STUDENT') {
        if (!q.active || q.review_status !== 'APPROVED') {
          return false;
        }
      }

      // 2. Course filtering
      if (filters.course_id) {
        const reqCourse = filters.course_id.toUpperCase().trim();
        if (q.course_id && q.course_id !== reqCourse && q.course_id !== 'BOTH') {
          return false;
        }
      }

      // 3. Discipline filtering
      if (filters.discipline_id && q.discipline_id !== filters.discipline_id) {
        return false;
      }

      // 4. Difficulty filtering
      if (filters.difficulty && q.difficulty.toUpperCase() !== filters.difficulty.toUpperCase()) {
        return false;
      }

      // 5. Question Type filtering
      if (filters.question_type && q.question_type.toUpperCase() !== filters.question_type.toUpperCase()) {
        return false;
      }

      // 6. Review status filtering (for professors/coordinators)
      if (filters.review_status && q.review_status !== filters.review_status) {
        return false;
      }

      // 7. Active filter (if explicitly passed)
      if (filters.active !== undefined && q.active !== filters.active) {
        return false;
      }

      // 8. Professor ID filter
      if (filters.professor_id && q.professor_id !== filters.professor_id) {
        return false;
      }

      return true;
    });
  }

  /**
   * Gets a question by ID
   */
  public async getQuestionById(questionId: string): Promise<SheetQuestion | null> {
    const all = await googleSheetsService.getQuestions();
    return all.find((q) => q.question_id === questionId) || null;
  }

  /**
   * Creates a question authored by a professor
   * Default governance: review_status = 'DRAFT', active = false
   */
  public async createProfessorQuestion(
    data: Partial<SheetQuestion>,
    professorId: string
  ): Promise<SheetQuestion> {
    const newId = `MACK-PROF-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const question: SheetQuestion = {
      question_id: newId,
      course_id: (data.course_id || 'PROD').toUpperCase(),
      discipline_id: data.discipline_id || 'PROD-01',
      professor_id: professorId,
      enade_component: data.enade_component || 'SPECIFIC',
      question_type: data.question_type || 'MULTIPLE_CHOICE',
      difficulty: data.difficulty || 'MEDIUM',
      topic: data.topic || 'Conhecimento Específico',
      competency: data.competency || 'Competência Técnica',
      statement: data.statement || '',
      supporting_text: data.supporting_text || '',
      image_url: data.image_url || '',
      alternative_a: data.alternative_a || '',
      alternative_b: data.alternative_b || '',
      alternative_c: data.alternative_c || '',
      alternative_d: data.alternative_d || '',
      alternative_e: data.alternative_e || '',
      correct_answer: (data.correct_answer || 'A').toUpperCase() as any,
      explanation: data.explanation || '',
      common_error: data.common_error || '',
      creation_method: 'MANUAL',
      source: data.source || 'Docente UPM Mackenzie',
      source_year: data.source_year || '2026',
      review_status: 'DRAFT',
      reviewed_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      active: false,
      tags: data.tags || 'enade;mackenzie;piloto',
      expected_response_time: data.expected_response_time || 120,
    };

    return await googleSheetsService.saveQuestion(question);
  }

  /**
   * Stores an AI-generated question (Gemini)
   * Governance: creation_method = 'AI', review_status = 'DRAFT', active = false
   * Never automatically approved or made public to students
   */
  public async createAiQuestion(
    data: Partial<SheetQuestion>,
    professorId?: string
  ): Promise<SheetQuestion> {
    const newId = `MACK-AI-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const question: SheetQuestion = {
      question_id: newId,
      course_id: (data.course_id || 'PROD').toUpperCase(),
      discipline_id: data.discipline_id || 'PROD-01',
      professor_id: professorId || 'gemini-ai',
      enade_component: data.enade_component || 'SPECIFIC',
      question_type: data.question_type || 'MULTIPLE_CHOICE',
      difficulty: data.difficulty || 'MEDIUM',
      topic: data.topic || 'Conhecimento Gerado por IA',
      competency: data.competency || 'Competência ENADE',
      statement: data.statement || '',
      supporting_text: data.supporting_text || '',
      image_url: data.image_url || '',
      alternative_a: data.alternative_a || '',
      alternative_b: data.alternative_b || '',
      alternative_c: data.alternative_c || '',
      alternative_d: data.alternative_d || '',
      alternative_e: data.alternative_e || '',
      correct_answer: (data.correct_answer || 'A').toUpperCase() as any,
      explanation: data.explanation || '',
      common_error: data.common_error || '',
      creation_method: 'AI',
      source: 'IA Generativa (Gemini) - Aguardando validação docente',
      source_year: '2026',
      review_status: 'DRAFT',
      reviewed_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      active: false,
      tags: 'ai;gemini;rascunho;enade',
      expected_response_time: data.expected_response_time || 120,
    };

    return await googleSheetsService.saveQuestion(question);
  }

  /**
   * Submits a question for institutional review: status becomes PENDING_REVIEW
   */
  public async submitForReview(questionId: string): Promise<SheetQuestion> {
    const updated = await googleSheetsService.updateQuestionStatus(questionId, 'PENDING_REVIEW', false);
    if (!updated) {
      throw new Error(`Questão ${questionId} não encontrada para envio de revisão.`);
    }
    return updated;
  }

  /**
   * Approves a question: review_status = 'APPROVED', active = true
   */
  public async approveQuestion(questionId: string, reviewerName = 'Coordenação ENADE'): Promise<SheetQuestion> {
    const existing = await this.getQuestionById(questionId);
    if (!existing) {
      throw new Error(`Questão ${questionId} não encontrada para aprovação.`);
    }

    existing.review_status = 'APPROVED';
    existing.active = true;
    existing.reviewed_by = reviewerName;
    existing.updated_at = new Date().toISOString();

    return await googleSheetsService.saveQuestion(existing);
  }

  /**
   * Updates an existing question
   */
  public async updateQuestion(questionId: string, updates: Partial<SheetQuestion>): Promise<SheetQuestion> {
    const existing = await this.getQuestionById(questionId);
    if (!existing) {
      throw new Error(`Questão ${questionId} não encontrada para atualização.`);
    }

    const updated: SheetQuestion = {
      ...existing,
      ...updates,
      question_id: existing.question_id,
      updated_at: new Date().toISOString(),
    };

    return await googleSheetsService.saveQuestion(updated);
  }
}

export const questionService = new QuestionService();
