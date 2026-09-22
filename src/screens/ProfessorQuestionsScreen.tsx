import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Sparkles,
  Clock,
  Eye,
  Trash2,
  FileCheck2,
  Check,
  Edit3,
  X,
  Share2,
} from 'lucide-react';
import { Question, QuestionAnalytics, AreaType, Professor } from '../types';
import { sampleQuestions } from '../data/mockData';
import { CreateQuestionWorkflow } from '../components/CreateQuestionWorkflow';

interface ProfessorQuestionsScreenProps {
  course?: string;
  professor?: Professor;
  onQuestionCreated?: (question: Question) => void;
}

export const ProfessorQuestionsScreen: React.FC<ProfessorQuestionsScreenProps> = ({
  course = 'Ciência da Computação',
  professor,
  onQuestionCreated,
}) => {
  const [questions, setQuestions] = useState<Question[]>(sampleQuestions);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedQuestionForAnalytics, setSelectedQuestionForAnalytics] = useState<Question | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [competencyFilter, setCompetencyFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/questions?includeDrafts=true');
      const ct = res.headers.get('content-type');
      if (res.ok && ct && ct.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setQuestions(data);
        }
      }
    } catch (err) {
      console.warn('Using default questions data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleApproveDraft = async (qId: string) => {
    try {
      const res = await fetch(`/api/professor/questions/${qId}/approve`, {
        method: 'PATCH',
      });
      if (res.ok) {
        const data = await res.json();
        const updated: Question = data.question || data;
        setQuestions((prev) => prev.map((q) => (q.id === qId ? updated : q)));
      }
    } catch (err) {
      console.error('Error approving question:', err);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    if (competencyFilter !== 'all' && q.competency !== competencyFilter) return false;
    if (searchQuery.trim()) {
      const qText = (q.statement + q.topic + q.competency).toLowerCase();
      if (!qText.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  const draftCount = questions.filter((q) => q.status === 'draft').length;
  const publishedCount = questions.filter((q) => q.status === 'published').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-[#EA0029] border border-red-200">
                Banco de Questões ENADE
              </span>
              <span className="text-xs font-semibold text-zinc-500">{course}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Gestão de Questões & Criação Ágil
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-2xl leading-relaxed">
              Crie novas questões em menos de 2 minutos (manual, IA, colagem ou arquivo) e monitore o índice de acerto e distratores de cada item.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#EA0029] text-white text-xs font-bold hover:bg-[#c90023] transition-colors cursor-pointer shadow-sm active:scale-95 self-start lg:self-center"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Criar Nova Questão (&lt; 2 min)</span>
          </button>
        </div>
      </div>

      {/* Creation Workflow Modal/Inline */}
      {isCreating && (
        <CreateQuestionWorkflow
          defaultCourse={course}
          onQuestionCreated={(newQ) => {
            setIsCreating(false);
            setQuestions((prev) => [newQ, ...prev]);
            if (onQuestionCreated) onQuestionCreated(newQ);
          }}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {/* Draft Alert Bar if any */}
      {draftCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Você possui <strong>{draftCount} questões em rascunho</strong> (geradas com IA ou importadas). Elas só ficam disponíveis aos estudantes após a sua aprovação explícita.
            </span>
          </div>
          <button
            onClick={() => setStatusFilter('draft')}
            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors shrink-0"
          >
            Filtrar Rascunhos
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Pesquisar por enunciado, tópico ou palavra-chave..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-[#EA0029] focus:outline-none"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Todas ({questions.length})
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'published'
                ? 'bg-emerald-700 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Publicadas ({publishedCount})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'draft'
                ? 'bg-amber-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Rascunhos ({draftCount})
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.map((q) => {
          const isDraft = q.status === 'draft';

          return (
            <div
              key={q.id}
              className={`p-5 rounded-2xl bg-white border transition-all ${
                isDraft
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-zinc-200/90 hover:border-zinc-300 shadow-2xs'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide ${
                        isDraft
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isDraft ? 'Rascunho (Retida)' : 'Publicada'}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700">
                      {q.competency}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        q.difficulty === 'Fácil'
                          ? 'bg-blue-50 text-blue-700'
                          : q.difficulty === 'Médio'
                          ? 'bg-orange-50 text-orange-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {q.difficulty}
                    </span>

                    {q.authorRole === 'ai' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Gerada com IA</span>
                      </span>
                    )}
                  </div>

                  {/* Statement */}
                  <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-medium line-clamp-3">
                    {q.statement}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-1">
                    <span>Gabarito Oficial: <strong className="text-emerald-600 font-bold">{q.correctAnswer}</strong></span>
                    <span>•</span>
                    <span>Origem: {q.source}</span>
                    <span>•</span>
                    <span>{q.analytics?.attempts ?? 0} resoluções da turma</span>
                  </div>
                </div>

                {/* Question Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  {/* Analytics button */}
                  <button
                    onClick={() => setSelectedQuestionForAnalytics(q)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 text-xs font-bold hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Analytics</span>
                  </button>

                  {/* Explicit Approve Button for Drafts */}
                  {isDraft ? (
                    <button
                      onClick={() => handleApproveDraft(q.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EA0029] text-white text-xs font-bold hover:bg-[#c90023] transition-colors cursor-pointer shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aprovar Questão</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 px-2 py-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ativa</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Question Analytics Modal */}
      {selectedQuestionForAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#EA0029]" />
                <h3 className="text-base font-bold text-zinc-900">
                  Analytics da Questão: {selectedQuestionForAnalytics.topic}
                </h3>
              </div>
              <button
                onClick={() => setSelectedQuestionForAnalytics(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-center">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase">Resoluções</span>
                  <p className="text-xl font-extrabold text-zinc-900 mt-0.5">
                    {selectedQuestionForAnalytics.analytics?.attempts || 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-center">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase">Taxa de Acerto</span>
                  <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
                    {selectedQuestionForAnalytics.analytics?.accuracyRate || 0}%
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-center">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase">Gabarito</span>
                  <p className="text-xl font-extrabold text-[#EA0029] mt-0.5">
                    {selectedQuestionForAnalytics.correctAnswer}
                  </p>
                </div>
              </div>

              {/* Distractor Distribution (A, B, C, D, E) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Distribuição de Escolha dos Distratores pelos Estudantes
                </h4>
                <div className="space-y-2">
                  {(['A', 'B', 'C', 'D', 'E'] as const).map((letter) => {
                    const count = selectedQuestionForAnalytics.analytics?.distractorSelections?.[letter] ?? 0;
                    const total = selectedQuestionForAnalytics.analytics?.attempts || 1;
                    const pct = Math.round((count / total) * 100);
                    const isCorrect = selectedQuestionForAnalytics.correctAnswer === letter;

                    return (
                      <div key={letter} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="flex items-center gap-1.5">
                            <strong className={isCorrect ? 'text-emerald-700' : 'text-zinc-700'}>
                              Alternativa {letter} {isCorrect ? '(Gabarito Oficial)' : ''}
                            </strong>
                          </span>
                          <span className="text-zinc-500 font-mono">
                            {count} votos ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCorrect ? 'bg-emerald-600' : 'bg-zinc-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Common Error Description */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <span className="text-xs font-bold text-amber-900">
                  Erro Típico Mapeado pelo Docente:
                </span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {selectedQuestionForAnalytics.commonError || 'Nenhum erro típico cadastrado.'}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button
                onClick={() => setSelectedQuestionForAnalytics(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors"
              >
                Fechar Analytics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
