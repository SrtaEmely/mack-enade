import React from 'react';
import { Target, Zap, CheckCircle2, Clock, ChevronRight, Award, BookOpen } from 'lucide-react';
import { Mission } from '../types';
import { ProgressBar } from './ProgressBar';

interface MissionCardProps {
  mission: Mission;
  onStart?: (mission: Mission) => void;
  className?: string;
}

export const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  onStart,
  className = '',
}) => {
  const isCompleted = mission.completed || mission.currentCount >= mission.targetCount;

  const categoryBadges: Record<string, { bg: string; text: string; border: string }> = {
    'Formação Geral': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'Componente Específico': { bg: 'bg-red-50', text: 'text-[#EA0029]', border: 'border-red-200' },
    'Revisão': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'Simulado': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  };

  const badgeStyle = categoryBadges[mission.category] || {
    bg: 'bg-zinc-100',
    text: 'text-zinc-700',
    border: 'border-zinc-200',
  };

  return (
    <div
      id={`mission-card-${mission.id}`}
      className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 ${
        isCompleted
          ? 'border-emerald-200 bg-emerald-50/20'
          : 'border-zinc-200/80 hover:border-zinc-300 shadow-sm hover:shadow-md'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
          >
            {mission.category}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
            <Clock className="w-3 h-3 text-zinc-400" />
            {mission.deadline}
          </span>
        </div>

        {/* XP Badge */}
        <div
          id={`mission-xp-badge-${mission.id}`}
          className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
            isCompleted
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-red-50 text-[#EA0029] border border-red-100'
          }`}
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>+{mission.xpReward} XP</span>
        </div>
      </div>

      <div className="mt-2.5">
        <h4 className="text-sm sm:text-base font-bold text-zinc-900 leading-snug">
          {mission.title}
        </h4>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
          {mission.description}
        </p>
      </div>

      {/* Progress */}
      <div className="mt-3.5 pt-3 border-t border-zinc-100">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-zinc-500 font-medium">
            {isCompleted ? 'Missão Concluída' : 'Objetivo da Missão'}
          </span>
          <span className="font-bold text-zinc-800">
            {mission.currentCount} / {mission.targetCount}
          </span>
        </div>

        <ProgressBar
          value={mission.currentCount}
          max={mission.targetCount}
          showPercentage={false}
          color={isCompleted ? '#10b981' : '#EA0029'}
          size="xs"
        />
      </div>

      {/* Footer / Action */}
      <div className="mt-4 flex items-center justify-between gap-2">
        {isCompleted ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Recompensa Resgatada!</span>
          </div>
        ) : (
          <span className="text-[11px] text-zinc-400">
            Tempo estimado: ~5 minutos
          </span>
        )}

        <button
          id={`mission-action-btn-${mission.id}`}
          onClick={() => onStart && onStart(mission)}
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            isCompleted
              ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              : 'bg-[#EA0029] text-white hover:bg-[#c90023] shadow-xs active:scale-[0.98]'
          }`}
        >
          <span>{isCompleted ? 'Revisar' : 'Iniciar Missão'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
