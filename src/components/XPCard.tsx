import React from 'react';
import { Sparkles, Trophy, ChevronRight } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

interface XPCardProps {
  xp: number;
  nextLevelXp: number;
  level: number;
  levelTitle: string;
  className?: string;
  onViewDetails?: () => void;
}

export const XPCard: React.FC<XPCardProps> = ({
  xp,
  nextLevelXp,
  level,
  levelTitle,
  className = '',
  onViewDetails,
}) => {
  const currentLevelBaseXp = Math.max(0, nextLevelXp - 1000);
  const xpInCurrentLevel = Math.max(0, xp - currentLevelBaseXp);
  const xpNeededForLevel = nextLevelXp - currentLevelBaseXp;
  const xpRemaining = Math.max(0, nextLevelXp - xp);

  return (
    <div
      id="xp-summary-card"
      className={`bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${className}`}
    >
      {/* Background ambient accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/60 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3.5">
          <div
            id="xp-level-badge"
            className="w-12 h-12 rounded-xl bg-zinc-900 text-white flex flex-col items-center justify-center font-black shadow-sm ring-2 ring-zinc-200"
          >
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold leading-none">
              NV
            </span>
            <span className="text-xl leading-none text-white font-extrabold">{level}</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                {levelTitle}
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200/60">
                <Trophy className="w-3 h-3 text-amber-600" />
                Rank Top 5%
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#EA0029]" />
              Faltam <span className="font-bold text-zinc-800">{xpRemaining} XP</span> para o Nível {level + 1}
            </p>
          </div>
        </div>

        {onViewDetails && (
          <button
            id="xp-details-btn"
            onClick={onViewDetails}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
            title="Ver recompensas de XP"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-100 relative z-10">
        <div className="flex justify-between items-baseline mb-1 text-xs">
          <span className="text-zinc-500 font-medium">Progresso do Nível</span>
          <span className="font-bold text-zinc-900">
            <span className="text-[#EA0029]">{xpInCurrentLevel}</span>
            <span className="text-zinc-400"> / {xpNeededForLevel} XP</span>
          </span>
        </div>
        <ProgressBar
          value={xpInCurrentLevel}
          max={xpNeededForLevel}
          showPercentage={false}
          color="#EA0029"
          size="sm"
        />
        <div className="flex justify-between items-center mt-2 text-[11px] text-zinc-500">
          <span>Total acumulado: <strong className="text-zinc-800">{xp.toLocaleString('pt-BR')} XP</strong></span>
          <span className="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
            +50 XP por acerto
          </span>
        </div>
      </div>
    </div>
  );
};
