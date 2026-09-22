import React from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { Student, Competency, ScreenType } from '../types';
import { ProgressBar } from '../components/ProgressBar';
import { CompetencyCard } from '../components/CompetencyCard';

interface ProgressScreenProps {
  student: Student;
  competencies: Competency[];
  onNavigate: (screen: ScreenType, params?: { questionId?: string }) => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  student,
  competencies,
  onNavigate,
}) => {
  const accuracyRate = Math.round((student.correctAnswers / (student.questionsAnswered || 1)) * 100);

  const generalCompetencies = competencies.filter((c) => c.area === 'Formação Geral');
  const specificCompetencies = competencies.filter((c) => c.area === 'Componente Específico');

  const avgGeneral = Math.round(
    generalCompetencies.reduce((acc, c) => acc + c.performancePercentage, 0) / (generalCompetencies.length || 1)
  );

  const avgSpecific = Math.round(
    specificCompetencies.reduce((acc, c) => acc + c.performancePercentage, 0) / (specificCompetencies.length || 1)
  );

  return (
    <div id="student-progress-screen" className="space-y-6 pb-16">
      {/* Top Banner */}
      <section
        id="progress-overview-card"
        className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-50/50 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#EA0029] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100 uppercase tracking-wider">
                Relatório de Desempenho
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                Matriz de Habilidades UPM • ENADE 2024
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Evolução e Prontidão Acadêmica
            </h1>

            <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed">
              Diagnóstico contínuo baseado nas resoluções comentadas e simulados cronometrados. Veja sua projeção de Conceito ENADE e os tópicos prioritários para estudo.
            </p>
          </div>

          {/* Projected Conceito ENADE Box */}
          <div className="bg-zinc-900 text-white rounded-2xl p-5 border border-zinc-800 text-center shrink-0 min-w-[200px] shadow-sm">
            <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider block">
              Conceito Projetado
            </span>
            <div className="text-4xl font-black text-white tracking-tight my-1">
              <span className="text-[#EA0029]">{student.estimatedScore}</span>
              <span className="text-zinc-500 text-2xl font-bold"> / 5.0</span>
            </div>
            <span className="inline-block text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              Faixa de Excelência Mackenzie
            </span>
          </div>
        </div>
      </section>

      {/* Analytics Statistics Row */}
      <section id="progress-stats-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 text-zinc-500 text-xs font-semibold mb-1">
            <TrendingUp className="w-4 h-4 text-[#EA0029]" />
            <span>Prontidão Global</span>
          </div>
          <div className="text-2xl font-black text-zinc-900">{student.enadePreparationPercentage}%</div>
          <p className="text-[11px] text-zinc-400 mt-1">Meta recomendada: &gt;75%</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 text-zinc-500 text-xs font-semibold mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Taxa de Acerto</span>
          </div>
          <div className="text-2xl font-black text-zinc-900">{accuracyRate}%</div>
          <p className="text-[11px] text-zinc-400 mt-1">{student.correctAnswers} de {student.questionsAnswered} corretas</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 text-zinc-500 text-xs font-semibold mb-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Tempo Médio</span>
          </div>
          <div className="text-2xl font-black text-zinc-900">02:45 min</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">15s abaixo do teto INEP</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 text-zinc-500 text-xs font-semibold mb-1">
            <FileCheck2 className="w-4 h-4 text-purple-600" />
            <span>Simulados Feitos</span>
          </div>
          <div className="text-2xl font-black text-zinc-900">{student.simulatedExamsCompleted}</div>
          <p className="text-[11px] text-zinc-400 mt-1">Cadernos completos</p>
        </div>
      </section>

      {/* Component Comparison Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Formação Geral */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/80 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                Componente Comum (25% da Nota)
              </span>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 mt-1.5">
                Formação Geral
              </h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-blue-700">{avgGeneral}%</span>
              <span className="text-[10px] block text-zinc-400">aproveitamento</span>
            </div>
          </div>

          <ProgressBar
            value={avgGeneral}
            max={100}
            showPercentage={false}
            color="#2563eb"
            size="sm"
          />

          <div className="text-xs text-zinc-500 space-y-1">
            <p>• Avalia ética profissional, cidadania, sustentabilidade e direitos humanos.</p>
            <p>• 10 questões no caderno oficial do ENADE.</p>
          </div>
        </div>

        {/* Componente Específico */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/80 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-red-50 text-[#EA0029] px-2.5 py-0.5 rounded-full border border-red-200">
                Componente do Curso (75% da Nota)
              </span>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 mt-1.5">
                Componente Específico ({student.course})
              </h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#EA0029]">{avgSpecific}%</span>
              <span className="text-[10px] block text-zinc-400">aproveitamento</span>
            </div>
          </div>

          <ProgressBar
            value={avgSpecific}
            max={100}
            showPercentage={false}
            color="#EA0029"
            size="sm"
          />

          <div className="text-xs text-zinc-500 space-y-1">
            <p>• Avalia fundamentos técnicos, projetos práticos e resolução de problemas reais.</p>
            <p>• 30 questões no caderno oficial do ENADE.</p>
          </div>
        </div>
      </section>

      {/* Competencies Breakdown */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
            Detalhamento de Todas as Competências
          </h2>
          <button
            onClick={() => onNavigate('question')}
            className="text-xs font-bold text-[#EA0029] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Praticar Questões</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competencies.map((comp) => (
            <CompetencyCard
              key={comp.id}
              competency={comp}
              onTrain={() => onNavigate('question')}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
