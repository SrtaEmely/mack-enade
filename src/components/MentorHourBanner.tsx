import React from 'react';
import { Radio, Sparkles, ExternalLink, Play, Square, Users, Clock } from 'lucide-react';
import { MentorHourSession } from '../types';

interface MentorHourBannerProps {
  session: MentorHourSession;
  onToggleLive?: () => void;
  isProfessorView?: boolean;
}

export const MentorHourBanner: React.FC<MentorHourBannerProps> = ({
  session,
  onToggleLive,
  isProfessorView = false,
}) => {
  const isLive = session.status === 'live';

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        isLive
          ? 'bg-gradient-to-r from-red-600 via-[#EA0029] to-red-700 text-white shadow-md border-red-500'
          : 'bg-zinc-50 border-zinc-200 text-zinc-800'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              isLive ? 'bg-white/20 text-white animate-pulse' : 'bg-zinc-200 text-zinc-600'
            }`}
          >
            <Radio className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  isLive
                    ? 'bg-white text-[#EA0029]'
                    : 'bg-zinc-200 text-zinc-700'
                }`}
              >
                {isLive ? 'Ao Vivo Agora • Plantão do Mentor' : 'Próximo Plantão Agendado'}
              </span>
              <span className={`text-xs font-bold ${isLive ? 'text-white' : 'text-zinc-500'}`}>
                {session.date} • {session.time}
              </span>
            </div>

            <h4 className={`text-sm font-bold mt-0.5 ${isLive ? 'text-white' : 'text-zinc-900'}`}>
              {session.topic}
            </h4>

            <p className={`text-xs mt-0.5 ${isLive ? 'text-red-100' : 'text-zinc-500'}`}>
              Orientador: {session.professorName} • {session.platform}
              {isLive && (
                <span className="ml-2 font-bold text-amber-300">
                  ⚡ Bônus Ativo: Dobro de XP (+{session.xpMultiplier}x) em todas as questões resolvidas!
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {session.meetingUrl && (
            <a
              href={session.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
                isLive
                  ? 'bg-white text-[#EA0029] hover:bg-zinc-100'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              <span>Acessar Sala</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {isProfessorView && onToggleLive && (
            <button
              onClick={onToggleLive}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
                isLive
                  ? 'bg-black/30 hover:bg-black/50 text-white'
                  : 'bg-[#EA0029] text-white hover:bg-[#c90023]'
              }`}
            >
              {isLive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isLive ? 'Encerrar Plantão' : 'Iniciar Plantão (2x XP)'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
