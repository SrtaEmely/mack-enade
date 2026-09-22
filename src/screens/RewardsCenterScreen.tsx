/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Gift,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Share2,
  Trophy,
  Flame,
  Users,
  Building,
  Target,
  FileCheck2,
  HelpCircle,
  ExternalLink,
  Info,
  Check,
  Zap,
  TrendingUp,
  MapPin,
  QrCode,
  Copy,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import {
  RewardWinner,
  CollectiveClassReward,
  Student,
  Mission,
  MentorChallenge,
  QuestionResult,
  ScreenType,
  ShareableRewardCardData,
  SheetPrize,
} from '../types';
import { auditStudentActivity } from '../utils/antiAbuseEngine';
import { RewardShareModal } from '../components/RewardShareModal';

interface RewardsCenterScreenProps {
  student: Student;
  missions: Mission[];
  mentorChallenges?: MentorChallenge[];
  recentResults: QuestionResult[];
  onNavigate: (screen: ScreenType, params?: any) => void;
}

/**
 * Professional Mack ENADE placeholder component when image_url is blank or fails to load
 */
const MackEnadePrizeImage: React.FC<{
  imageUrl?: string;
  altText?: string;
  prizeName: string;
  className?: string;
}> = ({ imageUrl, altText, prizeName, className = 'w-full h-48 sm:h-52' }) => {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || imageUrl.trim() === '' || hasError) {
    return (
      <div
        className={`${className} relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-[#1A0005] text-white flex flex-col items-center justify-center p-6 select-none`}
      >
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#EA0029]/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-amber-400 flex items-center justify-center shadow-lg mb-2.5">
            <Gift className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#EA0029] bg-white px-2 py-0.5 rounded shadow-xs mb-1">
            MACK ENADE
          </span>
          <span className="text-xs font-bold text-zinc-100 max-w-[220px] line-clamp-1">
            {prizeName || 'Premiação Oficial'}
          </span>
          <span className="text-[10px] text-zinc-400 mt-0.5">
            Universidade Presbiteriana Mackenzie
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={altText || prizeName}
      onError={() => setHasError(true)}
      className={`${className} object-cover object-center`}
    />
  );
};

export const RewardsCenterScreen: React.FC<RewardsCenterScreenProps> = ({
  student,
  missions,
  mentorChallenges = [],
  recentResults,
  onNavigate,
}) => {
  // Real dynamic prizes loaded from Google Sheets database
  const [prizes, setPrizes] = useState<SheetPrize[]>([]);
  const [isLoadingPrizes, setIsLoadingPrizes] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [prizesError, setPrizesError] = useState<string | null>(null);

  // Testing & preview toggle for coordinators / pilot evaluation
  const [previewAllWorksheetPrizes, setPreviewAllWorksheetPrizes] = useState(false);

  // Modals state
  const [selectedPrizeModal, setSelectedPrizeModal] = useState<SheetPrize | null>(null);
  const [shareModalData, setShareModalData] = useState<ShareableRewardCardData | null>(null);
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);

  // Gamification state
  const [winners, setWinners] = useState<RewardWinner[]>([]);
  const [collectiveRewards, setCollectiveRewards] = useState<CollectiveClassReward[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'collective' | 'winners' | 'my-vouchers'>('active');

  // Determine course_id for student
  const studentCourseCode = student.course?.toLowerCase().includes('civil')
    ? 'CIVIL'
    : student.course?.toLowerCase().includes('produção') || student.course?.toLowerCase().includes('prod')
    ? 'PROD'
    : 'ALL';

  // Fetch real prizes from Google Sheets endpoint
  const loadPrizes = async (forceRefresh = false) => {
    setIsLoadingPrizes(true);
    setPrizesError(null);
    if (forceRefresh) setIsRefreshing(true);

    try {
      // If previewing all worksheet prizes (coordinator inspection): show all
      // If in student mode: filter active=true and status=ACTIVE
      const url = previewAllWorksheetPrizes
        ? `/api/prizes?course_id=${studentCourseCode}&include_dates=false${forceRefresh ? '&refresh=true' : ''}`
        : `/api/prizes?course_id=${studentCourseCode}&active=true&status=ACTIVE${forceRefresh ? '&refresh=true' : ''}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Falha HTTP ${res.status}`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.prizes || []);
      setPrizes(list);
    } catch (err: any) {
      console.error('[RewardsCenterScreen] Erro ao carregar prêmios:', err);
      setPrizesError('Não foi possível conectar com a planilha Google Sheets de prêmios no momento.');
    } finally {
      setIsLoadingPrizes(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPrizes();
  }, [studentCourseCode, previewAllWorksheetPrizes]);

  // Fetch winners and collective rewards
  useEffect(() => {
    fetch('/api/rewards/winners')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setWinners(data);
      })
      .catch(() => {});

    fetch('/api/rewards/collective')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCollectiveRewards(data);
      })
      .catch(() => {});
  }, []);

  // Compute student anti-abuse audit report
  const auditReport = auditStudentActivity(recentResults, student);

  // Student's claimed prizes from past winners
  const myPrizes = winners.filter(
    (w) =>
      w.studentName.toLowerCase().includes(student.name.toLowerCase().split(' ')[0]) ||
      w.studentRaMasked.replace('*', '') === student.ra.slice(0, 3)
  );

  // Calculate student criteria evaluation for a given prize
  const evaluatePrizeCriteria = (prize: SheetPrize) => {
    const accuracy = student.questionsAnswered > 0
      ? Math.round((student.correctAnswers / student.questionsAnswered) * 100)
      : 0;
    const completedChallengesCount = mentorChallenges.filter((c) => c.status === 'completed').length;
    const completedMissionsCount = missions.filter((m) => m.completed || m.currentCount >= m.targetCount).length;

    const questionsMet = !prize.min_questions || student.questionsAnswered >= prize.min_questions;
    const activeDaysMet = !prize.min_active_days || student.studyStreak >= prize.min_active_days;
    const mentorChallengesMet = !prize.min_mentor_challenges || completedChallengesCount >= prize.min_mentor_challenges;
    const missionsMet = !prize.min_missions || completedMissionsCount >= prize.min_missions;
    const accuracyMet = !prize.min_accuracy_pct || accuracy >= prize.min_accuracy_pct;

    const totalCriteria = [
      Boolean(prize.min_questions),
      Boolean(prize.min_active_days),
      Boolean(prize.min_mentor_challenges),
      Boolean(prize.min_missions),
      Boolean(prize.min_accuracy_pct),
    ].filter(Boolean).length || 1;

    const metCount = [
      prize.min_questions ? questionsMet : null,
      prize.min_active_days ? activeDaysMet : null,
      prize.min_mentor_challenges ? mentorChallengesMet : null,
      prize.min_missions ? missionsMet : null,
      prize.min_accuracy_pct ? accuracyMet : null,
    ].filter((v) => v === true).length;

    const progressPercentage = Math.round((metCount / totalCriteria) * 100);
    const isEligible = questionsMet && activeDaysMet && mentorChallengesMet && missionsMet && accuracyMet;

    return {
      isEligible,
      progressPercentage,
      questions: { current: student.questionsAnswered, target: prize.min_questions, met: questionsMet },
      activeDays: { current: student.studyStreak, target: prize.min_active_days, met: activeDaysMet },
      mentorChallenges: { current: completedChallengesCount, target: prize.min_mentor_challenges, met: mentorChallengesMet },
      missions: { current: completedMissionsCount, target: prize.min_missions, met: missionsMet },
      accuracy: { current: accuracy, target: prize.min_accuracy_pct, met: accuracyMet },
    };
  };

  const handleCopyVoucher = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedVoucher(code);
    setTimeout(() => setCopiedVoucher(null), 2500);
  };

  const handleOpenPrizeShare = (prize: SheetPrize, isEligible: boolean) => {
    const cardData: ShareableRewardCardData = {
      type: 'student-reward',
      title: isEligible
        ? `Elegível ao ${prize.prize_name}!`
        : `Em Rumo ao ${prize.prize_name}`,
      subtitle: prize.short_description || 'Central de Recompensas Mack ENADE',
      metric: `${student.questionsAnswered} Questões`,
      metricLabel: isEligible
        ? 'Critérios Pedagógicos Aprovados'
        : 'Progresso da Meta',
      description: `Estou participando da Central de Recompensas Mack ENADE na Universidade Presbiteriana Mackenzie!`,
      badgeLabel: prize.prize_type || 'Recompensa Mack ENADE',
      date: new Date().toLocaleDateString('pt-BR'),
      authorOrStudent: `${student.name} • RA ${student.ra.slice(0, 3)}***${student.ra.slice(-2)}`,
      hashtags: ['#Mackenzie', '#MackENADE', '#OrgulhoMackenzista', '#ENADE2026'],
      suggestedCaption: isEligible
        ? ` Foco e constância acadêmica! Conquistei os critérios institucionais para o prêmio "${prize.prize_name}" no Mack ENADE da Universidade Presbiteriana Mackenzie! 🔴⚫ #Mackenzie #MackENADE #OrgulhoMackenzista`
        : ` Dedicação diária rumo ao ENADE 2026! Já são ${student.questionsAnswered} questões resolvidas com padrão auditado no Mack ENADE. 🔴⚫ #Mackenzie #MackENADE`,
    };
    setShareModalData(cardData);
  };

  return (
    <div id="rewards-center-root" className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Banner with Anti-Abuse Integrity Seal */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white border border-zinc-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-[#EA0029]/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-56 h-56 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-bold text-amber-300">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>Prêmios Reais • Planilha Google Sheets Oficial</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Central de Recompensas Mack ENADE
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Premiações físicas e institucionais cadastradas diretamente pela coordenação do curso.
              A elegibilidade é auditada por múltiplos critérios pedagógicos (questões resolvidas, frequência, desafios e padrão ético de resolução).
            </p>

            {/* Anti-Abuse Integrity Badge */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-950/70 border border-emerald-600/40 text-emerald-300 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Auditoria Anti-Abuso:</strong> {auditReport.message} ({auditReport.validQuestionsCount} questões válidas auditadas).
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/60 rounded-2xl p-4 text-center">
              <span className="text-[11px] font-bold text-zinc-400 block uppercase">Prêmios Ativos</span>
              <span className="text-2xl font-black text-amber-400">{prizes.length}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                {previewAllWorksheetPrizes ? 'Total na Planilha' : 'Disponíveis no Curso'}
              </span>
            </div>

            <div className="bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/60 rounded-2xl p-4 text-center">
              <span className="text-[11px] font-bold text-zinc-400 block uppercase">Ofensiva Semanal</span>
              <div className="flex items-center justify-center gap-1 text-2xl font-black text-orange-400">
                <Flame className="w-5 h-5 fill-current" />
                <span>{student.studyStreak}d</span>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-0.5">Dias Ativos</span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/60 rounded-2xl p-4 text-center">
              <span className="text-[11px] font-bold text-zinc-400 block uppercase">Prêmios Conquistados</span>
              <span className="text-2xl font-black text-emerald-400">{myPrizes.length}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">Vouchers Disponíveis</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-200 overflow-x-auto pb-2 scrollbar-none gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'active'
                ? 'bg-[#EA0029] text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Prêmios Oficiais da Planilha ({prizes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('collective')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'collective'
                ? 'bg-[#EA0029] text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Metas Coletivas ({collectiveRewards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('winners')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'winners'
                ? 'bg-[#EA0029] text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Ganhadores Anteriores ({winners.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => loadPrizes(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
            title="Sincronizar com a planilha Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#EA0029] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sincronizar Planilha</span>
          </button>

          <button
            onClick={() => setActiveTab('my-vouchers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'my-vouchers'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Meus Vouchers ({myPrizes.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: REAL PRIZES FROM GOOGLE SHEETS */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {/* Subheader Bar with Course Indicator & Pilot Preview Toggle */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-[#EA0029] flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900">
                  Base de Prêmios: Planilha Oficial Google Sheets (Mack ENADE)
                </p>
                <p className="text-[11px] text-zinc-500">
                  Filtrando prêmios para seu curso ({student.course}) • Atualização automática em tempo real
                </p>
              </div>
            </div>

            {/* Coordinator / Pilot Mode Switch */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setPreviewAllWorksheetPrizes(!previewAllWorksheetPrizes)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  previewAllWorksheetPrizes
                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                }`}
                title="Alternar entre visualização de aluno (apenas ativos) ou coordenação (todos os prêmios da planilha)"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>
                  {previewAllWorksheetPrizes ? 'Modo Coordenação (Todos os Prêmios)' : 'Visão do Aluno (Apenas Ativos)'}
                </span>
              </button>
            </div>
          </div>

          {prizesError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center justify-between gap-3">
              <span>{prizesError}</span>
              <button
                onClick={() => loadPrizes(true)}
                className="font-bold underline cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoadingPrizes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-3xl border border-zinc-200 p-5 space-y-4 animate-pulse">
                  <div className="w-full h-48 bg-zinc-200 rounded-2xl" />
                  <div className="h-5 bg-zinc-200 rounded-md w-3/4" />
                  <div className="h-3 bg-zinc-100 rounded-md w-full" />
                  <div className="h-8 bg-zinc-100 rounded-xl w-full" />
                </div>
              ))}
            </div>
          ) : prizes.length === 0 ? (
            /* Requirement 7: Empty state when no active prizes exist */
            <div className="bg-white rounded-3xl border border-zinc-200/90 p-8 sm:p-12 text-center shadow-xs space-y-5 animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#EA0029] border border-red-100 flex items-center justify-center mx-auto shadow-xs">
                <Gift className="w-8 h-8" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base sm:text-lg font-black text-zinc-900 leading-snug">
                  Novos prêmios serão anunciados em breve. Continue cumprindo suas missões para ficar preparado!
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  As premiações do Mack ENADE são gerenciadas diretamente pelos coordenadores através da planilha oficial. Continue resolvendo questões, mantendo seus dias ativos e cumprindo desafios para atingir a pontuação necessária assim que a rodada abrir!
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                <button
                  onClick={() => onNavigate('today-mission')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EA0029] hover:bg-[#D30026] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  <Target className="w-4 h-4" />
                  <span>Ver Minhas Missões</span>
                </button>
                <button
                  onClick={() => onNavigate('question')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Praticar Questões do Simulado</span>
                </button>
              </div>
            </div>
          ) : (
            /* Requirement 5: Display each prize card using: prize_name, short_description, image_url, quantity, announcement_date, eligibility_notes, sorted by display_order */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prizes.map((prize) => {
                const evalResult = evaluatePrizeCriteria(prize);
                const isEligible = evalResult.isEligible;

                return (
                  <div
                    key={prize.prize_id}
                    id={`prize-card-${prize.prize_id}`}
                    onClick={() => setSelectedPrizeModal(prize)}
                    className="group bg-white rounded-3xl border border-zinc-200/90 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer hover:border-zinc-300"
                  >
                    <div>
                      {/* Prize Card Image (with professional fallback if blank) */}
                      <div className="relative w-full overflow-hidden">
                        <MackEnadePrizeImage
                          imageUrl={prize.image_url}
                          altText={prize.image_alt_text}
                          prizeName={prize.prize_name}
                          className="w-full h-48 group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
                            <Trophy className="w-3 h-3 text-amber-400" />
                            <span>{prize.award_category || 'Premiação'}</span>
                          </span>

                          {!prize.active && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                              Rascunho
                            </span>
                          )}
                        </div>

                        {/* Quantity Badge */}
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md border border-zinc-200 px-2.5 py-0.5 rounded-full text-[11px] font-black text-zinc-900 shadow-sm flex items-center gap-1">
                          <Gift className="w-3 h-3 text-[#EA0029]" />
                          <span>{prize.quantity} {prize.quantity === 1 ? 'unidade' : 'unidades'}</span>
                        </div>

                        {/* Announcement Date Bar */}
                        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 drop-shadow-sm font-semibold">
                          <span className="inline-flex items-center gap-1 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md">
                            <Calendar className="w-3 h-3 text-amber-300" />
                            <span>
                              {prize.announcement_date
                                ? `Anúncio: ${prize.announcement_date}`
                                : 'Anúncio semanal'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="text-base font-black text-zinc-900 group-hover:text-[#EA0029] transition-colors leading-snug">
                            {prize.prize_name}
                          </h3>
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                            {prize.short_description || prize.full_description || 'Premiação real para reconhecimento de dedicação no simulado.'}
                          </p>
                        </div>

                        {/* Eligibility Notes */}
                        {prize.eligibility_notes && (
                          <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 text-[11px] text-zinc-600 line-clamp-2">
                            <span className="font-bold text-zinc-800">Critério: </span>
                            {prize.eligibility_notes}
                          </div>
                        )}

                        {/* Gamification Progress Pill */}
                        <div className="pt-1">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-zinc-600">Progresso dos Critérios:</span>
                            <span className={`font-black ${isEligible ? 'text-emerald-700' : 'text-[#EA0029]'}`}>
                              {isEligible ? 'Elegível ✓' : `${evalResult.progressPercentage}%`}
                            </span>
                          </div>
                          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isEligible ? 'bg-emerald-500' : 'bg-[#EA0029]'
                              }`}
                              style={{ width: `${evalResult.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Action */}
                    <div className="p-5 pt-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPrizeModal(prize);
                        }}
                        className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-[#EA0029] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Ver detalhes e elegibilidade</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COLLECTIVE REWARDS */}
      {activeTab === 'collective' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {collectiveRewards.map((collective) => {
              const progressPct = Math.min(
                100,
                Math.round((collective.currentValue / collective.targetValue) * 100)
              );
              return (
                <div
                  key={collective.id}
                  className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs p-6 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-100 uppercase">
                        Meta da Turma • {collective.cohortCourse}
                      </span>
                      <h3 className="text-lg font-black text-zinc-900 mt-2">{collective.title}</h3>
                      <p className="text-xs text-zinc-500 mt-1">{collective.description}</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-700">Recompensa Desbloqueada:</span>
                      <span className="font-bold text-[#EA0029]">{collective.prizeDescription}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold pt-1">
                      <span>Progresso Geral:</span>
                      <span>
                        {collective.currentValue} / {collective.targetValue} {collective.unitLabel} ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PAST WINNERS */}
      {activeTab === 'winners' && (
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h3 className="text-base font-black text-zinc-900">Ganhadores das Semanas Anteriores</h3>
              <p className="text-xs text-zinc-500">Homologação de entregas e auditoria concluída</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {winners.length} Vouchers Homologados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Estudante</th>
                  <th className="pb-3">Prêmio</th>
                  <th className="pb-3 text-center">Data</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {winners.map((w) => (
                  <tr key={w.id} className="hover:bg-zinc-50">
                    <td className="py-3 font-bold text-zinc-900">
                      {w.studentName} <span className="text-zinc-400 font-normal font-mono">({w.studentRaMasked})</span>
                    </td>
                    <td className="py-3 text-zinc-700">{w.campaignTitle}</td>
                    <td className="py-3 text-center text-zinc-500">{w.awardedAt}</td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {w.claimed ? 'Entregue' : 'Voucher Ativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MY VOUCHERS */}
      {activeTab === 'my-vouchers' && (
        <div className="space-y-4">
          {myPrizes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-zinc-200 p-8 text-center text-zinc-500 space-y-3">
              <Award className="w-10 h-10 text-zinc-400 mx-auto" />
              <p className="font-bold text-zinc-800 text-sm">Você ainda não possui vouchers de premiações resgatados.</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Continue cumprindo suas metas semanais para ser sorteado e homologado para os prêmios físicos do ciclo ENADE.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPrizes.map((prize) => (
                <div
                  key={prize.id}
                  className="bg-white rounded-3xl border border-zinc-200 p-6 space-y-4 shadow-2xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Voucher Homologado
                      </span>
                      <h4 className="text-base font-black text-zinc-900 mt-2">{prize.campaignTitle}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">Homologado em {prize.awardedAt}</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Gift className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center font-mono font-bold text-sm text-[#EA0029] flex items-center justify-between">
                    <span>{prize.voucherCode}</span>
                    <button
                      onClick={() => handleCopyVoucher(prize.voucherCode)}
                      className="text-xs text-zinc-600 hover:text-zinc-900 cursor-pointer flex items-center gap-1"
                    >
                      {copiedVoucher === prize.voucherCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: FULL PRIZE DETAILS & ELIGIBILITY REQUIREMENTS (Requirement 6) */}
      {selectedPrizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 relative my-8">
            <button
              onClick={() => setSelectedPrizeModal(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-800 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Image */}
            <div className="rounded-2xl overflow-hidden mb-4 border border-zinc-200">
              <MackEnadePrizeImage
                imageUrl={selectedPrizeModal.image_url}
                altText={selectedPrizeModal.image_alt_text}
                prizeName={selectedPrizeModal.prize_name}
                className="w-full h-52 sm:h-56"
              />
            </div>

            {/* Header info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#EA0029] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                  {selectedPrizeModal.award_category || 'Premiação Oficial'}
                </span>
                <span className="text-[11px] font-bold text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-full">
                  {selectedPrizeModal.prize_type || 'Semanal'}
                </span>
                <span className="text-[11px] font-bold text-zinc-700 bg-zinc-100 px-2.5 py-0.5 rounded-full">
                  {selectedPrizeModal.course_id === 'ALL'
                    ? 'Engenharia Civil & Produção'
                    : selectedPrizeModal.course_id === 'CIVIL'
                    ? 'Exclusivo Eng. Civil'
                    : 'Exclusivo Eng. Produção'}
                </span>
              </div>

              <h2 className="text-xl font-black text-zinc-900 leading-snug">
                {selectedPrizeModal.prize_name}
              </h2>

              <p className="text-xs text-zinc-600 leading-relaxed">
                {selectedPrizeModal.full_description || selectedPrizeModal.short_description}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 text-center text-xs">
              <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
                <span className="text-[10px] text-zinc-400 font-bold block uppercase">Quantidade</span>
                <span className="font-black text-zinc-900 text-sm">
                  {selectedPrizeModal.quantity} {selectedPrizeModal.quantity === 1 ? 'unidade' : 'unidades'}
                </span>
              </div>
              <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
                <span className="text-[10px] text-zinc-400 font-bold block uppercase">Data de Anúncio</span>
                <span className="font-bold text-zinc-800 text-xs">
                  {selectedPrizeModal.announcement_date || 'A definir'}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 p-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
                <span className="text-[10px] text-zinc-400 font-bold block uppercase">Status</span>
                <span className={`font-black text-xs ${selectedPrizeModal.active ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {selectedPrizeModal.active ? 'Ativo no Piloto' : 'Rascunho na Planilha'}
                </span>
              </div>
            </div>

            {/* Eligibility Requirements Section */}
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#EA0029]" />
                <span>Requisitos de Elegibilidade & Auditoria</span>
              </h4>

              {(() => {
                const evalData = evaluatePrizeCriteria(selectedPrizeModal);

                return (
                  <div className="space-y-2.5 bg-zinc-50 rounded-2xl p-4 border border-zinc-200/90 text-xs">
                    {/* Checklist */}
                    <div className="space-y-2 text-zinc-700">
                      {selectedPrizeModal.min_questions > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            {evalData.questions.met ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-zinc-300 shrink-0" />
                            )}
                            <span>Mínimo de {selectedPrizeModal.min_questions} questões resolvidas:</span>
                          </span>
                          <span className={`font-bold ${evalData.questions.met ? 'text-emerald-700' : 'text-zinc-500'}`}>
                            {evalData.questions.current} / {selectedPrizeModal.min_questions}
                          </span>
                        </div>
                      )}

                      {selectedPrizeModal.min_active_days > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            {evalData.activeDays.met ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-zinc-300 shrink-0" />
                            )}
                            <span>Mínimo de {selectedPrizeModal.min_active_days} dias ativos de estudo:</span>
                          </span>
                          <span className={`font-bold ${evalData.activeDays.met ? 'text-emerald-700' : 'text-zinc-500'}`}>
                            {evalData.activeDays.current} / {selectedPrizeModal.min_active_days}d
                          </span>
                        </div>
                      )}

                      {selectedPrizeModal.min_mentor_challenges > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            {evalData.mentorChallenges.met ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-zinc-300 shrink-0" />
                            )}
                            <span>Desafios do Mentor concluídos:</span>
                          </span>
                          <span className={`font-bold ${evalData.mentorChallenges.met ? 'text-emerald-700' : 'text-zinc-500'}`}>
                            {evalData.mentorChallenges.current} / {selectedPrizeModal.min_mentor_challenges}
                          </span>
                        </div>
                      )}

                      {selectedPrizeModal.min_missions > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            {evalData.missions.met ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-zinc-300 shrink-0" />
                            )}
                            <span>Missões da semana concluídas:</span>
                          </span>
                          <span className={`font-bold ${evalData.missions.met ? 'text-emerald-700' : 'text-zinc-500'}`}>
                            {evalData.missions.current} / {selectedPrizeModal.min_missions}
                          </span>
                        </div>
                      )}

                      {selectedPrizeModal.min_accuracy_pct > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            {evalData.accuracy.met ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-zinc-300 shrink-0" />
                            )}
                            <span>Aproveitamento mínimo de {selectedPrizeModal.min_accuracy_pct}%:</span>
                          </span>
                          <span className={`font-bold ${evalData.accuracy.met ? 'text-emerald-700' : 'text-zinc-500'}`}>
                            {evalData.accuracy.current}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Eligibility Notes Callout */}
                    {selectedPrizeModal.eligibility_notes && (
                      <div className="pt-2 border-t border-zinc-200/60 text-zinc-600 text-[11px] leading-relaxed">
                        <strong className="text-zinc-900">Orientações da Coordenação: </strong>
                        {selectedPrizeModal.eligibility_notes}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  const evalData = evaluatePrizeCriteria(selectedPrizeModal);
                  handleOpenPrizeShare(selectedPrizeModal, evalData.isEligible);
                }}
                className="flex-1 py-2.5 px-4 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#EA0029]" />
                <span>Compartilhar Meta</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPrizeModal(null)}
                className="py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal Integration */}
      {shareModalData && (
        <RewardShareModal
          data={shareModalData}
          isOpen={Boolean(shareModalData)}
          onClose={() => setShareModalData(null)}
        />
      )}
    </div>
  );
};
