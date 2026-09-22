import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Search,
  Filter,
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Flame,
  Zap,
} from 'lucide-react';
import { ClassStudentProgress, CompetencyPerformance } from '../types';
import { initialClassStudents, initialCompetencies } from '../data/mockData';

export const ProfessorClassPerformanceScreen: React.FC = () => {
  const [students, setStudents] = useState<ClassStudentProgress[]>(initialClassStudents);
  const [competencies, setCompetencies] = useState<CompetencyPerformance[]>(initialCompetencies);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'destaque' | 'no-ritmo' | 'atencao'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchJsonSafe = async (url: string) => {
          try {
            const res = await fetch(url);
            const ct = res.headers.get('content-type');
            if (res.ok && ct && ct.includes('application/json')) {
              return await res.json();
            }
            return null;
          } catch {
            return null;
          }
        };

        const [sData, cData] = await Promise.all([
          fetchJsonSafe('/api/professor/class-progress'),
          fetchJsonSafe('/api/competencies'),
        ]);
        if (sData) setStudents(sData);
        if (cData) setCompetencies(cData);
      } catch (err) {
        console.warn('Using default class performance data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredStudents = students.filter((st) => {
    if (statusFilter !== 'all') {
      const normalized = st.status.toLowerCase().replace(/\s+/g, '-');
      if (statusFilter === 'destaque' && !normalized.includes('destaque')) return false;
      if (statusFilter === 'no-ritmo' && !normalized.includes('ritmo')) return false;
      if (statusFilter === 'atencao' && !normalized.includes('apoio') && !normalized.includes('atencao')) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return st.name.toLowerCase().includes(q) || st.ra.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-[#EA0029] border border-red-200">
                Diagnóstico de Turma
              </span>
              <span className="text-xs font-semibold text-zinc-500">
                Ciência da Computação • 8º Semestre
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Desempenho da Turma por Competência
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-2xl leading-relaxed">
              Mapeamento do nível de proficiência em cada descritor das Diretrizes Curriculares do ENADE e acompanhamento individualizado dos alunos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-2xl border border-red-100 text-center">
              <span className="text-[10px] font-extrabold uppercase text-[#EA0029] block">
                Conceito Turma
              </span>
              <span className="text-2xl font-extrabold text-[#EA0029]">4.1</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 text-center">
              <span className="text-[10px] font-extrabold uppercase text-zinc-500 block">
                Alunos Monitorados
              </span>
              <span className="text-2xl font-extrabold text-zinc-900">142</span>
            </div>
          </div>
        </div>
      </div>

      {/* Competency Level Performance Cards */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-zinc-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">
              Desempenho por Competência ENADE (Média da Turma)
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Percentual ponderado de acerto nos simulados institucionais
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
            Meta: &gt; 70% em todas as áreas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {competencies.map((comp) => {
            const isAttention = comp.performancePercentage < 65;
            const isHigh = comp.performancePercentage >= 78;

            return (
              <div
                key={comp.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isAttention
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-zinc-200/80 bg-zinc-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-zinc-400">
                      {comp.area}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900 leading-snug">
                      {comp.name}
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-base font-extrabold ${
                        isAttention
                          ? 'text-[#EA0029]'
                          : isHigh
                          ? 'text-emerald-600'
                          : 'text-zinc-800'
                      }`}
                    >
                      {comp.performancePercentage}%
                    </span>
                    <p className="text-[10px] text-zinc-400">
                      {comp.questionsResolved} resolvidas
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full ${
                      isAttention
                        ? 'bg-[#EA0029]'
                        : isHigh
                        ? 'bg-emerald-600'
                        : 'bg-zinc-700'
                    }`}
                    style={{ width: `${comp.performancePercentage}%` }}
                  />
                </div>

                {isAttention && (
                  <div className="mt-2 text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-[#EA0029]" />
                    <span>Recomendado aplicar simulado específico sobre este tema.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Student Roster */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-zinc-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">
              Quadro Individual de Alunos
            </h3>
            <p className="text-xs text-zinc-500">
              Acompanhamento de XP, taxa de acerto e conceito projetado
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome ou RA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-1 focus:ring-[#EA0029]"
              />
            </div>

            <div className="flex items-center gap-1">
              {(['all', 'destaque', 'no-ritmo', 'atencao'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold capitalize transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {st === 'all'
                    ? 'Todos'
                    : st === 'destaque'
                    ? 'Destaques'
                    : st === 'no-ritmo'
                    ? 'No Ritmo'
                    : 'Atenção'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-400 uppercase font-bold text-[10px]">
                <th className="pb-3 font-extrabold">Estudante</th>
                <th className="pb-3 font-extrabold">Nível & XP</th>
                <th className="pb-3 font-extrabold">Questões</th>
                <th className="pb-3 font-extrabold">Taxa Acerto</th>
                <th className="pb-3 font-extrabold">Ofensiva</th>
                <th className="pb-3 font-extrabold">Conceito Proj.</th>
                <th className="pb-3 font-extrabold">Competência Fraca</th>
                <th className="pb-3 font-extrabold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredStudents.map((st) => {
                const isDestaque = st.status.toLowerCase().includes('destaque');
                const isNoRitmo = st.status.toLowerCase().includes('ritmo');

                return (
                  <tr key={st.id || st.studentId || st.ra} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3.5">
                      <div>
                        <p className="font-bold text-zinc-900">{st.name}</p>
                        <p className="text-[11px] text-zinc-400">RA: {st.ra}</p>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-zinc-800">Nv {st.level}</span>
                        <span className="text-[11px] text-amber-600 font-semibold">({st.xp} XP)</span>
                      </div>
                    </td>
                    <td className="py-3.5 font-medium text-zinc-700">
                      {st.questionsAnswered} resolvidas
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`font-bold ${
                          st.accuracy >= 80
                            ? 'text-emerald-600'
                            : st.accuracy >= 65
                            ? 'text-zinc-800'
                            : 'text-[#EA0029]'
                        }`}
                      >
                        {st.accuracy}%
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 font-bold text-orange-600">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{st.streak}d</span>
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="font-extrabold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md">
                        {st.estimatedScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3.5 text-zinc-500 text-[11px]">
                      {st.weakestCompetency}
                    </td>
                    <td className="py-3.5 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isDestaque
                            ? 'bg-emerald-100 text-emerald-800'
                            : isNoRitmo
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-[#EA0029]'
                        }`}
                      >
                        {isDestaque
                          ? 'Destaque'
                          : isNoRitmo
                          ? 'No Ritmo'
                          : 'Apoio Urgente'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
