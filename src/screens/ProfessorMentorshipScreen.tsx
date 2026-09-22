import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Lightbulb,
  Radio,
  PlusCircle,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  ExternalLink,
  BookOpen,
  User,
  Heart,
  Check,
  Play,
  Square,
  AlertCircle,
} from 'lucide-react';
import { StudentDoubt, ProfessorTip, MentorHourSession, Professor } from '../types';
import { initialStudentDoubts, initialProfessorTips, initialMentorHourSession } from '../data/mockData';
import { MentorHourBanner } from '../components/MentorHourBanner';

interface ProfessorMentorshipScreenProps {
  professor: Professor;
}

export const ProfessorMentorshipScreen: React.FC<ProfessorMentorshipScreenProps> = ({ professor }) => {
  const [activeTab, setActiveTab] = useState<'doubts' | 'tips' | 'mentor-hour'>('doubts');

  // Doubts State
  const [doubts, setDoubts] = useState<StudentDoubt[]>(initialStudentDoubts);
  const [selectedDoubt, setSelectedDoubt] = useState<StudentDoubt | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Tips State
  const [tips, setTips] = useState<ProfessorTip[]>(initialProfessorTips);
  const [isPublishingTip, setIsPublishingTip] = useState(false);
  const [newTipTitle, setNewTipTitle] = useState('');
  const [newTipContent, setNewTipContent] = useState('');
  const [newTipCompetency, setNewTipCompetency] = useState('Bancos de Dados e Consistência de Dados');

  // Mentor Hour State
  const [mentorHour, setMentorHour] = useState<MentorHourSession | null>(initialMentorHourSession);

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

      const [dData, tData, mData] = await Promise.all([
        fetchJsonSafe('/api/professor/doubts'),
        fetchJsonSafe('/api/professor/tips'),
        fetchJsonSafe('/api/professor/mentor-hour'),
      ]);
      if (dData) setDoubts(dData);
      if (tData) setTips(tData);
      if (mData) setMentorHour(mData);
    } catch (err) {
      console.warn('Using default mentorship data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Submit Answer to Student Doubt
  const handleSendAnswer = async (doubtId: string) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);

    try {
      const res = await fetch(`/api/professor/doubts/${doubtId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: replyText }),
      });

      if (res.ok) {
        const updated: StudentDoubt = await res.json();
        setDoubts((prev) => prev.map((d) => (d.id === doubtId ? updated : d)));
        setSelectedDoubt(null);
        setReplyText('');
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Publish New Short Learning Tip
  const handlePublishTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTipTitle.trim() || !newTipContent.trim()) return;

    try {
      const res = await fetch('/api/professor/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTipTitle,
          content: newTipContent,
          competency: newTipCompetency,
          readTimeMinutes: 2,
        }),
      });

      if (res.ok) {
        const created: ProfessorTip = await res.json();
        setTips((prev) => [created, ...prev]);
        setIsPublishingTip(false);
        setNewTipTitle('');
        setNewTipContent('');
      }
    } catch (err) {
      console.error('Error publishing tip:', err);
    }
  };

  // Toggle Mentor Hour
  const handleToggleMentorHour = async () => {
    try {
      const res = await fetch('/api/professor/mentor-hour/toggle', { method: 'POST' });
      if (res.ok) {
        setMentorHour(await res.json());
      }
    } catch (err) {
      console.error('Error toggling mentor hour:', err);
    }
  };

  const pendingDoubts = doubts.filter((d) => d.status === 'pending');
  const answeredDoubts = doubts.filter((d) => d.status === 'answered');

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-[#EA0029] border border-red-200">
                Sistema de Mentoria Mackenzie
              </span>
              <span className="text-xs font-semibold text-zinc-500">
                Acompanhamento Pedagógico Ativo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Central de Mentoria & Dúvidas
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-2xl leading-relaxed">
              Esclareça dúvidas conceituais dos formandos, publique pílulas e dicas rápidas de estudo, e ative plantões com bônus de XP.
            </p>
          </div>

          {/* Subtabs Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-2xl self-start lg:self-center">
            <button
              onClick={() => setActiveTab('doubts')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'doubts'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-[#EA0029]" />
              <span>Dúvidas ({pendingDoubts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tips')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'tips'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Pílulas ({tips.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('mentor-hour')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'mentor-hour'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Radio className="w-4 h-4 text-red-500" />
              <span>Plantão Live</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: STUDENT DOUBTS */}
      {activeTab === 'doubts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
              Fila de Dúvidas dos Alunos ({doubts.length})
            </h3>
            <span className="text-xs text-zinc-500">
              {pendingDoubts.length} aguardando resposta
            </span>
          </div>

          <div className="space-y-3">
            {doubts.map((doubt) => {
              const isPending = doubt.status === 'pending';
              const isReplying = selectedDoubt?.id === doubt.id;

              return (
                <div
                  key={doubt.id}
                  className={`p-5 rounded-2xl bg-white border transition-all ${
                    isPending ? 'border-amber-300 bg-amber-50/10' : 'border-zinc-200/90 shadow-2xs'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-xs text-zinc-700">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-zinc-900">{doubt.studentName}</span>
                          <span className="text-[11px] text-zinc-400 ml-2">RA: {doubt.studentRa}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-600">
                          {doubt.competency}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
                            isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isPending ? 'Aguardando Resposta' : 'Respondida'}
                        </span>
                      </div>
                    </div>

                    {/* Question Context & Student Doubt */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-zinc-500">
                        Referência: Questão sobre {doubt.questionTopic}
                      </p>
                      <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 leading-relaxed font-medium">
                        "{doubt.doubtText}"
                      </div>
                    </div>

                    {/* Answer if already answered */}
                    {doubt.professorAnswer && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Resposta do {doubt.answeredBy || 'Docente'}:</span>
                        </div>
                        <p className="text-emerald-950 leading-relaxed pl-5">{doubt.professorAnswer}</p>
                      </div>
                    )}

                    {/* Reply Action / Form */}
                    {isPending && !isReplying && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => {
                            setSelectedDoubt(doubt);
                            setReplyText('');
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EA0029] text-white text-xs font-bold hover:bg-[#c90023] transition-colors cursor-pointer shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Responder Dúvida</span>
                        </button>
                      </div>
                    )}

                    {isReplying && (
                      <div className="space-y-2.5 pt-2 border-t border-zinc-100">
                        <label className="block text-xs font-bold text-zinc-700">
                          Sua Orientação Pedagógica:
                        </label>
                        <textarea
                          rows={4}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Digite a explicação detalhada com o embasamento teórico para o aluno..."
                          className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-[#EA0029] focus:outline-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedDoubt(null)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100 cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSendAnswer(doubt.id)}
                            disabled={isSubmittingReply || !replyText.trim()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isSubmittingReply ? 'Enviando...' : 'Enviar Resposta ao Aluno'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SHORT TIPS (PÍLULAS DE APRENDIZADO) */}
      {activeTab === 'tips' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                Pílulas de Aprendizado Publicadas ({tips.length})
              </h3>
              <p className="text-xs text-zinc-500">
                Dicas curtas e diretas exibidas no painel de estudos dos alunos
              </p>
            </div>

            <button
              onClick={() => setIsPublishingTip(!isPublishingTip)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EA0029] text-white text-xs font-bold hover:bg-[#c90023] transition-colors cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Pílula</span>
            </button>
          </div>

          {/* New Tip Form */}
          {isPublishingTip && (
            <form
              onSubmit={handlePublishTip}
              className="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-sm space-y-4 animate-in fade-in duration-150"
            >
              <h4 className="text-sm font-extrabold text-zinc-900">Criar Nova Dica Rápida</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Título da Dica</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Teorema CAP descomplicado para o ENADE"
                    value={newTipTitle}
                    onChange={(e) => setNewTipTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Competência ENADE</label>
                  <select
                    value={newTipCompetency}
                    onChange={(e) => setNewTipCompetency(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50"
                  >
                    <option value="Algoritmos e Estruturas de Dados">Algoritmos e Estruturas de Dados</option>
                    <option value="Bancos de Dados e Consistência de Dados">Bancos de Dados e Consistência de Dados</option>
                    <option value="Engenharia de Software e Métodos Ágeis">Engenharia de Software e Métodos Ágeis</option>
                    <option value="Sistemas Operacionais e Redes">Sistemas Operacionais e Redes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Conteúdo da Dica (1 a 2 parágrafos objetivos)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explique o ponto chave de atenção que os avaliadores do INEP cobram..."
                  value={newTipContent}
                  onChange={(e) => setNewTipContent(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-zinc-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPublishingTip(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#EA0029] text-white text-xs font-bold hover:bg-[#c90023]"
                >
                  Publicar para a Turma
                </button>
              </div>
            </form>
          )}

          {/* Tips Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tips.map((tip) => (
              <div
                key={tip.id}
                className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {tip.competency}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium">
                      {tip.readTimeMinutes} min de leitura
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-900 leading-snug">{tip.title}</h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">{tip.content}</p>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                  <span>Por {tip.authorName}</span>
                  <div className="flex items-center gap-1 font-semibold text-rose-600">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    <span>{tip.likes} curtidas</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MENTOR HOUR (PLANTÃO DO MENTOR) */}
      {activeTab === 'mentor-hour' && (
        <div className="space-y-6">
          {mentorHour && (
            <MentorHourBanner
              session={mentorHour}
              onToggleLive={handleToggleMentorHour}
              isProfessorView={true}
            />
          )}

          <div className="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">
              Como funciona o Plantão do Mentor
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-600 leading-relaxed">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-red-50 text-[#EA0029] flex items-center justify-center font-bold">
                  1
                </div>
                <h4 className="font-bold text-zinc-900">Ativação em 1 Clique</h4>
                <p>
                  Ao clicar em <strong>"Iniciar Plantão"</strong>, todos os alunos online recebem um aviso com o link da sala.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-red-50 text-[#EA0029] flex items-center justify-center font-bold">
                  2
                </div>
                <h4 className="font-bold text-zinc-900">Multiplicador 2x XP Ativo</h4>
                <p>
                  Durante o plantão ao vivo, qualquer questão resolvida pelos alunos concede o dobro de experiência (+100 XP por acerto).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-red-50 text-[#EA0029] flex items-center justify-center font-bold">
                  3
                </div>
                <h4 className="font-bold text-zinc-900">Resolução Coletiva de Prova</h4>
                <p>
                  Aborde ao vivo as questões com maior índice de distração identificadas pelo analytics da plataforma.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
