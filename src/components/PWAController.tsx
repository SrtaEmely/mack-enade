import React, { useState } from 'react';
import {
  Download,
  WifiOff,
  RefreshCw,
  Share,
  PlusSquare,
  X,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

interface PWAControllerProps {
  // Can be rendered in header, login, profile, or standalone
  showInstallButtonInHeader?: boolean;
}

export const PWAController: React.FC<PWAControllerProps> = () => {
  const {
    isOnline,
    isInstalled,
    isIOS,
    isInstallAvailable,
    canPromptNative,
    needRefresh,
    installPWA,
    handleUpdate,
  } = usePWA();

  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleInstallClick = async () => {
    if (canPromptNative) {
      await installPWA();
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  const onUpdateClick = async () => {
    setIsUpdating(true);
    await handleUpdate();
  };

  return (
    <>
      {/* 1. Offline Indicator Banner */}
      {!isOnline && (
        <div
          id="pwa-offline-banner"
          role="alert"
          className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-zinc-950 font-semibold px-4 py-3 shadow-lg flex items-center justify-center gap-3 text-sm animate-in slide-in-from-top duration-300"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <WifiOff className="w-5 h-5 text-zinc-950 animate-pulse" />
          </div>
          <span className="text-center font-bold">
            Você está offline. Conecte-se à internet para continuar usando o Mack ENADE.
          </span>
        </div>
      )}

      {/* 2. New Version Available Prompt */}
      {needRefresh && (
        <div
          id="pwa-update-banner"
          role="alert"
          className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl border border-zinc-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-[#EA0029] flex items-center justify-center shrink-0">
              <RefreshCw className={`w-5 h-5 text-white ${isUpdating ? 'animate-spin' : ''}`} />
            </div>
            <p className="text-xs sm:text-sm font-bold leading-tight">
              Uma nova versão do Mack ENADE está disponível.
            </p>
          </div>
          <button
            id="pwa-update-button"
            onClick={onUpdateClick}
            disabled={isUpdating}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#EA0029] hover:bg-[#D30026] text-white text-xs font-black tracking-wider transition-all shadow-md active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isUpdating ? 'ATUALIZANDO...' : 'ATUALIZAR'}
          </button>
        </div>
      )}

      {/* 3. iOS Installation Instructions Modal */}
      {showIOSModal && (
        <div
          id="pwa-ios-modal"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-zinc-200 text-zinc-900 animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-100 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EA0029] flex items-center justify-center shadow-md">
                <img
                  src="/pwa-192x192.png"
                  alt="Mack ENADE"
                  className="w-10 h-10 rounded-xl object-cover"
                />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900 leading-tight">Instalar Mack ENADE</h3>
                <p className="text-xs text-zinc-500">Adicione à Tela de Início do iOS</p>
              </div>
            </div>

            <div className="bg-red-50/70 border border-red-100 rounded-2xl p-4 text-xs text-zinc-800 space-y-3 mb-5">
              <p className="font-bold text-[#EA0029]">
                No iPhone, toque em Compartilhar e depois em Adicionar à Tela de Início.
              </p>
              <div className="space-y-2 pt-1 border-t border-red-200/50">
                <div className="flex items-center gap-2.5 text-zinc-700">
                  <div className="w-6 h-6 rounded-lg bg-white shadow-xs border border-zinc-200 flex items-center justify-center text-blue-500">
                    <Share className="w-3.5 h-3.5" />
                  </div>
                  <span>1. No Safari, toque no ícone de <strong>Compartilhar</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-zinc-700">
                  <div className="w-6 h-6 rounded-lg bg-white shadow-xs border border-zinc-200 flex items-center justify-center text-zinc-700">
                    <PlusSquare className="w-3.5 h-3.5" />
                  </div>
                  <span>2. Role a lista e selecione <strong>Adicionar à Tela de Início</strong></span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Dedicated In-App Install Button component
 * Only displayed when PWA installation is available and the application is not already installed.
 */
export const PWAInstallButton: React.FC<{
  variant?: 'header' | 'hero' | 'card' | 'menu';
  className?: string;
}> = ({ variant = 'header', className = '' }) => {
  const { isInstalled, isInstallAvailable, canPromptNative, isIOS, installPWA } = usePWA();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed or installation is not available, do not render
  if (isInstalled || !isInstallAvailable) {
    return null;
  }

  const handleClick = async () => {
    if (canPromptNative) {
      await installPWA();
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  if (variant === 'menu') {
    return (
      <>
        <button
          id="pwa-install-menu-button"
          onClick={handleClick}
          className={`w-full text-left px-3 py-2 text-xs font-bold text-[#EA0029] bg-red-50 hover:bg-red-100/80 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4 text-[#EA0029]" />
          <span>Instalar Mack ENADE</span>
        </button>

        {showIOSModal && (
          <IOSModal onClose={() => setShowIOSModal(false)} />
        )}
      </>
    );
  }

  if (variant === 'hero') {
    return (
      <>
        <button
          id="pwa-install-hero-button"
          onClick={handleClick}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#EA0029] hover:bg-zinc-100 text-xs font-black shadow-md border border-zinc-200 transition-all cursor-pointer active:scale-95 ${className}`}
        >
          <Download className="w-4 h-4 text-[#EA0029]" />
          <span>Instalar Mack ENADE</span>
        </button>

        {showIOSModal && (
          <IOSModal onClose={() => setShowIOSModal(false)} />
        )}
      </>
    );
  }

  // Default header / pill button
  return (
    <>
      <button
        id="pwa-install-header-button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EA0029] hover:bg-[#D30026] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 animate-pulse hover:animate-none ${className}`}
        title="Instalar aplicativo Mack ENADE no seu dispositivo"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instalar Mack ENADE</span>
        <span className="sm:hidden">Instalar</span>
      </button>

      {showIOSModal && (
        <IOSModal onClose={() => setShowIOSModal(false)} />
      )}
    </>
  );
};

function IOSModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-zinc-200 text-zinc-900 animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-100 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EA0029] flex items-center justify-center shadow-md">
            <img
              src="/pwa-192x192.png"
              alt="Mack ENADE"
              className="w-10 h-10 rounded-xl object-cover"
            />
          </div>
          <div>
            <h3 className="text-base font-black text-zinc-900 leading-tight">Instalar Mack ENADE</h3>
            <p className="text-xs text-zinc-500">Adicione à Tela de Início do iOS</p>
          </div>
        </div>

        <div className="bg-red-50/70 border border-red-100 rounded-2xl p-4 text-xs text-zinc-800 space-y-3 mb-5">
          <p className="font-bold text-[#EA0029]">
            No iPhone, toque em Compartilhar e depois em Adicionar à Tela de Início.
          </p>
          <div className="space-y-2 pt-1 border-t border-red-200/50">
            <div className="flex items-center gap-2.5 text-zinc-700">
              <div className="w-6 h-6 rounded-lg bg-white shadow-xs border border-zinc-200 flex items-center justify-center text-blue-500">
                <Share className="w-3.5 h-3.5" />
              </div>
              <span>1. No Safari, toque no ícone de <strong>Compartilhar</strong></span>
            </div>
            <div className="flex items-center gap-2.5 text-zinc-700">
              <div className="w-6 h-6 rounded-lg bg-white shadow-xs border border-zinc-200 flex items-center justify-center text-zinc-700">
                <PlusSquare className="w-3.5 h-3.5" />
              </div>
              <span>2. Role a lista e selecione <strong>Adicionar à Tela de Início</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
