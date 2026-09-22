import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  HelpCircle,
  TrendingUp,
  Sparkles,
  PlusCircle,
  MessageSquare,
  Radio,
  Share2,
  ChevronRight,
  AlertTriangle,
  FileCheck2,
  Swords,
  Clock,
  CheckCircle2,
  BookOpen,
  Gift,
} from 'lucide-react';

import {
  Professor,
  Question,
  BossBattle,
  MentorHourSession,
  StudentDoubt,
  ClassStudentProgress,
  ScreenType,
  InstitutionalAchievement,
} from '../types';
import {
  sampleQuestions,
  initialStudentDoubts,
  initialBossBattle,
  initialMentorHourSession,
  initialInstitutionalAchievements,
} from '../data/mockData';
import { BossBattleWidget } from '../components/BossBattleWidget';
import { MentorHourBanner } from '../components/MentorHourBanner';
import { SocialShareModal } from '../components/SocialShareModal';
import { CreateQuestionWorkflow } from '../components/CreateQuestionWorkflow';

interface ProfessorDashboardScreenProps {
  professor: Professor;
  onNavigate: (screen: ScreenType) => void;
  onQuestionCreated?: (question: Question) => void;
}

export const ProfessorDashboardScreen: React.FC<ProfessorDashboardScreenProps> = ({
  professor,
  onNavigate,
  onQuestionCreated,
}) => {
  const [questions, setQuestions] = useState<Question[]>(sampleQuestions);
  const [doubts, setDoubts] = useState<StudentDoubt[]>(initialStudentDoubts);
  const [bossBattle, setBossBattle] = useState<BossBattle | null>(initialBossBattle);
  const [mentorHour, setMentorHour] = useState<MentorHourSession | null>(initialMentorHourSession);
  const [achievements, setAchievements] = useState<InstitutionalAchievement[]>(initialInstitutionalAchievements);
  const [selectedShareAchievement, setSelectedShareAchievement] = useState<InstitutionalAchievement | null>(null);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Professor Overview Data
  const loadData = async () => {
    try {
      const fetchJsonSafe = async (url: string) => {
        try {
          const res = await fetch(url);
          const ct = res.headers.get('content-type');
          if (res.ok && ct && ct.includes('application/json')) {
            return await res.json();
          }
          return null;
        } catch {
          return null;
        }
      };

      const [qData, dData, bData, mData, aData] = await Promise.all([
        fetchJsonSafe('/api/questions'),
        fetchJsonSafe('/api/professor/doubts'),
        fetchJsonSafe('/api/professor/boss-battle'),
        fetchJsonSafe('/api/professor/mentor-hour'),
        fetchJsonSafe('/api/professor/institutional-achievements'),
      ]);

      if (qData) setQuestions(qData);
      if (dData) setDoubts(dData);
      if (bData) setBossBattle(bData);
      if (mData) setMentorHour(mData);
      if (aData) setAchievements(aData);
    } catch (err) {
      console.warn('Professor dashboard running with default data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleMentorHour = async () => {
    try {
      const res = await fetch('/api/professor/mentor-hour/toggle', { method: 'POST' });
      if (res.ok) {
        setMentorHour(await res.json());
      }
    } catch (err) {
      console.error('Error toggling mentor hour:', err);
    }
  };

  const pendingDoubtsCount = doubts.filter((d) => d.status === 'pending').length;
  const draftQuestions = questions.filter((q) => q.status === 'draft');

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Welcome Header */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-[#EA0029] border border-red-200">
                Portal Docente UPM
              </span>
              <span className="text-xs font-semibold text-zinc-500">
                {professor.department}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Olá, {professor.name}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed">
              Supervisionando a preparação de <strong className="text-zinc-900">142 formandos</strong> em {professor.courses ? professor.courses.join(', ') : professor.course} para o ENADE 2024.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCreatingQuestion(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EA0029] text-white text-xs font-bold hover:bg-[#c90023] transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Criar Questão (&lt; 2 min)</span>
            </button>

            <button
              onClick={() => onNavigate('professor-mentorship')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-xs font-bold hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-zinc-500" />
              <span>Dúvidas ({pendingDoubtsCount})</span>
            </button>

            <button
              onClick={() => onNavigate('professor-rewards')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <Gift className="w-4 h-4 text-amber-600" />
              <span>Gestor de Recompensas</span>
            </button>


            {achievements[0] && (
              <button
                onClick={() => setSelectedShareAchievement(achievements[0])}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-xs font-bold hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-[#EA0029]" />
                <span>Card de Conquista</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Draft Questions Banner Alert (Constraint: All AI generated questions stay in draft until approved) */}
      {draftQuestions.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-amber-900">
                {draftQuestions.length} Questões em Rascunho Aguardando Aprovação
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Questões geradas por IA permanecem retidas até sua revisão pedagógica e aprovação explícita.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('professor-questions')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors cursor-pointer shrink-0 self-end sm:self-center"
          >
            <span>Revisar Rascunhos</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Create Question Modal / Inline View */}
      {isCreatingQuestion && (
        <CreateQuestionWorkflow
          onQuestionCreated={(newQ) => {
            setIsCreatingQuestion(false);
            if (onQuestionCreated) onQuestionCreated(newQ);
            loadData();
          }}
          onCancel={() => setIsCreatingQuestion(false)}
          defaultCourse={professor.courses ? professor.courses[0] : professor.course}
        />
      )}

      {/* Mentor Hour Active Banner */}
      {mentorHour && (
        <MentorHourBanner
          session={mentorHour}
          onToggleLive={handleToggleMentorHour}
          isProfessorView={true}
        />
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Alunos no Ciclo
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-zinc-900">142</p>
          <p className="text-xs text-zinc-500">
            87% de adesão nos simulados semanais
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Conceito Estimado
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-[#EA0029] flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-[#EA0029]">4.1</p>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Faixa 5 UPM
            </span>
          </div>
          <p className="text-xs text-zinc-500">Meta institucional: Conceito 5.0</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Dúvidas de Alunos
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-zinc-900">{pendingDoubtsCount}</p>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              Pendentes
            </span>
          </div>
          <p className="text-xs text-zinc-500">Tempo médio de resposta: 4h</p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Acervo de Questões
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-zinc-900">{questions.length}</p>
            {draftQuestions.length > 0 && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                +{draftQuestions.length} rascunhos
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500">Classificadas por competência</p>
        </div>
      </div>

      {/* Main Grid: Boss Battle & Competency Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Boss Battle Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {bossBattle && (
            <BossBattleWidget
              battle={bossBattle}
              isProfessorView={true}
            />
          )}

          {/* Quick Actions Panel */}
          <div className="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">
              Ferramentas de Mentoria e Gestão da Turma
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => onNavigate('professor-questions')}
                className="p-4 rounded-2xl border border-zinc-200 hover:border-[#EA0029]/50 hover:bg-red-50/20 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-red-50 text-[#EA0029] flex items-center justify-center mb-2 font-bold">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-zinc-900 group-hover:text-[#EA0029]">
                  Banco & Criação
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Criar em &lt; 2 min, importar arquivos e IA
                </p>
              </button>

              <button
                onClick={() => onNavigate('professor-mentorship')}
                className="p-4 rounded-2xl border border-zinc-200 hover:border-blue-300 hover:bg-blue-50/20 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-zinc-900 group-hover:text-blue-600">
                  Dúvidas & Pílulas
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Responder alunos e publicar dicas curtas
                </p>
              </button>

              <button
                onClick={() => onNavigate('professor-challenges')}
                className="p-4 rounded-2xl border border-zinc-200 hover:border-purple-300 hover:bg-purple-50/20 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 font-bold">
                  <Swords className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-zinc-900 group-hover:text-purple-600">
                  Desafios do Mentor
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Batalhas contra chefes e missões de turma
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Competency Watchlist (1 col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">
                Atenção Pedagógica
              </h3>
              <button
                onClick={() => onNavigate('professor-class-performance')}
                className="text-xs font-bold text-[#EA0029] hover:underline cursor-pointer"
              >
                Ver Turma Completa
              </button>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Competências que exigem reforço baseado na taxa de acertos dos alunos nos simulados:
            </p>

            <div className="space-y-3">
              {/* Item 1 */}
              <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-red-900">Bancos de Dados & Transações</span>
                  <span className="text-[#EA0029]">58% de acertos</span>
                </div>
                <div className="w-full h-2 bg-red-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#EA0029] rounded-full" style={{ width: '58%' }} />
                </div>
                <p className="text-[11px] text-red-700">
                  Recomendação: Publicar pílula sobre Níveis de Isolamento ANSI SQL.
                </p>
              </div>

              {/* Item 2 */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-amber-900">Sistemas Operacionais & Redes</span>
                  <span className="text-amber-700">64% de acertos</span>
                </div>
                <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '64%' }} />
                </div>
                <p className="text-[11px] text-amber-800">
                  Destaque para dúvidas sobre Handshake TCP vs UDP.
                </p>
              </div>

              {/* Item 3 */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-900">Algoritmos & Complexidade</span>
                  <span className="text-emerald-700">81% de acertos</span>
                </div>
                <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: '81%' }} />
                </div>
                <p className="text-[11px] text-emerald-800">
                  Excelente domínio da turma em análise assintótica O(n log n).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Share Modal */}
      {selectedShareAchievement && (
        <SocialShareModal
          achievement={selectedShareAchievement}
          isOpen={true}
          onClose={() => setSelectedShareAchievement(null)}
        />
      )}
    </div>
  );
};
