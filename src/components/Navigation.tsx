import React, { useState } from 'react';
import {
  LayoutDashboard,
  Target,
  FileCheck2,
  TrendingUp,
  Award,
  HelpCircle,
  Flame,
  Zap,
  LogOut,
  ChevronDown,
  User,
  GraduationCap,
  MessageSquare,
  BarChart3,
  Swords,
  Share2,
  Sparkles,
  BookOpen,
  Gift,
  Shield,
  Building2,
} from 'lucide-react';

import { UPMLogo } from './UPMLogo';
import { PWAInstallButton } from './PWAController';
import { ScreenType, Student, Professor, UserRole, InternalUserProfile } from '../types';

interface NavigationProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  userRole: UserRole;
  student: Student;
  professor?: Professor;
  currentUser?: InternalUserProfile | null;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentScreen,
  onNavigate,
  userRole,
  student,
  professor,
  currentUser,
  onSwitchRole,
  onLogout,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const studentNavItems: { id: ScreenType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'rewards', label: 'Recompensas', icon: Gift },
    { id: 'today-mission', label: 'Missões', icon: Target },
    { id: 'question', label: 'Questões', icon: HelpCircle },
    { id: 'simulation', label: 'Simulados', icon: FileCheck2 },
    { id: 'progress', label: 'Progresso', icon: TrendingUp },
    { id: 'achievements', label: 'Conquistas', icon: Award },
  ];

  const professorNavItems: { id: ScreenType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'professor-dashboard', label: 'Painel Docente', icon: LayoutDashboard },
    { id: 'professor-rewards', label: 'Recompensas', icon: Gift },
    { id: 'professor-questions', label: 'Banco & Criar', icon: HelpCircle },
    { id: 'professor-mentorship', label: 'Mentoria & Dúvidas', icon: MessageSquare },
    { id: 'professor-class-performance', label: 'Turma', icon: BarChart3 },
    { id: 'professor-challenges', label: 'Desafios & Chefes', icon: Swords },
    { id: 'professor-social-share', label: 'Compartilhar', icon: Share2 },
  ];

  const managementNavItems: { id: ScreenType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'management-dashboard', label: 'Painel de Gestão', icon: Shield },
    { id: 'professor-dashboard', label: 'Painel Docente', icon: LayoutDashboard },
    { id: 'dashboard', label: 'Visão Estudante', icon: Target },
  ];

  const navItems =
    userRole === 'coordinator' || userRole === 'admin'
      ? managementNavItems
      : userRole === 'professor'
      ? professorNavItems
      : studentNavItems;

  return (
    <>
      {/* Desktop & Tablet Top Bar */}
      <header
        id="mack-main-header"
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/90 shadow-xs"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate(userRole === 'professor' ? 'professor-dashboard' : 'dashboard')}
              className="cursor-pointer focus:outline-none"
            >
              <UPMLogo size="md" variant="header" />
            </button>
            <span className="hidden md:inline-flex items-center text-[10px] font-bold text-zinc-500 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full font-sans tracking-wide">
              Versão Piloto
            </span>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-link-${item.id}`}
                    onClick={() => onNavigate(item.id)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-red-50 text-[#EA0029]'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#EA0029]' : 'text-zinc-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Status & Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Install PWA Button (only visible when installable and not installed) */}
            <PWAInstallButton variant="header" />

            {/* Quick Role Switcher Pill */}
            <div className="flex items-center p-0.5 bg-zinc-100 rounded-xl border border-zinc-200/80 text-[11px] font-bold">
              <button
                onClick={() => onSwitchRole('student')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  userRole === 'student'
                    ? 'bg-white text-[#EA0029] shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Estudante
              </button>
              <button
                onClick={() => onSwitchRole('professor')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  userRole === 'professor'
                    ? 'bg-[#EA0029] text-white shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Docente
              </button>
            </div>

            {/* Student Gamification Pills (only shown if student) */}
            {userRole === 'student' && (
              <>
                {/* Streak Indicator Pill */}
                <div
                  onClick={() => onNavigate('dashboard')}
                  className="hidden sm:flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200/80 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs cursor-pointer hover:bg-orange-100 transition-colors"
                  title="Ofensiva de Estudos"
                >
                  <Flame className="w-4 h-4 fill-orange-500 text-orange-600" />
                  <span>{student.studyStreak}d</span>
                </div>

                {/* XP Indicator Pill */}
                <div
                  onClick={() => onNavigate('achievements')}
                  className="flex items-center gap-1.5 bg-zinc-900 text-amber-400 border border-zinc-800 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs cursor-pointer hover:bg-zinc-800 transition-colors"
                  title="Pontos de Experiência"
                >
                  <Zap className="w-3.5 h-3.5 fill-current text-amber-400" />
                  <span>{student.xp} XP</span>
                </div>
              </>
            )}

            {/* User Dropdown */}
            <div className="relative">
              <button
                id="user-profile-menu-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-[#EA0029] text-white flex items-center justify-center font-bold text-xs">
                  {userRole === 'professor'
                    ? 'PM'
                    : student.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                </div>
                <span className="hidden md:block text-xs font-bold text-zinc-800 truncate max-w-[130px]">
                  {userRole === 'professor'
                    ? professor?.name?.split(' ')[1] || 'Professor'
                    : student.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-zinc-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <div className="px-4 py-2 border-b border-zinc-100">
                    <p className="text-xs font-bold text-zinc-900 truncate">
                      {userRole === 'professor' ? professor?.name : student.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {userRole === 'professor' ? 'Docente & Orientador ENADE' : `RA: ${student.ra}`}
                    </p>
                    <p className="text-[11px] text-[#EA0029] font-medium truncate mt-0.5">
                      {userRole === 'professor'
                        ? professor?.department
                        : `${student.course} • ${student.semester}º Sem.`}
                    </p>
                  </div>

                  <div className="px-2 py-1">
                    {userRole === 'student' ? (
                      <>
                        <button
                          onClick={() => onNavigate('dashboard')}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 text-zinc-500" />
                          <span>Painel Geral</span>
                        </button>
                        <button
                          onClick={() => onNavigate('achievements')}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <Award className="w-4 h-4 text-zinc-500" />
                          <span>Minhas Conquistas</span>
                        </button>
                        <button
                          onClick={() => onNavigate('rewards')}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <Gift className="w-4 h-4 text-[#EA0029]" />
                          <span>Central de Recompensas</span>
                        </button>
                        <button
                          onClick={() => onNavigate('progress')}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <TrendingUp className="w-4 h-4 text-zinc-500" />
                          <span>Relatório de Desempenho</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onNavigate('professor-dashboard')}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 text-zinc-500" />
                          <span>Painel Docente</span>
                        </button>
                        <button
                          onClick={() => onNavigate('professor-rewards')}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <Gift className="w-4 h-4 text-[#EA0029]" />
                          <span>Gestor de Recompensas</span>
                        </button>
                        <button
                          onClick={() => onNavigate('professor-questions')}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <HelpCircle className="w-4 h-4 text-zinc-500" />
                          <span>Banco de Questões</span>
                        </button>
                        <button
                          onClick={() => onNavigate('professor-social-share')}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <Share2 className="w-4 h-4 text-[#EA0029]" />
                          <span>Conquistas Institucionais</span>
                        </button>
                      </>

                    )}
                  </div>

                  <div className="px-2 pt-1 border-t border-zinc-100 space-y-1">
                    <PWAInstallButton variant="menu" />
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Encerrar Sessão</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div
        id="mobile-bottom-nav"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/90 px-2 py-1.5 shadow-lg"
      >
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[52px] ${
                  isActive ? 'text-[#EA0029] font-bold' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#EA0029] stroke-[2.5]' : 'stroke-[1.8]'}`} />
                <span className="text-[10px] mt-0.5 truncate max-w-[60px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
