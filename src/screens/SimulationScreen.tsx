import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  ListOrdered,
} from 'lucide-react';
import { Question, SimulationExam, ScreenType } from '../types';
import { QuestionCard } from '../components/QuestionCard';
import { ProgressBar } from '../components/ProgressBar';

interface SimulationScreenProps {
  exams: SimulationExam[];
  questions: Question[];
  onFinishSimulation: (score: number, earnedXp: number) => void;
  onNavigate: (screen: ScreenType) => void;
}

export const SimulationScreen: React.FC<SimulationScreenProps> = ({
  exams,
  questions,
  onFinishSimulation,
  onNavigate,
}) => {
  const [selectedExam, setSelectedExam] = useState<SimulationExam | null>(null);
  const [isExamActive, setIsExamActive] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(90 * 60);
  const [isFinished, setIsFinished] = useState(false);
  const [examResult, setExamResult] = useState<{
    correctCount: number;
    total: number;
    percentage: number;
    earnedXp: number;
    projectedConceito: number;
  } | null>(null);

  // Active questions for simulation (cycles through available questions to fill exam slots)
  const examQuestions = selectedExam
    ? Array.from({ length: selectedExam.questionCount }, (_, i) => {
        const base = questions[i % questions.length];
        return {
          ...base,
          id: `sim-${selectedExam.id}-q${i + 1}`,
          code: `Questão ${i + 1} (${base.component})`,
        };
      })
    : [];

  // Countdown timer during active exam
  useEffect(() => {
    if (!isExamActive || isFinished) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isExamActive, isFinished]);

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStartExam = (exam: SimulationExam) => {
    setSelectedExam(exam);
    setIsExamActive(true);
    setCurrentQIndex(0);
    setAnswers({});
    setFlagged({});
    setSecondsRemaining(exam.durationMinutes * 60);
    setIsFinished(false);
    setExamResult(null);
  };

  const handleSelectAlternative = (alt: 'A' | 'B' | 'C' | 'D' | 'E') => {
    const currentQ = examQuestions[currentQIndex];
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: alt,
    }));
  };

  const handleToggleFlag = () => {
    const currentQ = examQuestions[currentQIndex];
    if (!currentQ) return;
    setFlagged((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
  };

  const handleFinishExam = () => {
    if (!selectedExam) return;

    let correctCount = 0;
    examQuestions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const total = examQuestions.length;
    const percentage = Math.round((correctCount / (total || 1)) * 100);
    const earnedXp = Math.round((percentage / 100) * selectedExam.xpReward) + 100;
    const projectedConceito = Math.min(5.0, Math.max(1.0, +(1.0 + (percentage / 100) * 4).toFixed(1)));

    const result = {
      correctCount,
      total,
      percentage,
      earnedXp,
      projectedConceito,
    };

    setExamResult(result);
    setIsFinished(true);
    setIsExamActive(false);
    onFinishSimulation(projectedConceito, earnedXp);
  };

  // 1. Result View when exam is finished
  if (isFinished && examResult && selectedExam) {
    return (
      <div id="simulation-result-view" className="space-y-6 max-w-3xl mx-auto pb-16">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-[#EA0029] flex items-center justify-center border border-red-100">
            <Award className="w-9 h-9" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Simulado Concluído com Sucesso!
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-2">
              Resultado: {selectedExam.title}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Desempenho apurado de acordo com os critérios de pontuação ponderada do ENADE
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-100">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/70">
              <span className="text-xs text-zinc-500 font-medium">Acertos Totais</span>
              <div className="text-2xl font-black text-zinc-900 mt-0.5">
                {examResult.correctCount} / {examResult.total}
              </div>
              <span className="text-[11px] text-zinc-500">{examResult.percentage}% de precisão</span>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/70">
              <span className="text-xs text-zinc-500 font-medium">Conceito Projetado</span>
              <div className="text-2xl font-black text-[#EA0029] mt-0.5">
                {examResult.projectedConceito} <span className="text-sm font-semibold text-zinc-500">/ 5.0</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">Padrão Mackenzie</span>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/70">
              <span className="text-xs text-zinc-500 font-medium">XP Adicionado</span>
              <div className="text-2xl font-black text-amber-600 mt-0.5 flex items-center justify-center gap-1">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>+{examResult.earnedXp}</span>
              </div>
              <span className="text-[11px] text-zinc-500">Bônus de Simulado</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setIsFinished(false);
                setSelectedExam(null);
              }}
              className="w-full sm:w-auto text-xs sm:text-sm font-bold bg-zinc-100 text-zinc-800 px-5 py-3 rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Novo Simulado
            </button>
            <button
              onClick={() => onNavigate('progress')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold bg-[#EA0029] text-white px-6 py-3 rounded-xl hover:bg-[#c90023] transition-colors cursor-pointer shadow-sm"
            >
              <span>Ver Evolução no Progresso</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Exam Screen
  if (isExamActive && selectedExam) {
    const currentQ = examQuestions[currentQIndex];
    const answeredCount = Object.keys(answers).length;
    const isCurrentFlagged = currentQ ? !!flagged[currentQ.id] : false;
    const currentSelected = currentQ ? answers[currentQ.id] || null : null;

    return (
      <div id="active-simulation-exam" className="space-y-4 max-w-5xl mx-auto pb-24">
        {/* Simulation Control Bar */}
        <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#EA0029] flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-zinc-900 leading-tight">
                {selectedExam.title}
              </h2>
              <p className="text-[11px] text-zinc-500">
                Questão {currentQIndex + 1} de {selectedExam.questionCount} • {answeredCount} respondidas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Clock */}
            <div
              className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-xl border ${
                secondsRemaining < 600
                  ? 'bg-red-50 text-[#EA0029] border-red-300 animate-pulse'
                  : 'bg-zinc-50 text-zinc-800 border-zinc-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            <button
              id="finish-exam-btn"
              onClick={() => {
                if (window.confirm(`Você respondeu ${answeredCount} de ${selectedExam.questionCount} questões. Deseja finalizar e entregar o simulado agora?`)) {
                  handleFinishExam();
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-zinc-900 text-white px-3.5 py-2 rounded-xl hover:bg-zinc-800 cursor-pointer transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Entregar Simulado</span>
            </button>
          </div>
        </div>

        {/* Question Grid Navigator (Bubble palette) */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2 text-xs font-semibold text-zinc-600">
            <span className="flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-[#EA0029]" />
              Grade de Navegação de Questões
            </span>
            <div className="flex items-center gap-3 text-[11px] font-normal text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EA0029]"></span> Respondida
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Marcada
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-200"></span> Pendente
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
            {examQuestions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isFlag = !!flagged[q.id];
              const isCurrent = idx === currentQIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQIndex(idx)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer relative ${
                    isCurrent
                      ? 'ring-2 ring-zinc-900 ring-offset-1 font-black'
                      : ''
                  } ${
                    isAnswered
                      ? 'bg-[#EA0029] text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  <span>{idx + 1}</span>
                  {isFlag && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-1 ring-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Question */}
        {currentQ && (
          <QuestionCard
            question={currentQ}
            selectedAlternative={currentSelected}
            onSelectAlternative={handleSelectAlternative}
            isFlagged={isCurrentFlagged}
            onToggleFlag={handleToggleFlag}
          />
        )}

        {/* Navigation Step Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            disabled={currentQIndex === 0}
            onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Questão Anterior</span>
          </button>

          <button
            disabled={currentQIndex === examQuestions.length - 1}
            onClick={() => setCurrentQIndex((prev) => Math.min(examQuestions.length - 1, prev + 1))}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <span>Próxima Questão</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 3. Selection / Catalog of Simulation Exams
  return (
    <div id="simulation-catalog-screen" className="space-y-6 pb-16">
      {/* Header */}
      <section
        id="simulation-header-card"
        className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-50/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="max-w-3xl relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-[#EA0029] text-white px-3 py-1 rounded-full uppercase tracking-wider">
              Simulado Oficial ENADE
            </span>
            <span className="text-xs text-zinc-500 font-medium">
              Cronômetro Regressivo & Gabarito Ponderado
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Ambiente de Simulação de Prova
          </h1>

          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
            Treine em condições reais de exame. Teste seu gerenciamento de tempo, capacidade de concentração prolongada e resolução do caderno integrado com componentes gerais e específicos.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-zinc-600 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#EA0029]" />
              Questões calibradas pelo INEP
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#EA0029]" />
              Tempo limite cronometrado
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Projeção de Conceito ENADE (1 a 5)
            </span>
          </div>
        </div>
      </section>

      {/* Available Exams Grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
          Cadernos de Prova Disponíveis
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded uppercase tracking-wider">
                    {exam.yearReference}
                  </span>
                  <span className="text-xs font-bold text-[#EA0029] bg-red-50 px-2 py-0.5 rounded">
                    +{exam.xpReward} XP
                  </span>
                </div>

                <h3 className="text-base font-bold text-zinc-900 leading-snug">
                  {exam.title}
                </h3>

                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                  {exam.description}
                </p>

                <div className="mt-4 pt-3 border-t border-zinc-100 grid grid-cols-2 gap-2 text-xs text-zinc-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{exam.durationMinutes} minutos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ListOrdered className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{exam.questionCount} questões</span>
                  </div>
                </div>
              </div>

              <button
                id={`start-exam-btn-${exam.id}`}
                onClick={() => handleStartExam(exam)}
                className="w-full inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold bg-[#EA0029] text-white py-3 px-4 rounded-xl hover:bg-[#c90023] transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <span>Iniciar Simulado Agora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
