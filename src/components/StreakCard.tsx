import React from 'react';
import { Flame, Calendar, Check } from 'lucide-react';

interface StreakCardProps {
  streak: number;
  streakDays?: boolean[];
  className?: string;
}

export const StreakCard: React.FC<StreakCardProps> = ({
  streak,
  streakDays = [true, true, true, true, true, true, true],
  className = '',
}) => {
  const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div
      id="streak-status-card"
      className={`bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            id="streak-flame-icon-container"
            className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600 shadow-xs"
          >
            <Flame className="w-7 h-7 fill-orange-500 text-orange-600 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                Ofensiva de Estudos
              </h3>
            </div>
            <p className="text-xs text-zinc-500">
              Prática consistente para o ENADE
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-black text-zinc-900 tracking-tight flex items-baseline justify-end gap-1">
            <span className="text-[#EA0029]">{streak}</span>
            <span className="text-xs font-bold text-zinc-500 uppercase">dias</span>
          </div>
          <span className="text-[10px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
            Fogo Ativo! 🔥
          </span>
        </div>
      </div>

      {/* Week overview */}
      <div className="mt-4 pt-3 border-t border-zinc-100">
        <div className="flex items-center justify-between gap-1">
          {daysOfWeek.map((day, idx) => {
            const isActive = streakDays[idx] ?? true;
            const isToday = idx === 4; // Simulated current day (Friday)
            return (
              <div
                key={day}
                className="flex flex-col items-center gap-1.5 flex-1"
                title={`${day}: ${isActive ? 'Meta diária cumprida' : 'Dia pendente'}`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#EA0029] text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-400 border border-dashed border-zinc-300'
                  } ${isToday ? 'ring-2 ring-red-300 ring-offset-1' : ''}`}
                >
                  {isActive ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span className="text-[10px]">{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    isToday ? 'text-[#EA0029] font-bold' : 'text-zinc-500'
                  }`}
                >
                  {day}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-center">
          <p className="text-[11px] text-zinc-500">
            Estude hoje para manter sua ofensiva e garantir <strong className="text-zinc-700">+100 XP bônus</strong> no domingo.
          </p>
        </div>
      </div>
    </div>
  );
};
