import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  LayoutDashboard,
  TrendingUp,
  FileText,
  Lightbulb,
  Zap,
  AlertTriangle,
  School,
  Tag,
  Calendar,
} from 'lucide-react';
import { Question, ScreenType } from '../types';

interface FeedbackScreenProps {
  question: Question;
  selectedAlternative: 'A' | 'B' | 'C' | 'D' | 'E';
  onNextQuestion: () => void;
  onRetryQuestion: () => void;
  onNavigate: (screen: ScreenType) => void;
  hasNextQuestion: boolean;
}

export const FeedbackScreen: React.FC<FeedbackScreenProps> = ({
  question,
  selectedAlternative,
  onNextQuestion,
  onRetryQuestion,
  onNavigate,
  hasNextQuestion,
}) => {
  const [isExplanationRevealed, setIsExplanationRevealed] = useState(false);
  const isCorrect = selectedAlternative === question.correctAnswer;
  const xpEarned = isCorrect ? 50 : 15;

  return (
    <div id="question-feedback-screen" className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Result Outcome Hero Banner */}
      <section
        id="feedback-outcome-banner"
        className={`rounded-3xl p-6 sm:p-8 border shadow-sm relative overflow-hidden text-white transition-all ${
          isCorrect
            ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 border-emerald-500'
            : 'bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                isCorrect ? 'bg-white text-emerald-600' : 'bg-red-500 text-white'
              }`}
            >
              {isCorrect ? (
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              ) : (
                <XCircle className="w-8 h-8 stroke-[2.5]" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-black/20 px-2.5 py-0.5 rounded-full">
                  {isCorrect ? 'Resposta Correta!' : 'Quase lá!'}
                </span>
                <span className="text-xs text-white/80">
                  {question.source} • {question.year}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {isCorrect ? 'Excelente raciocínio!' : 'Revise o conceito abaixo'}
              </h1>

              <p className="text-xs sm:text-sm text-white/90 max-w-xl">
                {isCorrect
                  ? 'Você dominou a competência avaliada nesta questão oficial do ENADE.'
                  : 'O erro faz parte da preparação. Analise a justificativa pedagógica para fixar o aprendizado.'}
              </p>
            </div>
          </div>

          {/* XP Reward Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center sm:text-right shrink-0">
            <span className="text-[11px] font-semibold text-white/80 uppercase block">
              Recompensa
            </span>
            <div className="flex items-center justify-center sm:justify-end gap-1.5 text-2xl font-black text-amber-300">
              <Zap className="w-6 h-6 fill-current" />
              <span>+{xpEarned} XP</span>
            </div>
            <span className="text-[10px] text-white/70 block mt-0.5">
              {isCorrect ? 'Acerto Pleno' : 'Esforço computado'}
            </span>
          </div>
        </div>
      </section>

      {/* Official Answer Key Summary Card */}
      <section
        id="answer-key-summary"
        className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-700">Sua escolha:</span>
            <span
              className={`font-black px-2.5 py-1 rounded-md text-sm ${
                isCorrect
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-[#EA0029]'
              }`}
            >
              Alternativa ({selectedAlternative})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-700">Gabarito Oficial INEP:</span>
            <span className="font-black px-2.5 py-1 rounded-md bg-zinc-900 text-white text-sm">
              Alternativa ({question.correctAnswer})
            </span>
          </div>

          <div className="flex items-center gap-1 text-zinc-500 font-medium">
            <FileText className="w-3.5 h-3.5 text-[#EA0029]" />
            <span>{question.competency}</span>
          </div>
        </div>

        {/* Course and topic labels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/60">
            <School className="w-4 h-4 text-[#EA0029] shrink-0" />
            <span>Curso: <strong className="text-zinc-800">{question.course}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/60">
            <Tag className="w-4 h-4 text-[#EA0029] shrink-0" />
            <span>Tópico: <strong className="text-zinc-800">{question.topic}</strong></span>
          </div>
        </div>

        {/* Highlight of the correct alternative text */}
        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
            Alternativa Correta ({question.correctAnswer}):
          </div>
          <p className="text-sm font-semibold text-zinc-900 leading-relaxed">
            {question.alternatives.find((a) => a.id === question.correctAnswer)?.text}
          </p>
        </div>
      </section>

      {/* Pedagogical Explanation & Distractor Breakdown - HIDDEN until student clicks "Understand the solution" */}
      <section
        id="pedagogical-explanation-box"
        className="bg-white rounded-3xl p-5 sm:p-7 border border-zinc-200/80 shadow-sm space-y-4"
      >
        {!isExplanationRevealed ? (
          <div
            id="feedback-solution-hidden-callout"
            className="py-8 text-center space-y-3"
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-[#EA0029] flex items-center justify-center">
              <Lightbulb className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">
              Resolução Comentada Oculta
            </h2>
            <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
              Antes de ver a resolução oficial e o erro comum, reflita sobre seu processo decisório. Clique no botão abaixo para liberar o gabarito comentado.
            </p>
            <div className="pt-2">
              <button
                type="button"
                id="feedback-understand-solution-btn"
                onClick={() => setIsExplanationRevealed(true)}
                className="inline-flex items-center justify-center gap-2 text-sm font-black bg-[#EA0029] text-white px-7 py-3.5 rounded-2xl hover:bg-[#c90023] transition-all shadow-md cursor-pointer active:scale-95"
              >
                <Lightbulb className="w-5 h-5" />
                <span>Understand the solution</span>
              </button>
            </div>
          </div>
        ) : (
          <div id="feedback-revealed-solution-content" className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-[#EA0029] flex items-center justify-center">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                Resolução Comentada por Docentes Mackenzie
              </h2>
            </div>

            <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line space-y-2">
              {question.explanation}
            </div>

            {/* Common Error / Misconception */}
            {question.commonError && (
              <div
                id="feedback-common-error-box"
                className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-xs sm:text-sm text-amber-950 space-y-1"
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

            {/* Distractor explanations if present */}
            {question.distractorExplanations && Object.keys(question.distractorExplanations).length > 0 && (
              <div className="mt-5 pt-4 border-t border-zinc-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  Por que os outros distratores estão incorretos?
                </h3>
                <div className="space-y-2">
                  {Object.entries(question.distractorExplanations).map(([altKey, desc]) => (
                    <div key={altKey} className="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-200/60 flex items-start gap-2.5">
                      <span className="font-bold text-zinc-800 shrink-0 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                        Item ({altKey}):
                      </span>
                      <span>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Takeaway for ENADE */}
            {question.keyTakeaway && (
              <div className="mt-5 p-4 bg-red-50/60 rounded-2xl border border-red-100 text-xs sm:text-sm text-zinc-800 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#EA0029] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#EA0029] font-bold block mb-0.5">
                    Ponto-Chave para o ENADE:
                  </strong>
                  <p className="leading-relaxed text-zinc-700">{question.keyTakeaway}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Navigation & Action Footer */}
      <section
        id="feedback-actions"
        className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2"
      >
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-xs font-bold text-zinc-700 bg-white px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 cursor-pointer transition-colors shadow-xs"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Painel do Aluno</span>
          </button>
          <button
            onClick={onRetryQuestion}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-xs font-bold text-zinc-700 bg-white px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 cursor-pointer transition-colors shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Refazer Questão</span>
          </button>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          {hasNextQuestion ? (
            <button
              id="next-question-btn"
              onClick={onNextQuestion}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold bg-[#EA0029] text-white px-6 py-3 rounded-xl hover:bg-[#c90023] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <span>Próxima Questão</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="finish-session-btn"
              onClick={() => onNavigate('progress')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold bg-zinc-900 text-white px-6 py-3 rounded-xl hover:bg-zinc-800 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Ver Meu Progresso Completo</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
