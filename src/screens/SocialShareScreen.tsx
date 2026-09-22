import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  Award,
  Sparkles,
  ExternalLink,
  GraduationCap,
  Calendar,
  Building,
  ArrowRight,
} from 'lucide-react';
import { InstitutionalAchievement } from '../types';
import { initialInstitutionalAchievements } from '../data/mockData';
import { UPMLogo } from '../components/UPMLogo';
import { SocialShareModal } from '../components/SocialShareModal';

export const SocialShareScreen: React.FC = () => {
  const [achievements, setAchievements] = useState<InstitutionalAchievement[]>(initialInstitutionalAchievements);
  const [selectedAchievement, setSelectedAchievement] = useState<InstitutionalAchievement | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await fetch('/api/professor/institutional-achievements');
        const ct = res.headers.get('content-type');
        if (res.ok && ct && ct.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setAchievements(data);
          }
        }
      } catch (err) {
        console.warn('Using default institutional achievements:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  const handleCopyCaption = (ach: InstitutionalAchievement) => {
    navigator.clipboard.writeText(ach.suggestedCaption);
    setCopiedId(ach.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-[#EA0029] border border-red-200">
                Divulgação Institucional
              </span>
              <span className="text-xs font-semibold text-zinc-500">
                Universidade Presbiteriana Mackenzie
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Conquistas Institucionais & Cards Sociais
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-2xl leading-relaxed">
              Gere cards visuais oficiais e legendas sugeridas para celebrar os marcos de preparação no LinkedIn, Instagram e WhatsApp.
            </p>
          </div>

          <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs text-zinc-500 max-w-xs">
            <span className="font-bold text-zinc-800 block mb-0.5">Diretriz de Segurança:</span>
            A publicação é 100% controlada pelo usuário. O sistema nunca posta automaticamente em redes sociais.
          </div>
        </div>
      </div>

      {/* Grid of Institutional Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
          >
            {/* Top Card Preview Miniature */}
            <div className="p-6 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#EA0029]" />
              <div className="flex items-center justify-between mb-4">
                <UPMLogo size="sm" variant="footer" />
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-600/30 text-red-300 border border-red-500/40">
                  {ach.category}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{ach.metric}</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
                    {ach.metricValue}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-zinc-100 line-clamp-2 mt-1">{ach.title}</h3>
              </div>
            </div>

            {/* Card Content & Suggested Caption Preview */}
            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3">
                  {ach.description}
                </p>

                <div className="mt-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-500 font-sans line-clamp-3">
                  "{ach.suggestedCaption.slice(0, 150)}..."
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCopyCaption(ach)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  {copiedId === ach.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedId === ach.id ? 'Copiado!' : 'Copiar Legenda'}</span>
                </button>

                <button
                  onClick={() => setSelectedAchievement(ach)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EA0029] text-white text-xs font-bold hover:bg-[#c90023] transition-colors cursor-pointer shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Ver Card & Compartilhar</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Share Modal */}
      {selectedAchievement && (
        <SocialShareModal
          achievement={selectedAchievement}
          isOpen={true}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </div>
  );
};
