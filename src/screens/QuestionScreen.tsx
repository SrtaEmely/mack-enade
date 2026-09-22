import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  Send,
  HelpCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Zap,
  RotateCcw,
  LayoutDashboard,
  Lightbulb,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Question, ScreenType } from '../types';
import { QuestionCard } from '../components/QuestionCard';
import { ProgressBar } from '../components/ProgressBar';

interface QuestionScreenProps {
  question: Question;
  allQuestions: Question[];
  currentQuestionIndex: number;
  onSelectIndex: (index: number) => void;
  onSubmitAnswer: (questionId: string, alternative: 'A' | 'B' | 'C' | 'D' | 'E') => void;
  onNavigate: (screen: ScreenType) => void;
  mode?: 'mission' | 'practice' | 'simulation';
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  allQuestions,
  currentQuestionIndex,
  onSelectIndex,
  onSubmitAnswer,
  onNavigate,
  mode = 'practice',
}) => {
  const [selectedAlternative, setSelectedAlternative] = useState<'A' | 'B' | 'C' | 'D' | 'E' | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isExplanationRevealed, setIsExplanationRevealed] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Per-question history cache so previous answers are preserved if student navigates
  const [answeredMap, setAnsweredMap] = useState<
    Record<string, { alternative: 'A' | 'B' | 'C' | 'D' | 'E'; revealed: boolean }>
  >({});

  // Reset or load question state when question ID changes
  useEffect(() => {
    const existing = answeredMap[question.id];
    if (existing) {
      setSelectedAlternative(existing.alternative);
      setHasSubmitted(true);
      setIsExplanationRevealed(existing.revealed);
    } else {
      setSelectedAlternative(null);
      setHasSubmitted(false);
      setIsExplanationRevealed(false);
    }

    setIsFlagged(false);
    setSecondsElapsed(0);

    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [question.id]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirmAnswer = () => {
    if (!selectedAlternative || hasSubmitted) return;

    setHasSubmitted(true);
    // Remember: explanation remains HIDDEN until user clicks "Understand the solution"
    setIsExplanationRevealed(false);

    setAnsweredMap((prev) => ({
      ...prev,
      [question.id]: {
        alternative: selectedAlternative,
        revealed: false,
      },
    }));

    // Notify app state to record mock student results & update dashboard
    onSubmitAnswer(question.id, selectedAlternative);
  };

  const handleRevealSolution = () => {
    setIsExplanationRevealed(true);
    if (selectedAlternative) {
      setAnsweredMap((prev) => ({
        ...prev,
        [question.id]: {
          alternative: selectedAlternative,
          revealed: true,
        },
      }));
    }
  };

  const handleRetryQuestion = () => {
    setHasSubmitted(false);
    setIsExplanationRevealed(false);
    setSelectedAlternative(null);
    setAnsweredMap((prev) => {
      const copy = { ...prev };
      delete copy[question.id];
      return copy;
    });
  };

  const hasNextQuestion = currentQuestionIndex < allQuestions.length - 1;

  return (
    <div id="question-exam-screen" className="space-y-5 pb-28 max-w-4xl mx-auto">
      {/* Question Header Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2.5 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer border border-zinc-200/60"
            title="Voltar ao Painel"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-zinc-900">
                Questão {currentQuestionIndex + 1} de {allQuestions.length}
              </h2>
              <span className="text-[11px] font-bold text-[#EA0029] bg-red-50 px-2 py-0.5 rounded border border-red-100">
                +50 XP
              </span>
              {hasSubmitted && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    selectedAlternative === question.correctAnswer
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selectedAlternative === question.correctAnswer ? 'Acerto' : 'Erro'}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              Meta ENADE: ~03:00 por questão • {question.area}
            </p>
          </div>
        </div>

        {/* Live Timer and Navigation Buttons */}
        <div className="flex items-center gap-3">
          <div
            id="question-timer-badge"
            className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-xl border ${
              secondsElapsed > 180
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-zinc-50 text-zinc-700 border-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{formatTimer(secondsElapsed)}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => onSelectIndex(currentQuestionIndex - 1)}
              className="p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Questão anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentQuestionIndex === allQuestions.length - 1}
              onClick={() => onSelectIndex(currentQuestionIndex + 1)}
              className="p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Próxima questão"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar of Question Set */}
      <ProgressBar
        value={currentQuestionIndex + 1}
        max={allQuestions.length}
        showPercentage={false}
        color="#EA0029"
        size="xs"
      />

      {/* Main Question Card with Full Question Engine Data & Reveal Logic */}
      <QuestionCard
        question={question}
        selectedAlternative={selectedAlternative}
        onSelectAlternative={(alt) => {
          if (!hasSubmitted) {
            setSelectedAlternative(alt);
          }
        }}
        isFlagged={isFlagged}
        onToggleFlag={() => setIsFlagged(!isFlagged)}
        hasSubmitted={hasSubmitted}
        isExplanationRevealed={isExplanationRevealed}
        onRevealExplanation={handleRevealSolution}
      />

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-3.5 sm:p-4 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status message */}
          <div className="text-xs text-zinc-600 w-full sm:w-auto text-center sm:text-left">
            {!hasSubmitted ? (
              selectedAlternative ? (
                <span>
                  Alternativa selecionada:{' '}
                  <strong className="text-[#EA0029] font-black text-sm">({selectedAlternative})</strong>.
                  Pronto para enviar.
                </span>
              ) : (
                <span className="text-zinc-500">
                  Selecione uma alternativa (A, B, C, D ou E) para enviar sua resposta.
                </span>
              )
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span
                  className={`font-bold ${
                    selectedAlternative === question.correctAnswer ? 'text-emerald-700' : 'text-[#EA0029]'
                  }`}
                >
                  {selectedAlternative === question.correctAnswer
                    ? '✓ Resposta Correta (+50 XP)'
                    : '✕ Resposta Incorreta (+15 XP)'}
                </span>
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-500">
                  {isExplanationRevealed
                    ? 'Resolução e análise pedagógica desbloqueadas'
                    : 'A resolução está oculta. Clique em "Understand the solution" para ver a explicação.'}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!hasSubmitted ? (
              <button
                type="button"
                id="submit-answer-btn"
                disabled={!selectedAlternative}
                onClick={handleConfirmAnswer}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-sm ${
                  selectedAlternative
                    ? 'bg-[#EA0029] text-white hover:bg-[#c90023] active:scale-[0.98] cursor-pointer'
                    : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Responder & Enviar</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                {/* Reveal button if not yet revealed */}
                {!isExplanationRevealed && (
                  <button
                    type="button"
                    id="understand-solution-footer-btn"
                    onClick={handleRevealSolution}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-black bg-[#EA0029] text-white px-4 py-2.5 rounded-xl hover:bg-[#c90023] transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>Understand the solution</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRetryQuestion}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-3.5 py-2.5 rounded-xl border border-zinc-200 transition-colors cursor-pointer"
                  title="Tentar responder novamente"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Refazer</span>
                </button>

                {hasNextQuestion ? (
                  <button
                    type="button"
                    id="next-question-footer-btn"
                    onClick={() => onSelectIndex(currentQuestionIndex + 1)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold bg-zinc-900 text-white px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <span>Próxima</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    id="view-dashboard-footer-btn"
                    onClick={() => onNavigate('dashboard')}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold bg-zinc-900 text-white px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Voltar ao Painel</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
