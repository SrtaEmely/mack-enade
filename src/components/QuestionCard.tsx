import React, { useState } from 'react';
import {
  Bookmark,
  EyeOff,
  Check,
  HelpCircle,
  FileText,
  CheckCircle2,
  XCircle,
  Lightbulb,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  Calendar,
  BookOpen,
  School,
} from 'lucide-react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  selectedAlternative: 'A' | 'B' | 'C' | 'D' | 'E' | null;
  onSelectAlternative: (alt: 'A' | 'B' | 'C' | 'D' | 'E') => void;
  isFlagged?: boolean;
  onToggleFlag?: () => void;
  disabled?: boolean;
  className?: string;
  hasSubmitted?: boolean;
  isExplanationRevealed?: boolean;
  onRevealExplanation?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedAlternative,
  onSelectAlternative,
  isFlagged = false,
  onToggleFlag,
  disabled = false,
  className = '',
  hasSubmitted = false,
  isExplanationRevealed = false,
  onRevealExplanation,
}) => {
  const [eliminatedAlternatives, setEliminatedAlternatives] = useState<Record<string, boolean>>({});

  const toggleEliminate = (e: React.MouseEvent, altId: string) => {
    e.stopPropagation();
    if (hasSubmitted) return;
    setEliminatedAlternatives((prev) => ({
      ...prev,
      [altId]: !prev[altId],
    }));
  };

  const isCorrect = hasSubmitted && selectedAlternative === question.correctAnswer;

  const difficultyColors = {
    Fácil: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Médio: 'bg-amber-50 text-amber-800 border-amber-200',
    Difícil: 'bg-red-50 text-[#EA0029] border-red-200',
  }[question.difficulty] || 'bg-zinc-100 text-zinc-800 border-zinc-200';

  return (
    <div
      id={`question-card-${question.id}`}
      className={`bg-white rounded-3xl p-5 sm:p-7 border border-zinc-200/90 shadow-sm space-y-6 ${className}`}
    >
      {/* Question Header & Institutional Metadata */}
      <div className="pb-4 border-b border-zinc-100 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Source & Year badge */}
            <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-wide bg-zinc-900 text-white px-3 py-1 rounded-lg">
              <Calendar className="w-3 h-3 text-[#EA0029]" />
              <span>{question.source} • {question.year}</span>
            </span>

            {/* Area Badge */}
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                question.area === 'Formação Geral'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-red-50 text-[#EA0029] border-red-200'
              }`}
            >
              {question.area}
            </span>

            {/* Difficulty Badge */}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${difficultyColors}`}>
              Nível {question.difficulty}
            </span>

            {/* Question Type Badge */}
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600">
              {question.type}
            </span>
          </div>

          {onToggleFlag && !hasSubmitted && (
            <button
              type="button"
              id={`toggle-flag-${question.id}`}
              onClick={onToggleFlag}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                isFlagged
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
              }`}
              title="Marcar questão para revisão posterior"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-500 text-amber-600' : ''}`} />
              <span>{isFlagged ? 'Marcada para Revisão' : 'Marcar para Revisão'}</span>
            </button>
          )}
        </div>

        {/* Course, Competency and Topic badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
          <div className="flex items-center gap-2 text-zinc-600 bg-zinc-50/80 px-3 py-2 rounded-xl border border-zinc-200/60">
            <School className="w-4 h-4 text-[#EA0029] shrink-0" />
            <span className="truncate">
              Curso: <strong className="text-zinc-800 font-semibold">{question.course}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-zinc-600 bg-zinc-50/80 px-3 py-2 rounded-xl border border-zinc-200/60">
            <Tag className="w-4 h-4 text-[#EA0029] shrink-0" />
            <span className="truncate">
              Tópico: <strong className="text-zinc-800 font-semibold">{question.topic}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 px-1">
          <FileText className="w-3.5 h-3.5 text-[#EA0029] shrink-0" />
          <span>Competência Avaliada: <strong className="text-zinc-800">{question.competency}</strong></span>
        </div>
      </div>

      {/* Supporting context text / case study */}
      {question.contextText && (
        <div
          id="question-context-box"
          className="p-4 sm:p-5 bg-zinc-50/90 rounded-2xl border border-zinc-200/80 text-zinc-700 text-sm sm:text-[15px] leading-relaxed relative"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-[#EA0029]" />
              Texto-Base do Exame Nacional (ENADE)
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">ID: {question.id}</span>
          </div>
          <p className="whitespace-pre-line text-zinc-800 font-serif italic">
            {question.contextText}
          </p>
        </div>
      )}

      {/* Question Statement Stem */}
      <div id="question-statement" className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Enunciado da Questão
        </h3>
        <div className="text-zinc-900 font-medium text-sm sm:text-base leading-relaxed whitespace-pre-line">
          {question.statement || question.prompt}
        </div>
      </div>

      {/* Post-Submission Immediate Result Banner */}
      {hasSubmitted && (
        <div
          id="submission-result-banner"
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isCorrect
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
              : 'bg-red-50/90 border-red-200 text-red-950'
          }`}
        >
          <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-[#EA0029] text-white'
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                ) : (
                  <XCircle className="w-6 h-6 stroke-[2.5]" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      isCorrect ? 'bg-emerald-200/80 text-emerald-900' : 'bg-red-200/80 text-red-900'
                    }`}
                  >
                    {isCorrect ? 'Resposta Correta' : 'Resposta Incorreta'}
                  </span>
                  <span className="text-xs font-bold text-zinc-600">
                    {isCorrect ? '+50 XP Computados' : '+15 XP de Esforço'}
                  </span>
                </div>
                <p className="text-sm font-semibold mt-1">
                  {isCorrect
                    ? `Parabéns! Você assinalou a alternativa (${selectedAlternative}), que é a correta.`
                    : `Você assinalou a alternativa (${selectedAlternative}). O gabarito oficial desta questão é a alternativa (${question.correctAnswer}).`}
                </p>
              </div>
            </div>

            {/* Prompt for Understand the Solution if not yet revealed */}
            {!isExplanationRevealed && onRevealExplanation && (
              <button
                type="button"
                id="understand-solution-btn"
                onClick={onRevealExplanation}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold bg-[#EA0029] text-white px-5 py-2.5 rounded-xl hover:bg-[#c90023] transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Understand the solution</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Elimination tool info notice */}
      {!hasSubmitted && (
        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
          <span>Selecione a alternativa correta:</span>
          <span className="hidden sm:inline">Dica: use o ícone de olho riscado para descartar alternativas</span>
        </div>
      )}

      {/* Alternatives List */}
      <div className="space-y-2.5">
        {question.alternatives.map((alt) => {
          const isSelected = selectedAlternative === alt.id;
          const isEliminated = !hasSubmitted && !!eliminatedAlternatives[alt.id];
          const isThisCorrect = hasSubmitted && alt.id === question.correctAnswer;
          const isThisWrongSelection = hasSubmitted && isSelected && !isCorrect;

          let cardStyle = 'border-zinc-200/90 hover:border-zinc-300 hover:bg-zinc-50/60 bg-white';
          let letterStyle = 'bg-zinc-100 text-zinc-700 group-hover:bg-zinc-200';

          if (hasSubmitted) {
            if (isThisCorrect) {
              cardStyle = 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-300 shadow-xs';
              letterStyle = 'bg-emerald-600 text-white';
            } else if (isThisWrongSelection) {
              cardStyle = 'border-red-400 bg-red-50/40 ring-1 ring-red-200';
              letterStyle = 'bg-[#EA0029] text-white';
            } else {
              cardStyle = 'border-zinc-200 bg-zinc-50/40 opacity-70';
              letterStyle = 'bg-zinc-200 text-zinc-600';
            }
          } else {
            if (isSelected) {
              cardStyle = 'border-[#EA0029] bg-red-50/20 shadow-xs ring-1 ring-red-200';
              letterStyle = 'bg-[#EA0029] text-white';
            } else if (isEliminated) {
              cardStyle = 'border-zinc-200 bg-zinc-50/80 opacity-40 hover:opacity-75';
              letterStyle = 'bg-zinc-200 text-zinc-500 line-through';
            }
          }

          return (
            <div
              key={alt.id}
              id={`alternative-${question.id}-${alt.id}`}
              onClick={() => {
                if (!disabled && !hasSubmitted && !isEliminated) {
                  onSelectAlternative(alt.id);
                }
              }}
              className={`group flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border-2 transition-all select-none ${cardStyle} ${
                hasSubmitted || disabled ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              {/* Alternative letter pill */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${letterStyle}`}
              >
                {alt.id}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pt-0.5 text-sm sm:text-[15px] leading-relaxed text-zinc-800">
                <span className={isEliminated ? 'line-through text-zinc-400' : ''}>
                  {alt.text}
                </span>

                {/* Sub-label during evaluation */}
                {hasSubmitted && (
                  <div className="mt-1 flex items-center gap-2">
                    {isThisCorrect && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                        <Check className="w-3 h-3" />
                        Gabarito Oficial INEP
                      </span>
                    )}
                    {isThisWrongSelection && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100/80 px-2 py-0.5 rounded">
                        <XCircle className="w-3 h-3" />
                        Sua Resposta
                      </span>
                    )}
                    {hasSubmitted && isSelected && isCorrect && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                        Sua Escolha Correta!
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Eliminate alternative button if not yet submitted */}
              {!hasSubmitted && !disabled && (
                <button
                  type="button"
                  id={`eliminate-alt-${alt.id}`}
                  onClick={(e) => toggleEliminate(e, alt.id)}
                  title={isEliminated ? 'Restaurar alternativa' : 'Descartar alternativa (riscar)'}
                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                    isEliminated
                      ? 'text-zinc-500 bg-zinc-200 hover:bg-zinc-300'
                      : 'text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Understand the Solution Section */}
      {hasSubmitted && (
        <div id="solution-section-container" className="pt-2">
          {!isExplanationRevealed ? (
            <div
              id="solution-hidden-callout"
              className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/90 text-center space-y-3"
            >
              <div className="flex items-center justify-center gap-2 text-zinc-800 font-bold text-sm sm:text-base">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <span>Resolução e Análise Pedagógica Ocultas</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto">
                Para consolidar seu raciocínio, clique no botão abaixo para desbloquear a resolução comentada, os erros frequentes e a análise de distratores.
              </p>
              {onRevealExplanation && (
                <button
                  type="button"
                  id="understand-solution-reveal-action"
                  onClick={onRevealExplanation}
                  className="inline-flex items-center justify-center gap-2 text-sm font-extrabold bg-[#EA0029] text-white px-6 py-3 rounded-xl hover:bg-[#c90023] transition-all shadow-sm cursor-pointer active:scale-95"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>Understand the solution</span>
                </button>
              )}
            </div>
          ) : (
            /* Revealed Detailed Solution */
            <div
              id="revealed-solution-card"
              className="bg-zinc-50/70 rounded-2xl p-5 sm:p-7 border border-zinc-200 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-zinc-200/70 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-[#EA0029] flex items-center justify-center">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-zinc-900 tracking-tight">
                    Resolução Comentada por Docentes Mackenzie
                  </h4>
                </div>

                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                  Gabarito: ({question.correctAnswer})
                </span>
              </div>

              {/* Explanation Text */}
              <div className="text-sm text-zinc-800 leading-relaxed whitespace-pre-line space-y-2">
                {question.explanation}
              </div>

              {/* Common Error / Misconception Highlight */}
              {question.commonError && (
                <div
                  id="question-common-error-box"
                  className="p-4 bg-amber-50/80 rounded-xl border border-amber-200/80 text-xs sm:text-sm text-amber-950 space-y-1"
                >
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Erro Comum dos Estudantes no ENADE (Ponto de Atenção):</span>
                  </div>
                  <p className="leading-relaxed pl-6 text-amber-900/90 font-medium">
                    {question.commonError}
                  </p>
                </div>
              )}

              {/* Distractor Explanations if present */}
              {question.distractorExplanations && Object.keys(question.distractorExplanations).length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-200/60">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Por que os outros distratores estão incorretos?
                  </h5>
                  <div className="space-y-2">
                    {Object.entries(question.distractorExplanations).map(([altKey, desc]) => (
                      <div
                        key={altKey}
                        className="text-xs text-zinc-600 bg-white p-3 rounded-xl border border-zinc-200/70 flex items-start gap-2.5"
                      >
                        <span className="font-bold text-zinc-800 shrink-0 bg-zinc-100 px-1.5 py-0.5 rounded">
                          Item ({altKey}):
                        </span>
                        <span className="leading-relaxed">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Takeaway */}
              {question.keyTakeaway && (
                <div className="p-4 bg-red-50/50 rounded-xl border border-red-100 text-xs sm:text-sm text-zinc-800 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#EA0029] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#EA0029] font-bold block mb-0.5">
                      Dica Estratégica para o ENADE:
                    </strong>
                    <p className="leading-relaxed text-zinc-700">{question.keyTakeaway}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
