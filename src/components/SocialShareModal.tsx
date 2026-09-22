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
  ArrowRight,
  X,
  ExternalLink,
} from 'lucide-react';
import { InstitutionalAchievement } from '../types';
import { UPMLogo } from './UPMLogo';

interface SocialShareModalProps {
  achievement: InstitutionalAchievement;
  isOpen: boolean;
  onClose: () => void;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  achievement,
  isOpen,
  onClose,
}) => {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<'linkedin' | 'whatsapp' | 'instagram'>('linkedin');

  if (!isOpen) return null;

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(achievement.suggestedCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const handleCopyCardText = () => {
    const cardSummary = `🏆 [MACK ENADE] ${achievement.title}\n📊 ${achievement.metric}: ${achievement.metricValue}\n🏛️ ${achievement.course}\n👨‍🏫 ${achievement.professorName}\n🗓️ ${achievement.date}\n\n${achievement.description}`;
    navigator.clipboard.writeText(cardSummary);
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${achievement.suggestedCaption}\n\nConfira os detalhes no Portal Mack ENADE.`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    // We open LinkedIn share intent with pre-copied notice (cannot auto-publish)
    navigator.clipboard.writeText(achievement.suggestedCaption);
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#EA0029] flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Compartilhar Conquista Institucional</h2>
              <p className="text-xs text-zinc-500">Gere o card visual e copie a legenda sugerida para redes sociais</p>
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
          {/* Visual Achievement Card Preview */}
          <div className="relative rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white p-6 sm:p-8 border border-zinc-800 shadow-xl overflow-hidden">
            {/* Mackenzie Red Top Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#EA0029]" />

            {/* Subtle collegiate watermark background */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-[#EA0029]/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between gap-6">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <UPMLogo size="sm" variant="footer" />
                  <div className="border-l border-zinc-700 pl-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-red-400">
                      Ciclo ENADE UPM
                    </p>
                    <p className="text-xs font-semibold text-zinc-300">Faculdade de Computação e Informática</p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase bg-red-600/30 text-red-300 border border-red-500/40">
                  {achievement.category}
                </span>
              </div>

              {/* Card Metric Display */}
              <div className="my-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {achievement.metric}
                  </span>
                  <span className="text-sm font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-800/60">
                    {achievement.metricValue}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-zinc-100 mt-2 leading-snug">
                  {achievement.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                  {achievement.description}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-400">
                <div className="flex items-center gap-1.5 font-medium">
                  <GraduationCap className="w-3.5 h-3.5 text-[#EA0029]" />
                  <span>{achievement.professorName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{achievement.date}</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                  <Building className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Mackenzie Higienópolis</span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Network Selector & Caption */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Legenda Sugerida para Publicação
              </label>
              <div className="flex items-center gap-1">
                {(['linkedin', 'whatsapp', 'instagram'] as const).map((net) => (
                  <button
                    key={net}
                    onClick={() => setSelectedNetwork(net)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                      selectedNetwork === net
                        ? 'bg-[#EA0029] text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {net}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 leading-relaxed font-sans relative">
              <p className="whitespace-pre-line">{achievement.suggestedCaption}</p>
            </div>

            {/* Non-automatic publishing notice */}
            <p className="text-[11px] text-zinc-400 italic">
              * Nota: Em conformidade com as diretrizes de privacidade e segurança, a postagem nunca é feita de forma automática. Você tem controle total para copiar a legenda e o card antes de divulgar.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-6 border-t border-zinc-100 bg-zinc-50 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleCopyCardText}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            {copiedCard ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCard ? 'Texto Copiado!' : 'Copiar Resumo do Card'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCaption}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
            >
              {copiedCaption ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCaption ? 'Legenda Copiada!' : 'Copiar Legenda'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir WhatsApp</span>
            </button>

            <button
              onClick={handleShareLinkedIn}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0077B5] text-white text-xs font-bold hover:bg-[#006097] transition-colors cursor-pointer shadow-xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir LinkedIn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
