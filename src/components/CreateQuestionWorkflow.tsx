import React, { useState } from 'react';
import {
  Sparkles,
  PenLine,
  ClipboardPaste,
  FileUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  HelpCircle,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  Send,
  UploadCloud,
  Check,
  Edit3,
} from 'lucide-react';
import { Question, AreaType } from '../types';

interface CreateQuestionWorkflowProps {
  onQuestionCreated: (question: Question) => void;
  onCancel: () => void;
  defaultCourse?: string;
}

type WorkflowMode = 'select' | 'manual' | 'ai' | 'paste' | 'import';

export const CreateQuestionWorkflow: React.FC<CreateQuestionWorkflowProps> = ({
  onQuestionCreated,
  onCancel,
  defaultCourse = 'Ciência da Computação',
}) => {
  const [mode, setMode] = useState<WorkflowMode>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Review & Edit draft state (used for AI, Paste, Import and final approval)
  const [draftQuestion, setDraftQuestion] = useState<Question | null>(null);
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  // Form State for Manual Creation
  const [statement, setStatement] = useState('');
  const [altA, setAltA] = useState('');
  const [altB, setAltB] = useState('');
  const [altC, setAltC] = useState('');
  const [altD, setAltD] = useState('');
  const [altE, setAltE] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [explanation, setExplanation] = useState('');
  const [commonError, setCommonError] = useState('');
  const [competency, setCompetency] = useState('Algoritmos e Estruturas de Dados');
  const [area, setArea] = useState<AreaType>('Componente Específico');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Fácil' | 'Médio' | 'Difícil'>('Médio');

  // AI Prompt State
  const [aiTopic, setAiTopic] = useState('Estruturas de Dados: Árvores B e Índices de Banco');
  const [aiKeywords, setAiKeywords] = useState('balanceamento, busca assintótica O(log n), nós internos');
  const [aiCompetency, setAiCompetency] = useState('Algoritmos e Estruturas de Dados');
  const [aiDifficulty, setAiDifficulty] = useState<'Fácil' | 'Médio' | 'Difícil'>('Médio');

  // Paste Text State
  const [pasteRawText, setPasteRawText] = useState('');

  // Import File / Material State
  const [materialText, setMaterialText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [importType, setImportType] = useState<'json' | 'material'>('material');

  // Fast demo pre-fill for Manual Option (< 30 seconds)
  const handlePreFillManual = () => {
    setStatement(
      'Em sistemas de computação distribuída, o protocolo Paxos garante consenso em redes assíncronas sujeitas a falhas de parada. Considerando as propriedades de segurança (safety) e vivacidade (liveness) do Paxos, assinale a proposição correta:'
    );
    setAltA('Apenas um único valor proposto pode ser decidido como consensual entre os nós.');
    setAltB('O protocolo garante vivacidade mesmo se todos os proposers falharem indefinidamente.');
    setAltC('A fase de preparação requer maioria absoluta de votos de nós bizantinos arbitrários.');
    setAltD('Nenhum nó acceptor pode alterar sua promessa após receber a primeira mensagem de prepare.');
    setAltE('O Paxos não suporta reconfiguração dinâmica de quóruns em tempo de execução.');
    setCorrectAnswer('A');
    setExplanation(
      'A propriedade de Safety do Paxos garante que nenhum valor diferente será aceito uma vez que um consenso foi firmado por um quórum majoritário.'
    );
    setCommonError(
      'Confundir tolerância a falhas de parada (Crash-Recovery) com tolerância a falhas bizantinas arbitrárias.'
    );
    setTopic('Sistemas Distribuídos e Algoritmos de Consenso');
    setCompetency('Sistemas Operacionais e Redes');
    setDifficulty('Médio');
  };

  // Submit Manual Question
  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim() || !altA.trim() || !altB.trim()) {
      setError('Por favor preencha o enunciado e as alternativas mínimas.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const newQuestion: Question = {
      id: 'q-man-' + Date.now(),
      course: defaultCourse,
      area,
      competency,
      topic: topic || 'Tópico Geral',
      difficulty,
      type: 'Múltipla Escolha',
      statement,
      alternatives: [
        { id: 'A', text: altA },
        { id: 'B', text: altB },
        { id: 'C', text: altC || 'N.d.a.' },
        { id: 'D', text: altD || 'N.d.a.' },
        { id: 'E', text: altE || 'N.d.a.' },
      ],
      correctAnswer,
      explanation: explanation || 'Resolução fundamentada pelo docente.',
      commonError: commonError || 'Equívoco comum de interpretação do enunciado.',
      source: 'Docente FCI / Universidade Presbiteriana Mackenzie',
      year: 2024,
      status: 'published',
      authorRole: 'professor',
      authorName: 'Prof. Dr. Carlos Medeiros',
      createdAt: new Date().toISOString(),
      analytics: {
        attempts: 0,
        correctCount: 0,
        accuracyRate: 0,
        averageTimeSeconds: 0,
        distractorSelections: { A: 0, B: 0, C: 0, D: 0, E: 0 },
      },
    };

    try {
      const res = await fetch('/api/professor/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion),
      });
      if (res.ok) {
        const saved = await res.json();
        onQuestionCreated(saved);
      } else {
        onQuestionCreated(newQuestion);
      }
    } catch {
      onQuestionCreated(newQuestion);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit AI Question Generation
  const handleGenerateAI = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gemini/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          promptKeywords: aiKeywords,
          competency: aiCompetency,
          difficulty: aiDifficulty,
          course: defaultCourse,
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao gerar questão com IA');
      }

      const generated: Question = await res.json();
      // MANDATORY REQUIREMENT: Keep in Draft status until explicitly approved
      generated.status = 'draft';
      setDraftQuestion(generated);
      setIsEditingDraft(true);
    } catch (err: any) {
      setError('Erro ao conectar com o serviço de IA. Verifique se o servidor está ativo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fast parser for Pasted Question
  const handleParsePastedQuestion = () => {
    if (!pasteRawText.trim()) {
      setError('Cole o texto da questão para realizar a extração.');
      return;
    }

    const lines = pasteRawText.split('\n').map((l) => l.trim()).filter(Boolean);
    let stmt = '';
    const alts: Record<string, string> = { A: '', B: '', C: '', D: '', E: '' };
    let currentKey: 'stmt' | 'A' | 'B' | 'C' | 'D' | 'E' = 'stmt';
    let detectedAnswer: 'A' | 'B' | 'C' | 'D' | 'E' = 'A';

    for (const line of lines) {
      const altMatch = line.match(/^([A-Ea-e])[\.\)\-\:]\s*(.+)$/);
      const gabaritoMatch = line.match(/gabarito[:\s]+([A-Ea-e])/i);

      if (gabaritoMatch) {
        detectedAnswer = gabaritoMatch[1].toUpperCase() as any;
        continue;
      }

      if (altMatch) {
        const key = altMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E';
        currentKey = key;
        alts[key] = altMatch[2];
      } else if (currentKey === 'stmt') {
        stmt += (stmt ? '\n' : '') + line;
      } else {
        alts[currentKey] += ' ' + line;
      }
    }

    const parsedQuestion: Question = {
      id: 'q-paste-' + Date.now(),
      course: defaultCourse,
      area: 'Componente Específico',
      competency: 'Engenharia de Software e Métodos Ágeis',
      topic: 'Questão Importada por Colagem',
      difficulty: 'Médio',
      type: 'Múltipla Escolha',
      statement: stmt || pasteRawText.slice(0, 200),
      alternatives: [
        { id: 'A', text: alts.A || 'Alternativa A detectada' },
        { id: 'B', text: alts.B || 'Alternativa B detectada' },
        { id: 'C', text: alts.C || 'Alternativa C detectada' },
        { id: 'D', text: alts.D || 'Alternativa D detectada' },
        { id: 'E', text: alts.E || 'Alternativa E detectada' },
      ],
      correctAnswer: detectedAnswer,
      explanation: 'Questão colada e revisada pelo corpo docente.',
      commonError: 'Distrator conceitual.',
      source: 'Prova Oficial ENADE / Acervo Docente',
      year: 2023,
      status: 'draft', // Draft until approved
      authorRole: 'professor',
      authorName: 'Prof. Dr. Carlos Medeiros',
      createdAt: new Date().toISOString(),
      analytics: {
        attempts: 0,
        correctCount: 0,
        accuracyRate: 0,
        averageTimeSeconds: 0,
        distractorSelections: { A: 0, B: 0, C: 0, D: 0, E: 0 },
      },
    };

    setDraftQuestion(parsedQuestion);
    setIsEditingDraft(true);
  };

  // Generate question from educational material
  const handleGenerateFromMaterial = async () => {
    if (!materialText.trim()) {
      setError('Por favor digite ou carregue o material educacional.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gemini/generate-from-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialText,
          fileName: uploadedFileName || 'Apostila_Mackenzie.pdf',
          competency,
          area,
          course: defaultCourse,
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao processar material com IA');
      }

      const generated: Question = await res.json();
      generated.status = 'draft';
      setDraftQuestion(generated);
      setIsEditingDraft(true);
    } catch (err) {
      setError('Erro ao gerar questão do material.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle local file read (.json or .txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          const q = Array.isArray(parsed) ? parsed[0] : parsed;
          q.status = 'draft';
          setDraftQuestion(q);
          setIsEditingDraft(true);
        } catch {
          setError('Arquivo JSON inválido. Certifique-se de usar o esquema de questões ENADE.');
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        setMaterialText(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  // Explicit approval action for Draft questions
  const handleApproveDraft = async () => {
    if (!draftQuestion) return;
    setIsLoading(true);

    const approvedQuestion: Question = {
      ...draftQuestion,
      status: 'published',
    };

    try {
      await fetch(`/api/professor/questions/${draftQuestion.id}/approve`, {
        method: 'PATCH',
      });
    } catch {
      // Offline fallback
    }

    setIsLoading(false);
    onQuestionCreated(approvedQuestion);
  };

  // Save Draft as Draft (without approving)
  const handleSaveAsDraft = () => {
    if (!draftQuestion) return;
    onQuestionCreated({
      ...draftQuestion,
      status: 'draft',
    });
  };

  // RENDER: If reviewing/editing a draft (AI generated, pasted, or imported)
  if (draftQuestion && isEditingDraft) {
    return (
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in duration-150">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                Status: Rascunho
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                {draftQuestion.authorRole === 'ai' ? 'Gerada com Inteligência Artificial' : 'Aguardando Aprovação'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900">
              Revisar e Editar Questão antes de Publicar
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Toda questão gerada ou importada permanece em rascunho até aprovação explícita do docente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setDraftQuestion(null);
                setIsEditingDraft(false);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Voltar
            </button>
            <button
              onClick={handleSaveAsDraft}
              className="px-3.5 py-2 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Salvar Rascunho
            </button>
            <button
              onClick={handleApproveDraft}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#EA0029] text-white text-xs font-bold hover:bg-[#c90023] transition-colors cursor-pointer shadow-sm active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Aprovar e Publicar no Banco</span>
            </button>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Enunciado Oficial</label>
            <textarea
              rows={5}
              value={draftQuestion.statement}
              onChange={(e) => setDraftQuestion({ ...draftQuestion, statement: e.target.value })}
              className="w-full text-sm p-3.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-[#EA0029] focus:outline-none bg-zinc-50/50"
            />
          </div>

          {/* Alternatives */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-2">
              Alternativas (Selecione a Correta)
            </label>
            <div className="space-y-2.5">
              {draftQuestion.alternatives.map((alt, idx) => (
                <div key={alt.id} className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDraftQuestion({ ...draftQuestion, correctAnswer: alt.id })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer transition-colors ${
                      draftQuestion.correctAnswer === alt.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                    title={draftQuestion.correctAnswer === alt.id ? 'Alternativa Correta' : 'Marcar como Correta'}
                  >
                    {alt.id}
                  </button>
                  <input
                    type="text"
                    value={alt.text}
                    onChange={(e) => {
                      const updated = [...draftQuestion.alternatives];
                      updated[idx] = { ...updated[idx], text: e.target.value };
                      setDraftQuestion({ ...draftQuestion, alternatives: updated });
                    }}
                    className="flex-1 text-sm px-3.5 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-[#EA0029] focus:outline-none bg-zinc-50/40"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Solution & Common Error */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Justificativa / Resolução Pedagógica
              </label>
              <textarea
                rows={3}
                value={draftQuestion.explanation}
                onChange={(e) => setDraftQuestion({ ...draftQuestion, explanation: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-[#EA0029] focus:outline-none bg-zinc-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Erro Comum / Distrator Típico do Estudante
              </label>
              <textarea
                rows={3}
                value={draftQuestion.commonError}
                onChange={(e) => setDraftQuestion({ ...draftQuestion, commonError: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-[#EA0029] focus:outline-none bg-zinc-50/50"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: Mode Selection Screen (< 2 min workflow entry)
  if (mode === 'select') {
    return (
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#EA0029] mb-1">
              <Clock className="w-4 h-4" />
              <span>Criação Ágil • Menos de 2 Minutos</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
              Como deseja criar sua questão ENADE?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Escolha um dos 4 fluxos simplificados para enriquecer o banco preparatório da turma.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-xs font-bold text-zinc-400 hover:text-zinc-600 px-3 py-1.5 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Option 1: Write Manually */}
          <div
            onClick={() => setMode('manual')}
            className="group p-5 rounded-2xl border border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-[#EA0029]/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <PenLine className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 group-hover:text-[#EA0029] transition-colors">
                  1. Escrever Manualmente
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Formulário direto com campos guiados de enunciado, 5 alternativas e justificativa comentada.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-blue-600 mt-4 pt-3 border-t border-zinc-100">
              <span>Preencher Form</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Option 2: Generate with AI */}
          <div
            onClick={() => setMode('ai')}
            className="group p-5 rounded-2xl border border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-[#EA0029]/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-[#EA0029] border border-red-200">
              Mais Rápido • 30s
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#EA0029] flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 group-hover:text-[#EA0029] transition-colors">
                  2. Gerar com IA
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Informe tema e competência. A IA elabora a questão no padrão oficial do INEP para sua revisão prévia.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-[#EA0029] mt-4 pt-3 border-t border-zinc-100">
              <span>Gerar em Rascunho</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Option 3: Paste existing question */}
          <div
            onClick={() => setMode('paste')}
            className="group p-5 rounded-2xl border border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-[#EA0029]/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ClipboardPaste className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 group-hover:text-[#EA0029] transition-colors">
                  3. Colar Questão Existente
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Cole o texto copiado de um PDF de prova ou simulado. O extrator detecta enunciado e alternativas A-E.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-600 mt-4 pt-3 border-t border-zinc-100">
              <span>Auto-Extrair</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Option 4: Import from file */}
          <div
            onClick={() => setMode('import')}
            className="group p-5 rounded-2xl border border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-[#EA0029]/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 group-hover:text-[#EA0029] transition-colors">
                  4. Importar de Arquivo ou Material
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Carregue arquivo .json ou envie slides/apostila (.txt/.pdf) para gerar questões alinhadas às suas aulas.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-purple-600 mt-4 pt-3 border-t border-zinc-100">
              <span>Upload de Material</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: OPTION 1 - MANUAL
  if (mode === 'manual') {
    return (
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <button
            onClick={() => setMode('select')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar aos 4 fluxos</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreFillManual}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Preencher Exemplo Rápido
            </button>
            <span className="text-xs text-zinc-400">•</span>
            <span className="text-xs font-semibold text-zinc-500">Criação Manual</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-[#EA0029] text-xs font-semibold rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmitManual} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Competência ENADE</label>
              <select
                value={competency}
                onChange={(e) => setCompetency(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50"
              >
                <option value="Algoritmos e Estruturas de Dados">Algoritmos e Estruturas de Dados</option>
                <option value="Engenharia de Software e Métodos Ágeis">Engenharia de Software e Métodos Ágeis</option>
                <option value="Bancos de Dados e Consistência de Dados">Bancos de Dados e Consistência de Dados</option>
                <option value="Sistemas Operacionais e Redes">Sistemas Operacionais e Redes</option>
                <option value="Ética, Cidadania e Direitos Humanos">Ética, Cidadania e Direitos Humanos</option>
                <option value="Sustentabilidade e Sociedade">Sustentabilidade e Sociedade</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Tópico / Conteúdo</label>
              <input
                type="text"
                placeholder="Ex: Análise Assintótica, Níveis ACID"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Dificuldade</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50"
              >
                <option value="Fácil">Fácil</option>
                <option value="Médio">Médio</option>
                <option value="Difícil">Difícil</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Enunciado / Situação-Problema
            </label>
            <textarea
              rows={4}
              required
              placeholder="Digite o enunciado contextualizado da questão..."
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              className="w-full text-sm p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-[#EA0029] focus:outline-none"
            />
          </div>

          {/* Alternatives */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              Alternativas (Clique na letra para definir a Correta)
            </label>
            <div className="space-y-2">
              {[
                { id: 'A' as const, val: altA, set: setAltA },
                { id: 'B' as const, val: altB, set: setAltB },
                { id: 'C' as const, val: altC, set: setAltC },
                { id: 'D' as const, val: altD, set: setAltD },
                { id: 'E' as const, val: altE, set: setAltE },
              ].map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectAnswer(item.id)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer ${
                      correctAnswer === item.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {item.id}
                  </button>
                  <input
                    type="text"
                    required={item.id === 'A' || item.id === 'B'}
                    placeholder={`Texto da alternativa ${item.id}`}
                    value={item.val}
                    onChange={(e) => item.set(e.target.value)}
                    className="flex-1 text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-[#EA0029] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Justificativa Pedagógica
              </label>
              <textarea
                rows={2}
                placeholder="Por que a alternativa selecionada está correta?"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Erro Comum do Estudante
              </label>
              <textarea
                rows={2}
                placeholder="Qual equívoco faz o aluno errar esta questão?"
                value={commonError}
                onChange={(e) => setCommonError(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setMode('select')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA0029] text-white text-xs font-bold hover:bg-[#c90023] transition-colors cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>{isLoading ? 'Salvando...' : 'Publicar Questão'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // RENDER: OPTION 2 - GENERATE WITH AI
  if (mode === 'ai') {
    return (
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <button
            onClick={() => setMode('select')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar aos 4 fluxos</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#EA0029]">
            <Sparkles className="w-4 h-4" />
            <span>Gerador Inteligente ENADE</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-[#EA0029] text-xs font-semibold rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-red-50/60 border border-red-100 text-xs text-zinc-600 leading-relaxed">
            <p className="font-bold text-zinc-800 mb-0.5">Como funciona:</p>
            A inteligência artificial elabora o enunciado, 5 alternativas e justificativa com base nos descritores do INEP. A questão gerada permanecerá em <strong>Rascunho</strong> até que você a aprove ou edite.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Competência ENADE</label>
              <select
                value={aiCompetency}
                onChange={(e) => setAiCompetency(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-zinc-50"
              >
                <option value="Algoritmos e Estruturas de Dados">Algoritmos e Estruturas de Dados</option>
                <option value="Engenharia de Software e Métodos Ágeis">Engenharia de Software e Métodos Ágeis</option>
                <option value="Bancos de Dados e Consistência de Dados">Bancos de Dados e Consistência de Dados</option>
                <option value="Sistemas Operacionais e Redes">Sistemas Operacionais e Redes</option>
                <option value="Ética, Cidadania e Direitos Humanos">Ética, Cidadania e Direitos Humanos</option>
                <option value="Sustentabilidade e Sociedade">Sustentabilidade e Sociedade</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Nível de Dificuldade</label>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value as any)}
                className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-zinc-50"
              >
                <option value="Fácil">Fácil (Conceitual Direto)</option>
                <option value="Médio">Médio (Aplicação e Análise)</option>
                <option value="Difícil">Difícil (Síntese e Situação Complexa)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Tópico ou Objeto de Avaliação
            </label>
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="Ex: Árvores B, Normalização 3FN vs BCNF, Microserviços"
              className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-[#EA0029] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Foco Técnico / Palavras-chave (Opcional)
            </label>
            <input
              type="text"
              value={aiKeywords}
              onChange={(e) => setAiKeywords(e.target.value)}
              placeholder="Ex: Teorema CAP, ACID, Transações Compensatórias, O(n log n)"
              className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-[#EA0029] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setMode('select')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#EA0029] text-white text-xs font-bold hover:bg-[#c90023] transition-colors cursor-pointer shadow-sm active:scale-95"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando com IA... (~3s)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar Questão Rascunho</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: OPTION 3 - PASTE RAW QUESTION
  if (mode === 'paste') {
    return (
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <button
            onClick={() => setMode('select')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar aos 4 fluxos</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <ClipboardPaste className="w-4 h-4" />
            <span>Colar e Auto-Detectar</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-[#EA0029] text-xs font-semibold rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-zinc-700">
              Cole o texto bruto da questão (com alternativas A, B, C, D, E)
            </label>
            <button
              type="button"
              onClick={() => {
                setPasteRawText(`Em relação aos protocolos da camada de transporte na arquitetura TCP/IP, analise as características do TCP e UDP.

Assinale a opção correta:
A) O UDP garante entrega sequencial por meio de janelas deslizantes.
B) O TCP é orientado a conexão e utiliza o three-way handshake para sincronização de estados.
C) O UDP implementa controle de congestionamento nativo para tráfego multimídia.
D) O TCP opera sem sobrecarga de cabeçalho, sendo ideal para broadcast local.
E) Ambos utilizam portas de 32 bits para endereçamento de socket.

Gabarito: B`);
              }}
              className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              Inserir Exemplo de Prova
            </button>
          </div>

          <textarea
            rows={8}
            value={pasteRawText}
            onChange={(e) => setPasteRawText(e.target.value)}
            placeholder="Cole aqui o texto copiado de um PDF de prova ou simulado..."
            className="w-full text-xs font-mono p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setMode('select')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleParsePastedQuestion}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Extrair e Revisar Rascunho</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: OPTION 4 - IMPORT FROM FILE / EDUCATIONAL MATERIAL
  return (
    <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
        <button
          onClick={() => setMode('select')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos 4 fluxos</span>
        </button>
        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600">
          <FileUp className="w-4 h-4" />
          <span>Importação e Material Didático</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-[#EA0029] text-xs font-semibold rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Upload Zone */}
        <div className="p-6 rounded-2xl border-2 border-dashed border-zinc-200 hover:border-[#EA0029]/60 bg-zinc-50/50 flex flex-col items-center justify-center text-center transition-colors">
          <UploadCloud className="w-8 h-8 text-zinc-400 mb-2" />
          <p className="text-xs font-bold text-zinc-800">
            Arraste ou selecione um arquivo (.json, .txt, .pdf)
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Suporta questões prontas em JSON ou material didático/slides para extração
          </p>
          <label className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer shadow-2xs">
            <span>Selecionar Arquivo</span>
            <input
              type="file"
              accept=".json,.txt,.pdf,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {uploadedFileName && (
            <p className="text-xs font-semibold text-emerald-600 mt-2">
              Arquivo carregado: {uploadedFileName}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-zinc-700">
              Ou cole o conteúdo de uma apostila / slide de aula
            </label>
            <button
              type="button"
              onClick={() => {
                setMaterialText(`Unidade 4: Arquitetura Orientada a Eventos e Microserviços
Na arquitetura orientada a eventos, os componentes produzem e consomem eventos de forma assíncrona por meio de um barramento de mensageria (como Apache Kafka ou RabbitMQ). Ao contrário da comunicação REST síncrona, onde o serviço chamador fica bloqueado esperando resposta, na mensageria assíncrona desacopla-se o tempo e o espaço de execução.
Para gerenciar a consistência de dados sem impor Two-Phase Commit (2PC) e locks globais, adota-se o padrão Saga com coreografia ou orquestração, complementado por transações compensatórias em caso de falha.`);
                setUploadedFileName('Slide_Aula_04_FCI.pdf');
              }}
              className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
            >
              Inserir Exemplo de Slide
            </button>
          </div>

          <textarea
            rows={5}
            value={materialText}
            onChange={(e) => setMaterialText(e.target.value)}
            placeholder="Cole aqui o texto didático do qual deseja extrair a questão..."
            className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
          <button
            type="button"
            onClick={() => setMode('select')}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGenerateFromMaterial}
            disabled={isLoading || !materialText.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Gerando do Material Didático...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Gerar Questão do Material</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
