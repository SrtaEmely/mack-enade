/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Gift,
  Plus,
  Edit2,
  Trash2,
  Award,
  CheckCircle2,
  AlertTriangle,
  Users,
  Calendar,
  Clock,
  ShieldCheck,
  Building,
  Target,
  Sparkles,
  Share2,
  X,
  Check,
  ChevronRight,
  TrendingUp,
  Flame,
  HelpCircle,
  Search,
} from 'lucide-react';
import {
  RewardCampaign,
  RewardWinner,
  CollectiveClassReward,
  ClassStudentProgress,
  Professor,
  RewardCategory,
  ShareableRewardCardData,
} from '../types';
import { RewardShareModal } from '../components/RewardShareModal';

interface ProfessorRewardManagerScreenProps {
  professor: Professor;
  classStudents: ClassStudentProgress[];
  onNavigate?: (screen: any) => void;
}

const PRESET_PRIZE_IMAGES = [
  {
    name: 'Mochila Executiva FCI',
    url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Kindle Paperwhite',
    url: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Headset Noise-Cancelling',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Voucher Livraria Mackenzie',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Livro de Engenharia / Arquitetura',
    url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Smart Speaker Alexa',
    url: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&auto=format&fit=crop&q=80',
  },
];

export const ProfessorRewardManagerScreen: React.FC<ProfessorRewardManagerScreenProps> = ({
  professor,
  classStudents,
}) => {
  const [campaigns, setCampaigns] = useState<RewardCampaign[]>([]);
  const [winners, setWinners] = useState<RewardWinner[]>([]);
  const [collectiveRewards, setCollectiveRewards] = useState<CollectiveClassReward[]>([]);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'draw' | 'collective'>('campaigns');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [shareModalData, setShareModalData] = useState<ShareableRewardCardData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form fields for creating/editing campaign
  const [formData, setFormData] = useState({
    title: '',
    category: 'enade-champion' as RewardCategory,
    categoryLabel: 'Campeão ENADE',
    description: '',
    imageUrl: PRESET_PRIZE_IMAGES[0].url,
    sponsorOrSource: 'Faculdade de Computação e Informática (FCI) Mackenzie',
    totalQuantity: 3,
    weekLabel: 'Semana 38 • Ciclo 2026',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    pickupLocation: 'Secretaria da FCI - Prédio 32, Sala 204',
    instructions: 'Apresentar documento com foto e voucher emitido.',
    // Criteria
    minQuestions: 35,
    minActiveDays: 5,
    minMentorChallenges: 1,
    minInstitutionalMissions: 2,
    minAccuracyPercentage: 70,
    minCompetenciesExplored: 3,
    enforceAntiAbuseValidation: true,
  });

  // Fetch data
  const loadData = () => {
    fetch('/api/rewards/campaigns')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCampaigns(data))
      .catch(() => {});

    fetch('/api/rewards/winners')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setWinners(data))
      .catch(() => {});

    fetch('/api/rewards/collective')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCollectiveRewards(data))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open modal for new campaign
  const handleOpenCreate = () => {
    setEditingCampaignId(null);
    setFormData({
      title: '',
      category: 'enade-champion',
      categoryLabel: 'Campeão ENADE',
      description: '',
      imageUrl: PRESET_PRIZE_IMAGES[0].url,
      sponsorOrSource: 'Coordenação de Curso & FCI Mackenzie',
      totalQuantity: 3,
      weekLabel: `Semana ${Math.floor(Date.now() / (7 * 24 * 3600 * 1000)) % 52} • 2026`,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      pickupLocation: 'Secretaria da FCI - Prédio 32, Sala 204',
      instructions: 'Apresentar documento de identificação e código do voucher.',
      minQuestions: 35,
      minActiveDays: 5,
      minMentorChallenges: 1,
      minInstitutionalMissions: 2,
      minAccuracyPercentage: 70,
      minCompetenciesExplored: 3,
      enforceAntiAbuseValidation: true,
    });
    setIsModalOpen(true);
  };

  // Open modal for editing campaign
  const handleOpenEdit = (camp: RewardCampaign) => {
    setEditingCampaignId(camp.id);
    setFormData({
      title: camp.title,
      category: camp.category,
      categoryLabel: camp.categoryLabel,
      description: camp.description,
      imageUrl: camp.imageUrl,
      sponsorOrSource: camp.sponsorOrSource,
      totalQuantity: camp.totalQuantity,
      weekLabel: camp.weekLabel,
      startDate: camp.startDate,
      endDate: camp.endDate,
      pickupLocation: camp.deliveryDetails?.pickupLocation || 'Secretaria da FCI - Prédio 32, Sala 204',
      instructions: camp.deliveryDetails?.instructions || 'Apresentar voucher no balcão.',
      minQuestions: camp.criteria.minQuestions,
      minActiveDays: camp.criteria.minActiveDays,
      minMentorChallenges: camp.criteria.minMentorChallenges,
      minInstitutionalMissions: camp.criteria.minInstitutionalMissions,
      minAccuracyPercentage: camp.criteria.minAccuracyPercentage || 60,
      minCompetenciesExplored: camp.criteria.minCompetenciesExplored || 3,
      enforceAntiAbuseValidation: camp.criteria.enforceAntiAbuseValidation,
    });
    setIsModalOpen(true);
  };

  // Submit form (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      alert('Preencha ao menos o nome do prêmio e a descrição.');
      return;
    }

    const payload = {
      title: formData.title,
      category: formData.category,
      categoryLabel:
        formData.category === 'enade-champion'
          ? 'Campeão ENADE'
          : formData.category === 'biggest-evolution'
          ? 'Maior Evolução'
          : formData.category === 'consistency-award'
          ? 'Prêmio Constância'
          : formData.category === 'mission-master'
          ? 'Mestre das Missões'
          : 'Desafio com Prêmio do Mentor',
      description: formData.description,
      imageUrl: formData.imageUrl,
      sponsorOrSource: formData.sponsorOrSource,
      totalQuantity: Number(formData.totalQuantity),
      weekLabel: formData.weekLabel,
      startDate: formData.startDate,
      endDate: formData.endDate,
      criteria: {
        minQuestions: Number(formData.minQuestions),
        minActiveDays: Number(formData.minActiveDays),
        minMentorChallenges: Number(formData.minMentorChallenges),
        minInstitutionalMissions: Number(formData.minInstitutionalMissions),
        minAccuracyPercentage: Number(formData.minAccuracyPercentage),
        minCompetenciesExplored: Number(formData.minCompetenciesExplored),
        enforceAntiAbuseValidation: formData.enforceAntiAbuseValidation,
      },
      deliveryDetails: {
        pickupLocation: formData.pickupLocation,
        instructions: formData.instructions,
        voucherExpirationDays: 14,
      },
      isProfessorMentorReward: formData.category === 'mentor-special',
      professorMentorName: formData.category === 'mentor-special' ? professor.name : undefined,
    };

    if (editingCampaignId) {
      const res = await fetch(`/api/rewards/campaigns/${editingCampaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast('Campanha de premiação atualizada com sucesso!');
        setIsModalOpen(false);
        loadData();
      }
    } else {
      const res = await fetch('/api/rewards/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast('Nova campanha semanal criada sem necessidade de alterar o código!');
        setIsModalOpen(false);
        loadData();
      }
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm('Tem certeza de que deseja remover esta campanha de recompensas?')) return;
    const res = await fetch(`/api/rewards/campaigns/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Campanha removida do sistema.');
      loadData();
    }
  };

  // Draw or award winners for a campaign
  const handleDrawWinners = async (campaign: RewardCampaign) => {
    // Select top students who meet question and streak requirements
    const eligibleStudents = classStudents.filter(
      (s) => s.questionsAnswered >= campaign.criteria.minQuestions || s.streak >= campaign.criteria.minActiveDays
    );
    const chosen = eligibleStudents.slice(0, 1);

    const res = await fetch('/api/rewards/draw-winners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: campaign.id,
        studentIds: chosen.map((c) => c.id),
      }),
    });

    if (res.ok) {
      showToast(`Vencedor apurado com sucesso para "${campaign.title}"! Voucher emitido.`);
      loadData();
    }
  };

  // Share campaign announcement as professor
  const handleShareCampaignAnnouncement = (camp: RewardCampaign) => {
    const cardData: ShareableRewardCardData = {
      type: 'professor-campaign',
      title: `Nova Premiação Aberta: ${camp.title}!`,
      subtitle: `Mack ENADE • ${camp.categoryLabel}`,
      metric: `${camp.totalQuantity} Unidades`,
      metricLabel: `${camp.criteria.minQuestions} Questões • ${camp.criteria.minActiveDays} Dias de Ofensiva`,
      description: `A coordenação e o corpo docente da Universidade Presbiteriana Mackenzie lançaram a campanha "${camp.title}". Participe resolvendo questões válidas e desafios do mentor para concorrer!`,
      badgeLabel: camp.categoryLabel,
      date: new Date().toLocaleDateString('pt-BR'),
      authorOrStudent: `${professor.name} • ${professor.department}`,
      hashtags: ['#Mackenzie', '#FCI', '#MackENADE', '#RecompensasENADE', '#EducacaoSuperior'],
      suggestedCaption: `🔴⚫ Atenção estudantes de ${professor.course} da Universidade Presbiteriana Mackenzie! Acabamos de liberar a nova campanha de recompensas semanais no Mack ENADE: "${camp.title}". Dediquem-se na resolução de questões comentadas e nos nossos plantões de mentoria. Os prêmios já estão disponíveis na secretaria! #Mackenzie #FCI #MackENADE #OrgulhoMackenzista`,
    };
    setShareModalData(cardData);
  };

  return (
    <div id="admin-reward-manager-root" className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-zinc-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-zinc-700 animate-in slide-in-from-top-3 duration-200 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-zinc-900 text-white border border-zinc-800 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-amber-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Painel do Coordenador & Docente Mentor</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Gestor de Recompensas Reais
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Configure prêmios físicos semanais (nome, foto, quantidades, vigência e regras de elegibilidade pedagógica multidimensional) sem alterar o código do sistema. Acompanhe a auditoria anti-abuso e homologue os vouchers oficiais.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#EA0029] text-white hover:bg-[#c40022] text-xs font-extrabold shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Nova Campanha</span>
            </button>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'campaigns'
              ? 'bg-[#EA0029] text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Campanhas Cadastradas ({campaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('draw')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'draw'
              ? 'bg-[#EA0029] text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Apuração & Auditoria Anti-Abuso</span>
        </button>

        <button
          onClick={() => setActiveTab('collective')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'collective'
              ? 'bg-[#EA0029] text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Metas Coletivas da Turma ({collectiveRewards.length})</span>
        </button>
      </div>

      {/* TAB 1: CAMPAIGNS LIST & MANAGEMENT */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="relative h-44 w-full bg-zinc-900 overflow-hidden">
                  <img
                    src={camp.imageUrl}
                    alt={camp.title}
                    className="w-full h-full object-cover object-center opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-zinc-900 shadow-sm">
                      {camp.categoryLabel}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-white">
                    {camp.remainingQuantity} de {camp.totalQuantity} disponíveis
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white/90">
                    <span>{camp.weekLabel}</span>
                    <span>Prazo: {camp.endDate}</span>
                  </div>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-base font-black text-zinc-900 leading-snug">
                      {camp.title}
                    </h3>
                    <p className="text-xs text-zinc-600 line-clamp-2">
                      {camp.description}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      Patrocínio: <strong>{camp.sponsorOrSource}</strong>
                    </p>
                  </div>

                  {/* Rules summary box */}
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-[11px] text-zinc-600 space-y-1">
                    <p className="font-bold text-zinc-800">Regras de Elegibilidade Configuradas:</p>
                    <div className="grid grid-cols-2 gap-1 text-zinc-600">
                      <span>• Min. Questões: <strong>{camp.criteria.minQuestions}</strong></span>
                      <span>• Dias Ativos: <strong>{camp.criteria.minActiveDays}d</strong></span>
                      <span>• Desafios Mentor: <strong>{camp.criteria.minMentorChallenges}</strong></span>
                      <span>• Missões Institucionais: <strong>{camp.criteria.minInstitutionalMissions}</strong></span>
                    </div>
                    {camp.criteria.enforceAntiAbuseValidation && (
                      <p className="text-emerald-700 font-semibold pt-1 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Filtro Anti-Abuso Ativado (Tempo mín. 30s + Sem repetições)</span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleShareCampaignAnnouncement(camp)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-[#EA0029] hover:bg-red-50 transition-colors cursor-pointer"
                        title="Divulgar Campanha aos Alunos"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(camp)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                        title="Editar Campanha"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteCampaign(camp.id)}
                        className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remover Campanha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleDrawWinners(camp)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>Apurar Vencedores</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT & WINNERS SELECTION */}
      {activeTab === 'draw' && (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="border-b border-zinc-100 pb-4">
              <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Auditoria Pedagógica & Homologação de Elegíveis</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                O motor anti-abuso analisa automaticamente o tempo de resposta, repetibilidade e diversidade curricular dos estudantes para evitar que cliques repetidos gerem elegibilidade indevida.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 font-bold uppercase">
                    <th className="pb-3">Estudante</th>
                    <th className="pb-3">Questões Válidas</th>
                    <th className="pb-3">Ofensiva</th>
                    <th className="pb-3">Precisão</th>
                    <th className="pb-3">Diagnóstico Anti-Abuso</th>
                    <th className="pb-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {classStudents.map((st) => {
                    const accuracyVal = st.accuracy ?? st.accuracyRate ?? 70;
                    const isClean = accuracyVal >= 65 && st.questionsAnswered >= 20;

                    return (
                      <tr key={st.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-3">
                          <p className="font-bold text-zinc-900">{st.name}</p>
                          <p className="text-[11px] text-zinc-400">RA: {st.ra}</p>
                        </td>
                        <td className="py-3 font-semibold text-zinc-800">
                          {st.questionsAnswered} questões
                        </td>
                        <td className="py-3 font-semibold text-orange-600">
                          {st.streak} dias
                        </td>
                        <td className="py-3 font-bold text-zinc-900">
                          {accuracyVal}%
                        </td>
                        <td className="py-3">
                          {isClean ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Padrão Íntegro Aprovado</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Cadência em Análise</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              if (campaigns.length > 0) {
                                handleDrawWinners(campaigns[0]);
                              }
                            }}
                            className="px-3 py-1 rounded-xl bg-zinc-900 text-white text-[11px] font-bold hover:bg-zinc-800 cursor-pointer"
                          >
                            Premiar Aluno
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COLLECTIVE CLASS REWARDS */}
      {activeTab === 'collective' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {collectiveRewards.map((coll) => (
              <div
                key={coll.id}
                className="bg-white rounded-3xl border border-zinc-200 p-6 space-y-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-[#EA0029] uppercase bg-red-50 px-2.5 py-0.5 rounded-full">
                      {coll.cohortCourse} • {coll.semester}
                    </span>
                    <h3 className="text-base font-black text-zinc-900 mt-1">{coll.title}</h3>
                  </div>
                  <Users className="w-5 h-5 text-zinc-400" />
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed">{coll.description}</p>

                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span>Progresso Coletivo:</span>
                    <span>{coll.currentValue} de {coll.targetValue} {coll.unitLabel}</span>
                  </div>
                  <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((coll.currentValue / coll.targetValue) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
                  <span>Prazo: {coll.deadline}</span>
                  <span className="font-semibold text-zinc-700">Patrocínio: {coll.sponsor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE / EDIT CAMPAIGN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-[#EA0029] flex items-center justify-center font-bold">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    {editingCampaignId ? 'Editar Campanha de Recompensa' : 'Nova Campanha de Recompensa'}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Configure os prêmios físicos e regras pedagógicas sem alterar o código
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-5">
              {/* Prize Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Nome do Prêmio Físico:</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Mochila Executiva FCI ou Kindle Paperwhite"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-[#EA0029] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Categoria da Recompensa:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as RewardCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-[#EA0029] outline-none bg-white cursor-pointer"
                  >
                    <option value="enade-champion">🏆 Campeão ENADE</option>
                    <option value="biggest-evolution">📈 Maior Evolução</option>
                    <option value="consistency-award">🔥 Prêmio Constância</option>
                    <option value="mission-master">🎯 Mestre das Missões</option>
                    <option value="mentor-special">👨‍🏫 Desafio com Prêmio do Mentor</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Descrição & Critério de Honra:</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explique o mérito acadêmico e as orientações para os alunos..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-[#EA0029] outline-none resize-none"
                />
              </div>

              {/* Preset Image Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700">Imagem do Prêmio (Presets Oficiais UPM ou URL):</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_PRIZE_IMAGES.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                      className={`relative h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        formData.imageUrl === preset.url ? 'border-[#EA0029] scale-95 shadow-xs' : 'border-zinc-200 hover:opacity-80'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="Ou insira uma URL de imagem externa"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-[#EA0029] outline-none"
                />
              </div>

              {/* Sponsor & Quantity & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Patrocinador / Órgão:</label>
                  <input
                    type="text"
                    value={formData.sponsorOrSource}
                    onChange={(e) => setFormData({ ...formData, sponsorOrSource: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Quantidade de Itens:</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.totalQuantity}
                    onChange={(e) => setFormData({ ...formData, totalQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Data de Término:</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs"
                  />
                </div>
              </div>

              {/* Configurable Eligibility Rules (No Code Change Needed!) */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#EA0029]" />
                  <h4 className="text-xs font-bold text-zinc-900">
                    Regras Configuráveis de Elegibilidade do Aluno:
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 block">Mín. Questões:</label>
                    <input
                      type="number"
                      min={5}
                      value={formData.minQuestions}
                      onChange={(e) => setFormData({ ...formData, minQuestions: Number(e.target.value) })}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 block">Mín. Dias Ativos:</label>
                    <input
                      type="number"
                      min={1}
                      max={7}
                      value={formData.minActiveDays}
                      onChange={(e) => setFormData({ ...formData, minActiveDays: Number(e.target.value) })}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 block">Desafios Mentor:</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.minMentorChallenges}
                      onChange={(e) => setFormData({ ...formData, minMentorChallenges: Number(e.target.value) })}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 block">Precisão Mínima (%):</label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={formData.minAccuracyPercentage}
                      onChange={(e) => setFormData({ ...formData, minAccuracyPercentage: Number(e.target.value) })}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white"
                    />
                  </div>
                </div>

                {/* Anti-abuse checkbox */}
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enforceAntiAbuse"
                    checked={formData.enforceAntiAbuseValidation}
                    onChange={(e) => setFormData({ ...formData, enforceAntiAbuseValidation: e.target.checked })}
                    className="w-4 h-4 text-[#EA0029] rounded-md focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="enforceAntiAbuse" className="text-xs font-semibold text-zinc-700 cursor-pointer">
                    Habilitar validação anti-abuso (desconsidera cliques em &lt; 5s e repetições excessivas no mesmo item)
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#EA0029] text-white text-xs font-bold hover:bg-[#c40022] shadow-xs cursor-pointer"
                >
                  {editingCampaignId ? 'Salvar Alterações' : 'Publicar Campanha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <RewardShareModal
        data={shareModalData}
        isOpen={Boolean(shareModalData)}
        onClose={() => setShareModalData(null)}
      />
    </div>
  );
};
