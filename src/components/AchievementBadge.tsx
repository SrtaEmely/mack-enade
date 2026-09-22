import React from 'react';
import {
  Trophy,
  Flame,
  Target,
  Compass,
  Award,
  BookOpen,
  ShieldCheck,
  GraduationCap,
  Zap,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { Achievement } from '../types';
import { ProgressBar } from './ProgressBar';

interface AchievementBadgeProps {
  achievement: Achievement;
  className?: string;
  onClick?: (achievement: Achievement) => void;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  className = '',
  onClick,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'flame':
        return Flame;
      case 'target':
        return Target;
      case 'compass':
        return Compass;
      case 'award':
        return Award;
      case 'book-open':
        return BookOpen;
      case 'shield-check':
        return ShieldCheck;
      case 'graduation-cap':
        return GraduationCap;
      case 'zap':
        return Zap;
      default:
        return Trophy;
    }
  };

  const IconComponent = getIcon(achievement.icon);

  const tierStyles = {
    bronze: {
      border: 'border-amber-700/20',
      badgeBg: 'bg-amber-100/70 text-amber-900',
      label: 'Bronze',
    },
    silver: {
      border: 'border-zinc-300',
      badgeBg: 'bg-zinc-200 text-zinc-800',
      label: 'Prata',
    },
    gold: {
      border: 'border-amber-400',
      badgeBg: 'bg-amber-400/20 text-amber-900',
      label: 'Ouro',
    },
    diamond: {
      border: 'border-cyan-300',
      badgeBg: 'bg-cyan-50 text-cyan-900',
      label: 'Diamante',
    },
  }[achievement.tier];

  return (
    <div
      id={`achievement-card-${achievement.id}`}
      onClick={() => onClick && onClick(achievement)}
      className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all ${
        achievement.unlocked
          ? 'border-zinc-200/90 shadow-sm hover:shadow-md'
          : 'border-zinc-200/50 bg-zinc-50/60 opacity-80'
      } ${onClick ? 'cursor-pointer hover:border-zinc-300' : ''} ${className}`}
    >
      <div className="flex items-start gap-3.5">
        {/* Badge Icon */}
        <div className="relative shrink-0">
          <div
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border-2 transition-transform shadow-xs ${
              achievement.unlocked
                ? `${tierStyles.badgeBg} ${tierStyles.border}`
                : 'bg-zinc-100 text-zinc-400 border-zinc-200'
            }`}
          >
            {achievement.unlocked ? (
              <IconComponent className="w-7 h-7 text-[#EA0029]" />
            ) : (
              <Lock className="w-5 h-5 text-zinc-400" />
            )}
          </div>

          {achievement.unlocked && (
            <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
              {tierStyles.label}
            </span>
            <span className="text-[11px] font-bold text-[#EA0029] bg-red-50 px-2 py-0.5 rounded">
              +{achievement.xpReward} XP
            </span>
          </div>

          <h4 className="text-sm sm:text-base font-bold text-zinc-900 leading-snug truncate">
            {achievement.title}
          </h4>

          <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-2">
            {achievement.description}
          </p>

          {/* Unlocked date or Progress Bar */}
          <div className="mt-3 pt-2.5 border-t border-zinc-100">
            {achievement.unlocked ? (
              <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                Conquistado {achievement.unlockedAt ? `• ${achievement.unlockedAt}` : ''}
              </span>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-zinc-500 font-medium">
                  <span>Progresso</span>
                  <span>{achievement.currentProgress} / {achievement.maxProgress}</span>
                </div>
                <ProgressBar
                  value={achievement.currentProgress}
                  max={achievement.maxProgress}
                  showPercentage={false}
                  color="#EA0029"
                  size="xs"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
