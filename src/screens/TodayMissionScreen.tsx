import React, { useState } from 'react';
import {
  Target,
  Sparkles,
  Clock,
  Zap,
  CheckCircle2,
  Calendar,
  Flame,
  Award,
  ChevronRight,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { Mission, ScreenType } from '../types';
import { MissionCard } from '../components/MissionCard';
import { ProgressBar } from '../components/ProgressBar';

interface TodayMissionScreenProps {
  missions: Mission[];
  streak: number;
  onNavigate: (screen: ScreenType, params?: { questionId?: string }) => void;
  onStartMission: (mission: Mission) => void;
}

export const TodayMissionScreen: React.FC<TodayMissionScreenProps> = ({
  missions,
  streak,
  onNavigate,
  onStartMission,
}) => {
  const completedCount = missions.filter((m) => m.completed).length;
  const totalXP = missions.reduce((acc, m) => acc + m.xpReward, 0);
  const earnedXP = missions.filter((m) => m.completed).reduce((acc, m) => acc + m.xpReward, 0);

  return (
    <div id="today-mission-screen" className="space-y-6 pb-12">
      {/* Top Breadcrumb / Return */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-white px-3 py-2 rounded-xl border border-zinc-200 cursor-pointer shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Painel</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-orange-700 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-200">
          <Flame className="w-4 h-4 fill-orange-500 text-orange-600" />
          <span>Bônus de Ofensiva Ativo: 1.2x XP</span>
        </div>
      </div>

      {/* Hero Header Card */}
      <section
        id="today-mission-hero"
        className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-red-50/70 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="max-w-3xl relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold bg-[#EA0029] text-white px-3 py-1 rounded-full uppercase tracking-wider">
              Missões Diárias
            </span>
            <span className="text-xs font-medium text-zinc-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              Renovação em 14h 32m
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Desafios do Dia: Conquiste até +{totalXP} XP
          </h1>

          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
            As missões diárias do Mack ENADE são calibradas pela coordenação para cobrir os temas com maior recorrência nas provas do INEP. Responda às questões propostas para consolidar seu aprendizado e manter a ofensiva.
          </p>

          {/* Daily completion status */}
          <div className="pt-2">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-800 mb-1.5">
              <span>Progresso das Missões de Hoje</span>
              <span className="text-[#EA0029]">{completedCount} de {missions.length} Concluídas ({earnedXP} / {totalXP} XP)</span>
            </div>
            <ProgressBar
              value={completedCount}
              max={missions.length}
              showPercentage={false}
              color="#EA0029"
              size="sm"
            />
          </div>
        </div>
      </section>

      {/* Mission Cards List */}
      <section id="missions-list-section" className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <Target className="w-5 h-5 text-[#EA0029]" />
          <span>Objetivos Ativos</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {missions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onStart={() => onStartMission(mission)}
            />
          ))}
        </div>
      </section>

      {/* Daily Bonus Box */}
      <section
        id="streak-daily-bonus-callout"
        className="bg-zinc-900 text-white rounded-2xl p-5 sm:p-6 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-xl bg-[#EA0029] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Complete todas as 3 missões hoje
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Ganhe o baú de +150 XP bônus e mantenha sua ofensiva de {streak} dias ativa!
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const firstIncomplete = missions.find((m) => !m.completed) || missions[0];
            onStartMission(firstIncomplete);
          }}
          className="w-full sm:w-auto text-xs sm:text-sm font-bold bg-white text-zinc-900 px-5 py-2.5 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
        >
          Iniciar Próxima Missão
        </button>
      </section>
    </div>
  );
};
