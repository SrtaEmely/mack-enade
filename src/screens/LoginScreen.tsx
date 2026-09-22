import React, { useState } from 'react';
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Loader2,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  HelpCircle,
  Compass,
} from 'lucide-react';
import { UPMLogo } from '../components/UPMLogo';
import { PWAInstallButton } from '../components/PWAController';
import { InternalUserProfile } from '../types';
import { loginWithEmailAndCode, APP_ENV } from '../services/pilotAuth';

interface LoginScreenProps {
  onLoginSuccess?: (profile: InternalUserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [secondaryMessage, setSecondaryMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState<InternalUserProfile | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanCode = accessCode.trim();

    if (!cleanEmail || !cleanCode) {
      setErrorMessage('E-mail ou código de acesso inválido.');
      setSecondaryMessage('Verifique os dados informados e tente novamente.');
      return;
    }

    setIsAuthenticating(true);
    setErrorMessage(null);
    setSecondaryMessage(null);
    setSuccessNotice(null);

    try {
      const profile = await loginWithEmailAndCode(cleanEmail, cleanCode);
      setIsAuthenticating(false);

      // Show First Login Experience modal
      setWelcomeUser(profile);
    } catch (err: any) {
      setIsAuthenticating(false);
      setErrorMessage(err.message || 'E-mail ou código de acesso inválido.');
      setSecondaryMessage(
        err.secondaryMessage || 'Verifique os dados informados e tente novamente.'
      );
    }
  };

  const handleStartJourney = () => {
    if (!welcomeUser) return;
    const profile = welcomeUser;
    setWelcomeUser(null);

    onLoginSuccess?.(profile);
  };



  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-between selection:bg-[#EA0029] selection:text-white">
      {/* Institutional Top Accent Bar */}
      <div className="h-1.5 w-full bg-[#EA0029]" />

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* PWA Install Button when available */}
          <div className="flex justify-center mb-4">
            <PWAInstallButton variant="hero" />
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-zinc-200/60 border border-zinc-200/80 overflow-hidden">
            {/* Header with Official Mackenzie Logo */}
            <div className="pt-8 pb-6 px-8 text-center bg-gradient-to-b from-red-50/40 via-white to-white border-b border-zinc-100">
              <div className="flex justify-center mb-4">
                <UPMLogo size="lg" variant="vertical" color="red" showEnadeBadge={false} />
              </div>

              <div className="mt-4">
                <h1 className="text-2xl font-black tracking-tight text-zinc-900 flex items-center justify-center gap-2">
                  <span>MACK ENADE</span>
                  <span className="bg-[#EA0029] text-white text-[11px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    PILOTO
                  </span>
                </h1>
                <p className="text-xs font-semibold text-[#EA0029] uppercase tracking-widest mt-1">
                  Prepare-se. Evolua. Conquiste.
                </p>
                <p className="text-xs text-zinc-500 mt-2 font-medium">
                  Acesso controlado ao piloto por e-mail e código individual.
                </p>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-8 pt-6">
              {/* Error Callout */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-5 p-4 rounded-xl bg-red-50/90 border border-red-200/80 text-red-900 animate-in fade-in slide-in-from-top-1 duration-200"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#EA0029] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold leading-snug">{errorMessage}</p>
                      {secondaryMessage && (
                        <p className="text-xs text-red-700 mt-1 leading-relaxed">
                          {secondaryMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Success Callout */}
              {successNotice && (
                <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-sm font-bold">{successNotice}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email-input"
                    className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5"
                  >
                    E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email-input"
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="seu.email@mackenzie.br"
                      disabled={isAuthenticating}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50/60 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#EA0029]/20 focus:border-[#EA0029] transition-colors font-medium disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Access Code Field with Show/Hide Eye Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="access-code-input"
                      className="block text-xs font-bold uppercase tracking-wider text-zinc-700"
                    >
                      Código de acesso
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowHelpModal(true)}
                      className="text-[11px] text-zinc-500 hover:text-[#EA0029] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Não sei meu código de acesso
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="access-code-input"
                      type={showAccessCode ? 'text' : 'password'}
                      required
                      value={accessCode}
                      onChange={(e) => {
                        setAccessCode(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Digite seu código de acesso"
                      disabled={isAuthenticating}
                      className="w-full pl-10 pr-11 py-3 bg-zinc-50/60 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#EA0029]/20 focus:border-[#EA0029] transition-colors font-mono tracking-wider font-semibold disabled:opacity-50"
                    />
                    <button
                      type="button"
                      id="btn-toggle-access-code"
                      aria-label={showAccessCode ? 'Ocultar código de acesso' : 'Exibir código de acesso'}
                      onClick={() => setShowAccessCode(!showAccessCode)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                    >
                      {showAccessCode ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Primary Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    id="btn-login-mack-enade"
                    disabled={isAuthenticating || !email.trim() || !accessCode.trim()}
                    className="w-full py-3.5 px-4 bg-[#EA0029] hover:bg-[#D30026] active:bg-[#B80020] text-white font-bold text-sm tracking-wide rounded-xl shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                  >
                    {isAuthenticating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Validando credenciais...</span>
                      </>
                    ) : (
                      <>
                        <span>ENTRAR NO MACK ENADE</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-zinc-400 mt-2.5 font-medium">
                    Utilize o e-mail e o código de acesso cadastrados para o piloto.
                  </p>
                </div>
              </form>

            </div>

            {/* Feature highlights badge */}
            <div className="px-8 py-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Autenticação controlada
              </span>
              <span className="flex items-center gap-1 font-semibold text-zinc-600">
                <Sparkles className="w-3 h-3 text-[#EA0029]" />
                ENADE 2026
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Pilot Footer Required by Guidelines */}
      <footer className="py-4 text-center text-xs text-zinc-400 border-t border-zinc-200/80 bg-white/60">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3">
          <span className="font-semibold text-zinc-600">Piloto Mack ENADE</span>
          <span className="hidden sm:inline text-zinc-300">•</span>
          <span className="bg-zinc-100 text-zinc-600 font-bold px-1.5 py-0.5 rounded text-[10px] border border-zinc-200">
            Versão Piloto ({APP_ENV})
          </span>
          <span className="hidden sm:inline text-zinc-300">•</span>
          <span>Universidade Presbiteriana Mackenzie</span>
        </div>
      </footer>

      {/* Modal: "Não sei meu código de acesso" */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200">
            <div className="w-12 h-12 rounded-full bg-red-50 text-[#EA0029] flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 text-center mb-2">
              Solicitação de Código de Acesso
            </h3>
            <p className="text-xs text-zinc-600 text-center leading-relaxed mb-5">
              Entre em contato com a coordenação do piloto Mack ENADE para solicitar seu código de acesso.
            </p>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 mb-5 text-[11px] text-zinc-500 space-y-1">
              <p className="font-semibold text-zinc-700">Coordenação ENADE & NDE Mackenzie:</p>
              <p>Email: <span className="font-mono text-zinc-700">coord.enade@mackenzie.br</span></p>
              <p>Escola de Engenharia (EE) - Prédio 6</p>
            </div>
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal: First Login Experience (Requirement 18) */}
      {welcomeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#EA0029] flex items-center justify-center mx-auto mb-4 border border-red-100">
              {welcomeUser.role === 'STUDENT' ? (
                <GraduationCap className="w-7 h-7" />
              ) : (
                <BookOpen className="w-7 h-7" />
              )}
            </div>

            {welcomeUser.role === 'STUDENT' ? (
              <>
                <h3 className="text-xl font-black text-zinc-900 mb-1">
                  Bem-vindo ao Mack ENADE!
                </h3>
                <p className="text-xs text-[#EA0029] font-bold uppercase tracking-wider mb-4">
                  Sua jornada de preparação oficial
                </p>

                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 mb-6 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Estudante:</span>
                    <span className="font-bold text-zinc-900">{welcomeUser.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Curso:</span>
                    <span className="font-bold text-[#EA0029]">{welcomeUser.course}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Turma:</span>
                    <span className="font-medium text-zinc-700">{welcomeUser.class}</span>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-start-journey"
                  onClick={handleStartJourney}
                  className="w-full py-3.5 px-4 bg-[#EA0029] hover:bg-[#D30026] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  <Compass className="w-4 h-4 transition-transform group-hover:rotate-45" />
                  <span>COMEÇAR MINHA JORNADA</span>
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-black text-zinc-900 mb-1">
                  Bem-vindo ao Mack ENADE, Professor!
                </h3>
                <p className="text-xs text-[#EA0029] font-bold uppercase tracking-wider mb-4">
                  Área Docente e Mentoria Mackenzie
                </p>

                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 mb-6 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Docente:</span>
                    <span className="font-bold text-zinc-900">{welcomeUser.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Área / Curso:</span>
                    <span className="font-bold text-[#EA0029]">{welcomeUser.course}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Perfil:</span>
                    <span className="font-medium text-zinc-700">{welcomeUser.department}</span>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-access-mentor-area"
                  onClick={handleStartJourney}
                  className="w-full py-3.5 px-4 bg-[#EA0029] hover:bg-[#D30026] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>ACESSAR ÁREA DO MENTOR</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
