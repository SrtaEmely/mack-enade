import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  Medal,
  Users,
  Flame,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Achievement, Student, ScreenType } from '../types';
import { AchievementBadge } from '../components/AchievementBadge';
import { ProgressBar } from '../components/ProgressBar';

interface AchievementsScreenProps {
  student: Student;
  achievements: Achievement[];
  onNavigate: (screen: ScreenType) => void;
}

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({
  student,
  achievements,
  onNavigate,
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalXPAchievements = achievements.reduce((acc, a) => acc + a.xpReward, 0);
  const earnedXPAchievements = achievements
    .filter((a) => a.unlocked)
    .reduce((acc, a) => acc + a.xpReward, 0);

  const filteredAchievements = achievements.filter((a) => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  // Mock Academic Leaderboard (gamification)
  const leaderboard = [
    { rank: 1, name: 'Beatriz Alcantara', ra: '32185542', xp: 2840, level: 9, streak: 19, course: 'Ciência da Computação' },
    { rank: 2, name: 'Lucas F. Mendonça', ra: '32190114', xp: 2420, level: 8, streak: 15, course: 'Sistemas de Informação' },
    { rank: 3, name: 'Gabriel M. Siqueira (Você)', ra: '32194820', xp: student.xp, level: student.level, streak: student.studyStreak, isUser: true, course: student.course },
    { rank: 4, name: 'Mariana Duarte', ra: '32199841', xp: 1720, level: 6, streak: 9, course: 'Engenharia de Software' },
    { rank: 5, name: 'Rafael Guimarães', ra: '32174290', xp: 1580, level: 6, streak: 8, course: 'Ciência da Computação' },
  ];

  return (
    <div id="achievements-screen" className="space-y-6 pb-16">
      {/* Top Banner */}
      <section
        id="achievements-header-card"
        className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-50/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#EA0029] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100 uppercase tracking-wider">
                Galeria de Conquistas
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                Gamificação Acadêmica UPM
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Honrarias & Medalhas Mackenzistas
            </h1>

            <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed">
              Cada questão resolvida, simulado concluído e sequência de estudos desbloqueia insígnias institucionais e pontos de experiência para seu ranqueamento acadêmico.
            </p>
          </div>

          {/* Medals Summary Stat Box */}
          <div className="bg-zinc-900 text-white rounded-2xl p-5 border border-zinc-800 text-center shrink-0 min-w-[220px] shadow-sm">
            <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider block">
              Insígnias Resgatadas
            </span>
            <div className="text-4xl font-black text-white tracking-tight my-1">
              <span className="text-[#EA0029]">{unlockedCount}</span>
              <span className="text-zinc-500 text-2xl font-bold"> / {achievements.length}</span>
            </div>
            <span className="text-xs font-semibold text-amber-400">
              +{earnedXPAchievements} XP em recompensas
            </span>
          </div>
        </div>

        {/* Global Achievements Progress Bar */}
        <div className="mt-6 pt-4 border-t border-zinc-100">
          <ProgressBar
            value={unlockedCount}
            max={achievements.length}
            label="Progresso Geral de Conquistas"
            color="#EA0029"
            size="sm"
          />
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Todas ({achievements.length})
          </button>
          <button
            onClick={() => setFilter('unlocked')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'unlocked'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Desbloqueadas ({unlockedCount})
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'locked'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Bloqueadas ({achievements.length - unlockedCount})
          </button>
        </div>
      </div>

      {/* Badges Grid */}
      <section id="achievements-badge-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            onClick={(a) => setSelectedAchievement(a)}
          />
        ))}
      </section>

      {/* Simulated Academic Leaderboard */}
      <section id="academic-leaderboard-section" className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                Ranking da Turma (Ciclo ENADE)
              </h2>
              <p className="text-xs text-zinc-500">
                Comparativo de dedicação entre os formandos do curso de {student.course}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full self-start sm:self-auto">
            Semana Atual
          </span>
        </div>

        <div className="space-y-2 mt-3">
          {leaderboard.map((user) => (
            <div
              key={user.rank}
              className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all ${
                user.isUser
                  ? 'bg-red-50/40 border-[#EA0029]/40 ring-1 ring-red-200 shadow-xs'
                  : 'bg-zinc-50/60 border-zinc-200/80 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                    user.rank === 1
                      ? 'bg-amber-400 text-zinc-900'
                      : user.rank === 2
                      ? 'bg-zinc-300 text-zinc-800'
                      : user.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {user.rank}º
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900">
                      {user.name}
                    </span>
                    {user.isUser && (
                      <span className="text-[10px] font-extrabold bg-[#EA0029] text-white px-1.5 py-0.5 rounded uppercase">
                        Você
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">
                    RA: {user.ra} • Nível {user.level}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>{user.streak}d</span>
                </div>
                <div>
                  <span className="text-sm font-black text-zinc-900">
                    {user.xp.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-xs text-zinc-400 font-bold ml-1">XP</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Selected Badge Modal / Drawer */}
      {selectedAchievement && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedAchievement(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-zinc-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-[#EA0029] flex items-center justify-center border border-red-100">
                <Award className="w-8 h-8" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Tier {selectedAchievement.tier} • +{selectedAchievement.xpReward} XP
              </span>
              <h3 className="text-xl font-bold text-zinc-900">
                {selectedAchievement.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                {selectedAchievement.description}
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-100">
              {selectedAchievement.unlocked ? (
                <div className="text-center text-xs font-bold text-emerald-700 bg-emerald-50 py-2.5 rounded-xl border border-emerald-200">
                  Desbloqueado com sucesso!
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-600 font-bold">
                    <span>Progresso atual</span>
                    <span>{selectedAchievement.currentProgress} / {selectedAchievement.maxProgress}</span>
                  </div>
                  <ProgressBar
                    value={selectedAchievement.currentProgress}
                    max={selectedAchievement.maxProgress}
                    color="#EA0029"
                    size="sm"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedAchievement(null)}
              className="w-full text-xs font-bold bg-zinc-900 text-white py-2.5 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
