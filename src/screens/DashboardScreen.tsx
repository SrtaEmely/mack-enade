import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Calendar,
  Layers,
  Award,
  ChevronRight,
  Zap,
  CheckCircle2,
  XCircle,
  History,
  Swords,
  Lightbulb,
  Gift,
} from 'lucide-react';

import {
  Student,
  Mission,
  Competency,
  RecommendedActivity,
  ScreenType,
  QuestionResult,
  BossBattle,
  MentorHourSession,
  ProfessorTip,
} from '../types';
import { XPCard } from '../components/XPCard';
import { StreakCard } from '../components/StreakCard';
import { MissionCard } from '../components/MissionCard';
import { CompetencyCard } from '../components/CompetencyCard';
import { ProgressBar } from '../components/ProgressBar';
import { BossBattleWidget } from '../components/BossBattleWidget';
import { MentorHourBanner } from '../components/MentorHourBanner';

interface DashboardScreenProps {
  student: Student;
  missions: Mission[];
  competencies: Competency[];
  recommended: RecommendedActivity;
  recentResults?: QuestionResult[];
  onNavigate: (screen: ScreenType, params?: { questionId?: string; missionId?: string }) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  student,
  missions,
  competencies,
  recommended,
  recentResults = [],
  onNavigate,
}) => {
  const [competencyFilter, setCompetencyFilter] = useState<'all' | 'Formação Geral' | 'Componente Específico'>('all');
  const [bossBattle, setBossBattle] = useState<BossBattle | null>(null);
  const [mentorHour, setMentorHour] = useState<MentorHourSession | null>(null);
  const [professorTips, setProfessorTips] = useState<ProfessorTip[]>([]);

  useEffect(() => {
    const fetchGamification = async () => {
      try {
        const [bRes, mRes, tRes] = await Promise.all([
          fetch('/api/professor/boss-battle'),
          fetch('/api/professor/mentor-hour'),
          fetch('/api/professor/tips'),
        ]);
        if (bRes.ok) setBossBattle(await bRes.json());
        if (mRes.ok) setMentorHour(await mRes.json());
        if (tRes.ok) setProfessorTips(await tRes.json());
      } catch (err) {
        console.error('Error loading gamification in student dashboard:', err);
      }
    };
    fetchGamification();
  }, []);

  const filteredCompetencies = competencies.filter((c) => {
    if (competencyFilter === 'all') return true;
    return c.area === competencyFilter;
  });

  return (
    <div id="student-dashboard-screen" className="space-y-6 pb-12">
      {/* Mentor Hour Live Alert if Live */}
      {mentorHour && (
        <MentorHourBanner
          session={mentorHour}
          isProfessorView={false}
        />
      )}

      {/* Student Greeting Banner */}
      <section
        id="student-welcome-banner"
        className="bg-white rounded-3xl p-5 sm:p-7 border border-zinc-200/80 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-50/50 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-[#EA0029] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100 uppercase tracking-wider">
                Trilha Oficial ENADE
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                RA: {student.ra} • {student.course} ({student.semester}º Semestre)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Olá, {student.name.split(' ')[0]}! 👋
            </h1>

            <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-2xl leading-relaxed">
              Continue focado na sua preparação. O Mackenzie apoia sua jornada para conquistar a nota máxima no ENADE!
            </p>
          </div>

          {/* Quick Actions: Start Simulation & Rewards */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
            <button
              id="dashboard-rewards-btn"
              onClick={() => onNavigate('rewards')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 px-4 py-3 rounded-2xl hover:brightness-105 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Gift className="w-4 h-4 text-zinc-950" />
              <span>Prêmios da Semana</span>
            </button>

            <button
              id="dashboard-start-simulation-btn"
              onClick={() => onNavigate('simulation')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-800 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <FileCheck2 className="w-4 h-4 text-[#EA0029]" />
              <span>Fazer Simulado Oficial</span>
            </button>
          </div>

        </div>
      </section>

      {/* Primary Key Stats Grid (XP, Streak, ENADE Preparation) */}
      <section id="dashboard-key-metrics-grid" className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Reusable XPCard */}
        <XPCard
          xp={student.xp}
          nextLevelXp={student.nextLevelXp}
          level={student.level}
          levelTitle={student.levelTitle}
          onViewDetails={() => onNavigate('achievements')}
        />

        {/* Reusable StreakCard */}
        <StreakCard
          streak={student.studyStreak}
          streakDays={student.streakDays}
        />

        {/* ENADE Preparation Percentage Card */}
        <div
          id="enade-prep-percentage-card"
          className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shadow-xs">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                  Prontidão ENADE
                </h3>
                <p className="text-xs text-zinc-500">Conclusão da Matriz</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-zinc-900 tracking-tight">
                {student.enadePreparationPercentage}%
              </span>
              <span className="block text-[10px] text-zinc-400 font-bold uppercase">
                Concluído
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100">
            <div className="flex justify-between text-xs text-zinc-500 mb-1.5 font-medium">
              <span>Evolução Geral</span>
              <span className="font-bold text-zinc-800">Conceito Estimado: {student.estimatedScore} / 5.0</span>
            </div>

            <ProgressBar
              value={student.enadePreparationPercentage}
              max={100}
              showPercentage={false}
              color="#EA0029"
              size="sm"
            />

            <div className="flex justify-between items-center mt-2.5 text-[11px] text-zinc-500">
              <span>{student.questionsAnswered} questões resolvidas</span>
              <button
                onClick={() => onNavigate('progress')}
                className="text-[#EA0029] font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              >
                Ver Relatório
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Next Activity Callout Banner */}
      <section
        id="recommended-activity-banner"
        className="bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 text-white rounded-3xl p-5 sm:p-6 border border-zinc-800 shadow-sm relative overflow-hidden"
      >
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#EA0029] text-white px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                Atividade Recomendada
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                Tempo estimado: ~{recommended.estimatedMinutes} min
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {recommended.title}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              {recommended.reason}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex flex-col items-end text-right mr-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-current" />
                +{recommended.xpReward} XP
              </span>
              <span className="text-[10px] text-zinc-400">Recompensa direta</span>
            </div>

            <button
              id="start-recommended-activity-btn"
              onClick={() => onNavigate(recommended.actionScreen, { questionId: recommended.targetQuestionId })}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold bg-[#EA0029] text-white px-6 py-3.5 rounded-2xl hover:bg-[#c90023] transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>Praticar Agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Boss Battle Widget */}
      {bossBattle && (
        <BossBattleWidget
          battle={bossBattle}
          onFightClick={() => onNavigate('question')}
          isProfessorView={false}
        />
      )}

      {/* Professor Learning Tips Section */}
      {professorTips.length > 0 && (
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                  Pílulas & Dicas Rápidas do Professor
                </h3>
                <p className="text-xs text-zinc-500">Orientações pedagógicas publicadas pelo corpo docente UPM</p>
              </div>
            </div>
            <span className="text-xs font-bold text-zinc-400">
              {professorTips.length} dicas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {professorTips.slice(0, 2).map((tip) => (
              <div
                key={tip.id}
                className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-amber-300 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                    {tip.competency}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {tip.readTimeMinutes} min de leitura
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 leading-snug">
                  {tip.title}
                </h4>
                <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3">
                  {tip.content}
                </p>
                <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                  <span>Por {tip.authorName}</span>
                  <span className="text-rose-600 font-semibold">{tip.likes} curtidas</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Question Results History (Live Updates from Mock Store) */}
      {recentResults.length > 0 && (
        <section
          id="recent-results-section"
          className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#EA0029]" />
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                Histórico Recente de Respostas
              </h3>
            </div>
            <span className="text-xs text-zinc-500 font-medium">
              {recentResults.length} {recentResults.length === 1 ? 'questão respondida' : 'questões respondidas'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentResults.slice(0, 3).map((res) => (
              <div
                key={res.id}
                onClick={() => onNavigate('question', { questionId: res.questionId })}
                className="p-3.5 rounded-2xl border border-zinc-200/80 hover:border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50 transition-all cursor-pointer flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {res.isCorrect ? (
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-red-100 text-[#EA0029] flex items-center justify-center shrink-0">
                        <XCircle className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-bold text-zinc-900 block truncate max-w-[150px]">
                        {res.topic || res.competency}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Assinalou ({res.selectedAlternative}) • {res.timestamp}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-black px-2 py-0.5 rounded ${
                      res.isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    +{res.earnedXp} XP
                  </span>
                </div>

                <div className="text-[11px] text-[#EA0029] font-bold flex items-center gap-1 justify-end pt-1 border-t border-zinc-200/50">
                  <span>Revisar questão</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Today's Missions Section */}
      <section id="dashboard-missions-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
              Missões de Hoje
            </h3>
            <span className="text-xs font-bold bg-zinc-100 text-zinc-700 px-2.5 py-0.5 rounded-full">
              {missions.filter((m) => m.completed).length} / {missions.length} Concluídas
            </span>
          </div>

          <button
            id="view-all-missions-btn"
            onClick={() => onNavigate('today-mission')}
            className="text-xs font-bold text-[#EA0029] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Central de Missões</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Grid of reusable MissionCards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {missions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onStart={() => onNavigate('today-mission', { missionId: mission.id })}
            />
          ))}
        </div>
      </section>

      {/* Performance by Competency Section */}
      <section id="dashboard-competencies-section" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
              Desempenho por Competência
            </h3>
            <p className="text-xs text-zinc-500">
              Mapeamento de habilidades exigidas na matriz de avaliação do INEP
            </p>
          </div>

          {/* Area Filter Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl self-start">
            <button
              onClick={() => setCompetencyFilter('all')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                competencyFilter === 'all'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Todas ({competencies.length})
            </button>
            <button
              onClick={() => setCompetencyFilter('Formação Geral')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                competencyFilter === 'Formação Geral'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Formação Geral
            </button>
            <button
              onClick={() => setCompetencyFilter('Componente Específico')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                competencyFilter === 'Componente Específico'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Específico
            </button>
          </div>
        </div>

        {/* Grid of reusable CompetencyCards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompetencies.map((comp) => (
            <CompetencyCard
              key={comp.id}
              competency={comp}
              onTrain={() => onNavigate('question')}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
