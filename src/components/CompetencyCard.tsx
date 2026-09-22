import React from 'react';
import { Award, AlertTriangle, CheckCircle, TrendingUp, Play } from 'lucide-react';
import { Competency } from '../types';
import { ProgressBar } from './ProgressBar';

interface CompetencyCardProps {
  competency: Competency;
  onTrain?: (competency: Competency) => void;
  className?: string;
}

export const CompetencyCard: React.FC<CompetencyCardProps> = ({
  competency,
  onTrain,
  className = '',
}) => {
  const statusConfig = {
    Excelente: {
      color: '#10b981',
      bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: CheckCircle,
    },
    Bom: {
      color: '#2563eb',
      bgBadge: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: TrendingUp,
    },
    Atenção: {
      color: '#f59e0b',
      bgBadge: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: AlertTriangle,
    },
    Crítico: {
      color: '#EA0029',
      bgBadge: 'bg-red-50 text-[#EA0029] border-red-200',
      icon: AlertTriangle,
    },
  }[competency.status] || {
    color: '#6b7280',
    bgBadge: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    icon: Award,
  };

  const StatusIcon = statusConfig.icon;

  return (
    <div
      id={`competency-card-${competency.id}`}
      className={`bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/80 shadow-sm hover:shadow-md transition-all ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                competency.area === 'Formação Geral'
                  ? 'bg-zinc-100 text-zinc-700'
                  : 'bg-red-50 text-[#EA0029]'
              }`}
            >
              {competency.area}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig.bgBadge}`}
            >
              <StatusIcon className="w-3 h-3" />
              {competency.status}
            </span>
          </div>

          <h4 className="text-sm sm:text-base font-bold text-zinc-900 leading-snug truncate" title={competency.name}>
            {competency.name}
          </h4>
        </div>

        <div className="text-right">
          <span className="text-lg font-black text-zinc-900 leading-none">
            {competency.performancePercentage}%
          </span>
          <span className="block text-[10px] text-zinc-400 font-medium">acertos</span>
        </div>
      </div>

      <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed">
        {competency.description}
      </p>

      <div className="mt-3.5 pt-3 border-t border-zinc-100">
        <ProgressBar
          value={competency.performancePercentage}
          max={100}
          showPercentage={false}
          color={statusConfig.color}
          size="xs"
        />

        <div className="flex justify-between items-center mt-2.5 text-xs">
          <span className="text-zinc-500 text-[11px]">
            <strong className="text-zinc-700 font-semibold">{competency.questionsResolved}</strong> de {competency.totalQuestions} questões resolvidas
          </span>

          {onTrain && (
            <button
              id={`train-competency-btn-${competency.id}`}
              onClick={() => onTrain(competency)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#EA0029] hover:text-[#c90023] hover:underline cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              Treinar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
