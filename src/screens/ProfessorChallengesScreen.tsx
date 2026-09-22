import React, { useState, useEffect } from 'react';
import {
  Swords,
  Flame,
  Trophy,
  PlusCircle,
  CheckCircle2,
  Users,
  Target,
  Sparkles,
  Shield,
  Zap,
  Calendar,
  Award,
} from 'lucide-react';
import { BossBattle, MentorChallenge, Professor } from '../types';
import { initialBossBattle, initialMentorChallenges } from '../data/mockData';
import { BossBattleWidget } from '../components/BossBattleWidget';

interface ProfessorChallengesScreenProps {
  professor: Professor;
}

export const ProfessorChallengesScreen: React.FC<ProfessorChallengesScreenProps> = ({ professor }) => {
  const [bossBattle, setBossBattle] = useState<BossBattle | null>(initialBossBattle);
  const [challenges, setChallenges] = useState<MentorChallenge[]>(initialMentorChallenges);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCompetency, setNewCompetency] = useState('Bancos de Dados e Consistência de Dados');
  const [newTarget, setNewTarget] = useState(15);
  const [newXp, setNewXp] = useState(300);
  const [newBadge, setNewBadge] = useState('Mestre dos Índices B');

  const loadData = async () => {
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

      const [bData, cData] = await Promise.all([
        fetchJsonSafe('/api/professor/boss-battle'),
        fetchJsonSafe('/api/professor/mentor-challenges'),
      ]);
      if (bData) setBossBattle(bData);
      if (cData) setChallenges(cData);
    } catch (err) {
      console.warn('Using default challenges data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    try {
      const res = await fetch('/api/professor/mentor-challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          competency: newCompetency,
          targetQuestionCount: newTarget,
          xpReward: newXp,
          badgeReward: newBadge,
          deadlineDays: 7,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setChallenges((prev) => [created, ...prev]);
        setIsCreatingChallenge(false);
        setNewTitle('');
        setNewDesc('');
      }
    } catch (err) {
      console.error('Error creating challenge:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-[#EA0029] border border-red-200">
                Gamificação Pedagógica
              </span>
              <span className="text-xs font-semibold text-zinc-500">
                Engajamento Coletivo Mackenzie
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Desafios do Mentor & Batalhas de Chefe
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-2xl leading-relaxed">
              Crie incentivos lúdicos com prazos, recompensas em XP e medalhas temáticas da UPM para impulsionar a preparação dos alunos.
            </p>
          </div>

          <button
            onClick={() => setIsCreatingChallenge(!isCreatingChallenge)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#EA0029] text-white text-xs font-bold hover:bg-[#c90023] transition-colors cursor-pointer shadow-xs self-start lg:self-center"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Criar Novo Desafio do Mentor</span>
          </button>
        </div>
      </div>

      {/* Boss Battle Widget */}
      {bossBattle && (
        <BossBattleWidget
          battle={bossBattle}
          isProfessorView={true}
        />
      )}

      {/* Form: Create New Mentor Challenge */}
      {isCreatingChallenge && (
        <form
          onSubmit={handleCreateChallenge}
          className="p-6 sm:p-8 rounded-3xl bg-white border border-zinc-200/90 shadow-sm space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-[#EA0029] uppercase">
            <Target className="w-4 h-4" />
            <span>Lançar Nova Missão de Turma</span>
          </div>
          <h3 className="text-lg font-extrabold text-zinc-900">Configurar Desafio do Mentor</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Título do Desafio</label>
              <input
                type="text"
                required
                placeholder="Ex: Maratona de Bancos de Dados ACID"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-[#EA0029] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Competência Foco</label>
              <select
                value={newCompetency}
                onChange={(e) => setNewCompetency(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-zinc-50"
              >
                <option value="Algoritmos e Estruturas de Dados">Algoritmos e Estruturas de Dados</option>
                <option value="Bancos de Dados e Consistência de Dados">Bancos de Dados e Consistência de Dados</option>
                <option value="Engenharia de Software e Métodos Ágeis">Engenharia de Software e Métodos Ágeis</option>
                <option value="Sistemas Operacionais e Redes">Sistemas Operacionais e Redes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Descrição Pedagógica</label>
            <textarea
              rows={2}
              required
              placeholder="Instrua os alunos sobre o objetivo de estudo deste desafio..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-[#EA0029] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Meta de Questões</label>
              <input
                type="number"
                min={5}
                max={50}
                value={newTarget}
                onChange={(e) => setNewTarget(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Bônus de XP</label>
              <input
                type="number"
                min={50}
                max={2000}
                step={50}
                value={newXp}
                onChange={(e) => setNewXp(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Nome da Medalha</label>
              <input
                type="text"
                value={newBadge}
                onChange={(e) => setNewBadge(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreatingChallenge(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#EA0029] text-white text-xs font-bold hover:bg-[#c90023]"
            >
              Lançar Desafio para a Turma
            </button>
          </div>
        </form>
      )}

      {/* Active Mentor Challenges List */}
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">
          Desafios Ativos da Turma ({challenges.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((c) => {
            const completed = c.completedCount ?? Math.round(((c.completionRate || 0) / 100) * (c.participantsCount || c.enrolledStudents || 100));
            const total = c.participantsCount || c.enrolledStudents || 100;
            const completionPct = c.completionRate ?? Math.round((completed / Math.max(1, total)) * 100);

            return (
              <div
                key={c.id}
                className="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-2xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-[#EA0029] border border-red-200">
                      {c.competency}
                    </span>
                    <span className="text-xs font-bold text-zinc-400">
                      {c.deadlineDays ? `Prazo: ${c.deadlineDays} dias` : c.deadline}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-zinc-900 leading-snug">{c.title}</h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">{c.description}</p>
                </div>

                {/* Progress bar of participants */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-medium">Adesão dos Estudantes:</span>
                    <span className="font-bold text-zinc-900">
                      {completed} de {total} concluíram ({completionPct}%)
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-[#EA0029] rounded-full"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>

                {/* Reward info */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                    <Zap className="w-4 h-4 fill-current" />
                    <span>+{c.xpReward} XP</span>
                  </div>

                  <div className="flex items-center gap-1 text-zinc-600 font-semibold">
                    <Trophy className="w-3.5 h-3.5 text-[#EA0029]" />
                    <span>Medalha: {c.badgeReward}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
