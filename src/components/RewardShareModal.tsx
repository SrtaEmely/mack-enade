/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Download,
  Sparkles,
  Award,
  GraduationCap,
  Calendar,
  Building,
  ShieldCheck,
  X,
  ExternalLink,
  MessageCircle,
  Linkedin,
  Instagram,
  Lock,
} from 'lucide-react';
import { ShareableRewardCardData } from '../types';
import { UPMLogo } from './UPMLogo';

interface RewardShareModalProps {
  data: ShareableRewardCardData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RewardShareModal: React.FC<RewardShareModalProps> = ({
  data,
  isOpen,
  onClose,
}) => {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<'linkedin' | 'whatsapp' | 'instagram'>('linkedin');

  if (!isOpen || !data) return null;

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(data.suggestedCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const handleCopyCardText = () => {
    const cardSummary = `🏆 [MACK ENADE] ${data.title}\n✨ ${data.subtitle}\n📊 ${data.metric}: ${data.metricLabel}\n🏛️ Universidade Presbiteriana Mackenzie\n👤 ${data.authorOrStudent}\n🗓️ ${data.date}\n\n${data.description}\n\n${data.hashtags.join(' ')}`;
    navigator.clipboard.writeText(cardSummary);
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${data.suggestedCaption}\n\nConfira as recompensas no Portal Mack ENADE.`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    navigator.clipboard.writeText(data.suggestedCaption);
    setCopiedCaption(true);
    const url = encodeURIComponent('https://mackenzie.br');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#EA0029] flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Card de Conquista & Recompensa</h2>
              <p className="text-xs text-zinc-500">Compartilhe sua jornada de excelência no ENADE Mackenzie</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Privacy & Anti-Spam Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <p className="font-bold">Privacidade & Controle do Usuário:</p>
              <p className="text-emerald-800">
                O Mack ENADE <strong>nunca publica automaticamente</strong> em suas redes sociais. Você decide quando, onde e o que deseja compartilhar copiando o card ou texto abaixo.
              </p>
            </div>
          </div>

          {/* Visual Share Card Preview */}
          <div className="relative rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white p-6 sm:p-8 border border-zinc-800 shadow-xl overflow-hidden">
            {/* Background Decorative Rings */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-[#EA0029]/20 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-44 h-44 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-5">
              {/* Card Brand Header */}
              <div className="flex items-center justify-between gap-4 border-b border-zinc-800/90 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EA0029] text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                    M
                  </div>
                  <div>
                    <span className="text-xs font-black tracking-widest text-[#EA0029] uppercase">MACK ENADE</span>
                    <p className="text-[10px] text-zinc-400">Universidade Presbiteriana Mackenzie</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2.5 py-1 rounded-full text-[11px] font-extrabold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{data.badgeLabel}</span>
                </span>
              </div>

              {/* Title & Metric */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{data.subtitle}</p>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {data.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl">
                  {data.description}
                </p>
              </div>

              {/* Highlight Metric Box */}
              <div className="bg-zinc-800/80 border border-zinc-700/70 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-zinc-400 block font-medium">Indicador de Destaque</span>
                  <span className="text-2xl font-black text-white">{data.metric}</span>
                </div>
                <div className="sm:text-right">
                  <span className="text-[11px] text-zinc-400 block font-medium">Critério & Status</span>
                  <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg inline-block">
                    {data.metricLabel}
                  </span>
                </div>
              </div>

              {/* Footer Information */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-[11px] text-zinc-400 border-t border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#EA0029]" />
                  <span className="font-semibold text-zinc-200">{data.authorOrStudent}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{data.date}</span>
                  {data.voucherOrCode && (
                    <span className="text-zinc-500 ml-1">
                      • Código: <strong className="text-zinc-300 font-mono">{data.voucherOrCode}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Social Platform Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-700 block">
              Escolha a rede para pré-visualizar o texto formatado:
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedNetwork('linkedin')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedNetwork === 'linkedin'
                    ? 'bg-blue-50 border-blue-200 text-blue-800 shadow-2xs'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <Linkedin className="w-4 h-4 text-blue-600" />
                <span>LinkedIn</span>
              </button>

              <button
                onClick={() => setSelectedNetwork('whatsapp')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedNetwork === 'whatsapp'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-2xs'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={() => setSelectedNetwork('instagram')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedNetwork === 'instagram'
                    ? 'bg-purple-50 border-purple-200 text-purple-800 shadow-2xs'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <Instagram className="w-4 h-4 text-pink-600" />
                <span>Instagram Stories</span>
              </button>
            </div>
          </div>

          {/* Suggested Caption Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-700">Legenda sugerida para publicação manual:</span>
              <button
                onClick={handleCopyCaption}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#EA0029] hover:underline cursor-pointer"
              >
                {copiedCaption ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCaption ? 'Legenda Copiada!' : 'Copiar Legenda'}</span>
              </button>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap font-sans">
              {data.suggestedCaption}
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:px-6 bg-zinc-50/70 border-t border-zinc-100">
          <button
            onClick={handleCopyCardText}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            {copiedCard ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCard ? 'Dados Copiados!' : 'Copiar Resumo do Card'}</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {selectedNetwork === 'whatsapp' ? (
              <button
                onClick={handleShareWhatsApp}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir WhatsApp</span>
              </button>
            ) : selectedNetwork === 'linkedin' ? (
              <button
                onClick={handleShareLinkedIn}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A66C2] text-white hover:bg-[#004182] text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Linkedin className="w-4 h-4" />
                <span>Compartilhar no LinkedIn</span>
              </button>
            ) : (
              <button
                onClick={handleCopyCaption}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Instagram className="w-4 h-4" />
                <span>Copiar para Stories</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
