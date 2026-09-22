import React from 'react';
import { Swords, Flame, Trophy, ShieldAlert, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { BossBattle } from '../types';

interface BossBattleWidgetProps {
  battle: BossBattle;
  onFightClick?: () => void;
  isProfessorView?: boolean;
}

export const BossBattleWidget: React.FC<BossBattleWidgetProps> = ({
  battle,
  onFightClick,
  isProfessorView = false,
}) => {
  const hpPercent = Math.max(0, Math.min(100, Math.round((battle.currentHp / battle.maxHp) * 100)));
  const isDefeated = battle.status === 'defeated' || battle.currentHp <= 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white border border-zinc-800/90 shadow-xl p-6 sm:p-7">
      {/* Decorative accent background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#EA0029]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#EA0029] via-orange-500 to-[#EA0029]" />

      <div className="relative z-10 space-y-5">
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-red-600/30 text-red-300 border border-red-500/30">
              <Swords className="w-3.5 h-3.5" />
              <span>Batalha de Chefe da Turma</span>
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              {battle.course}
            </span>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
              isDefeated
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-orange-500/20 text-orange-300 border border-orange-500/40 animate-pulse'
            }`}
          >
            {isDefeated ? 'Chefe Derrotado!' : 'Ativo Agora'}
          </span>
        </div>

        {/* Boss Title & Description */}
        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>{battle.title}</span>
          </h3>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed">
            {battle.description}
          </p>
        </div>

        {/* Boss HP Bar */}
        <div className="space-y-2 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 text-red-400">
              <ShieldAlert className="w-4 h-4" />
              <span>Vida Coletiva do Chefe (HP)</span>
            </span>
            <span className="font-mono text-zinc-200">
              {battle.currentHp.toLocaleString()} / {battle.maxHp.toLocaleString()} HP ({hpPercent}%)
            </span>
          </div>

          <div className="w-full h-4 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                hpPercent > 50
                  ? 'bg-gradient-to-r from-red-600 to-red-500'
                  : hpPercent > 20
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-zinc-400 font-medium">
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Dano por acerto: <strong>{battle.damagePerCorrectAnswer} HP</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>{battle.participantsCount} alunos desferindo golpes</span>
            </span>
          </div>
        </div>

        {/* Footer info & CTA */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-amber-300 font-bold bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-800/50">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Recompensa Coletiva: +{battle.xpReward} XP e Conquista no Histórico</span>
          </div>

          {!isProfessorView && onFightClick && !isDefeated && (
            <button
              onClick={onFightClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA0029] text-white text-xs font-extrabold hover:bg-[#c90023] transition-colors cursor-pointer shadow-md active:scale-95"
            >
              <Swords className="w-4 h-4" />
              <span>Resolver Questão & Golpear</span>
            </button>
          )}

          {isProfessorView && (
            <span className="text-xs text-zinc-400 italic">
              * O dano é aplicado em tempo real conforme os alunos acertam questões no simulador.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
