import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  GraduationCap,
  Award,
  CheckCircle2,
  Search,
  RefreshCw,
  Building2,
  KeyRound,
  FileCheck,
  BarChart3,
  Copy,
  Check,
  Lock,
  UserCheck,
  UserX,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import { InternalUserProfile, MackEnadeRole, ScreenType } from '../types';
import {
  AdminUserItem,
  fetchAdminUsers,
  generateUserAccessCode,
  toggleUserLoginStatus,
} from '../services/pilotAuth';

interface ManagementDashboardScreenProps {
  currentUser: InternalUserProfile;
  onNavigate: (screen: ScreenType) => void;
  onSwitchViewRole?: (role: 'student' | 'professor') => void;
}

export const ManagementDashboardScreen: React.FC<ManagementDashboardScreenProps> = ({
  currentUser,
  onNavigate,
  onSwitchViewRole,
}) => {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUserItem[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [codeFilter, setCodeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal for displaying newly generated access code
  const [generatedModal, setGeneratedModal] = useState<{
    userName: string;
    email: string;
    code: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Course performance stats for Coordinator/Admin oversight
  const courseSummaries = [
    {
      course: 'Engenharia de Produção',
      department: 'Escola de Engenharia (EE)',
      enrolledCount: 384,
      simulationAdherence: 94.2,
      projectedScore: 4.8,
      status: 'Excelente',
      criticalArea: 'Pesquisa Operacional & Engenharia Econômica',
    },
    {
      course: 'Engenharia Civil',
      department: 'Escola de Engenharia (EE)',
      enrolledCount: 290,
      simulationAdherence: 89.6,
      projectedScore: 4.5,
      status: 'Bom',
      criticalArea: 'Sistemas Estruturais & Mecânica dos Solos',
    },
    {
      course: 'Ciência da Computação',
      department: 'FCI',
      enrolledCount: 312,
      simulationAdherence: 96.1,
      projectedScore: 4.7,
      status: 'Excelente',
      criticalArea: 'Algoritmos e Estruturas de Dados',
    },
  ];

  // Fetch users from pilot admin API
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Falha ao carregar diretório de usuários:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users
  useEffect(() => {
    let result = [...users];

    if (roleFilter !== 'ALL') {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (statusFilter === 'ACTIVE') {
      result = result.filter((u) => u.loginActive);
    } else if (statusFilter === 'INACTIVE') {
      result = result.filter((u) => !u.loginActive);
    }

    if (codeFilter === 'WITH_CODE') {
      result = result.filter((u) => u.hasAccessCode);
    } else if (codeFilter === 'WITHOUT_CODE') {
      result = result.filter((u) => !u.hasAccessCode);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.course.toLowerCase().includes(q)
      );
    }

    setFilteredUsers(result);
  }, [users, roleFilter, statusFilter, codeFilter, searchQuery]);

  // Generate / Regenerate access code handler
  const handleGenerateCode = async (user: AdminUserItem) => {
    try {
      const res = await generateUserAccessCode(user.email, user.role);
      // Update local state: hasAccessCode is now true
      setUsers((prev) =>
        prev.map((u) => (u.email === user.email ? { ...u, hasAccessCode: true } : u))
      );
      setCopiedCode(false);
      setGeneratedModal({
        userName: user.name,
        email: user.email,
        code: res.accessCode,
      });
      setActionSuccess(`Novo código de acesso gerado para ${user.name}`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar código de acesso.');
    }
  };

  // Toggle login active status
  const handleToggleLogin = async (user: AdminUserItem) => {
    const nextActive = !user.loginActive;
    try {
      await toggleUserLoginStatus(user.email, nextActive, user.role);
      setUsers((prev) =>
        prev.map((u) => (u.email === user.email ? { ...u, loginActive: nextActive } : u))
      );
      setActionSuccess(
        `Acesso de ${user.name} ${nextActive ? 'ativado' : 'desativado'} com sucesso.`
      );
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status de login.');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const getRoleBadge = (role: MackEnadeRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
            <Shield className="w-3 h-3 text-purple-700" />
            ADMIN
          </span>
        );
      case 'COORDINATOR':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
            <Building2 className="w-3 h-3 text-blue-700" />
            COORDENADOR
          </span>
        );
      case 'PROFESSOR':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
            <GraduationCap className="w-3 h-3 text-amber-700" />
            DOCENTE
          </span>
        );
      case 'STUDENT':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
            <UserCheck className="w-3 h-3 text-emerald-700" />
            ESTUDANTE
          </span>
        );
    }
  };

  return (
    <div id="mack-management-dashboard" className="min-h-screen bg-[#F8F9FA] pb-16">
      {/* Header Banner */}
      <div className="bg-white border-b border-zinc-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-[#EA0029] flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                    Painel de Gestão Mack ENADE
                  </h1>
                  {getRoleBadge(currentUser.role)}
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Banco Google Sheets Piloto Conectado
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                  Gestão de acessos por e-mail e código, monitoramento de cursos e controle de participantes do piloto
                </p>
              </div>
            </div>

            {/* Quick View Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {onSwitchViewRole && (
                <>
                  <button
                    onClick={() => {
                      onSwitchViewRole('student');
                      onNavigate('dashboard');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Inspecionar Visão Aluno</span>
                  </button>
                  <button
                    onClick={() => {
                      onSwitchViewRole('professor');
                      onNavigate('professor-dashboard');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#EA0029] bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors cursor-pointer border border-red-100"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Inspecionar Painel Docente</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Executive Institutional Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Usuários no Piloto
              </span>
              <div className="w-8 h-8 rounded-lg bg-red-50 text-[#EA0029] flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-zinc-900 mt-2">{users.length}</p>
            <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              Origem: Google Sheets oficial
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Logins Ativos
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-zinc-900 mt-2">
              {users.filter((u) => u.loginActive).length}
            </p>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">
              Habilitados para login imediato
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Códigos Configurados
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <KeyRound className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-zinc-900 mt-2">
              {users.filter((u) => u.hasAccessCode).length}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">Com chave individual ativa</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Adesão Simulados
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-zinc-900 mt-2">92.8%</p>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">Engajamento satisfatório</p>
          </div>
        </div>

        {/* Access Control & Pilot Architecture Panel */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/90 shadow-2xs">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Arquitetura de Acesso do Piloto Mack ENADE (Base Google Sheets)
                </h3>
                <p className="text-xs text-zinc-500">
                  Modelo controlado por E-mail Cadastrado + Código de Acesso Individual
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Planilha: 1s821ayXfONNpZkcQ3loP--MINepO0IybpkeUB0_ZNDs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
            <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80">
              <p className="font-bold text-zinc-800 flex items-center gap-1.5 mb-1">
                <KeyRound className="w-3.5 h-3.5 text-[#EA0029]" />
                Códigos de Acesso Individuais
              </p>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                Cada aluno e docente possui um código alfanumérico único. Por segurança estrita, o código nunca é enviado ao navegador em listagens públicas.
              </p>
            </div>

            <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80">
              <p className="font-bold text-zinc-800 flex items-center gap-1.5 mb-1">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                Proteção Rate Limit
              </p>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                Tentativas consecutivas de acesso incorreto são bloqueadas temporariamente por IP, protegendo a plataforma contra ataques de força bruta.
              </p>
            </div>

            <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80">
              <p className="font-bold text-zinc-800 flex items-center gap-1.5 mb-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                Gestão da Coordenação
              </p>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                Coordenadores e Administradores podem gerar novos códigos, ativar ou desativar logins de participantes a qualquer momento na tabela abaixo.
              </p>
            </div>
          </div>
        </div>

        {/* Access Code Administration Section */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#EA0029]" />
                <span>Gestão de Acessos & Códigos do Piloto</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Controle de participantes cadastrados na planilha Google Sheets oficial
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadUsers}
                disabled={isLoading}
                className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                title="Atualizar lista"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="mt-4 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail institucional ou curso..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA0029] focus:border-transparent font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-zinc-500 font-bold text-[11px]">Papel:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="text-xs py-2 px-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA0029]"
                >
                  <option value="ALL">Todos os Papéis</option>
                  <option value="STUDENT">Estudante</option>
                  <option value="PROFESSOR">Docente</option>
                  <option value="COORDINATOR">Coordenador</option>
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-zinc-500 font-bold text-[11px]">Login:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs py-2 px-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA0029]"
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="ACTIVE">Apenas Ativos</option>
                  <option value="INACTIVE">Apenas Desativados</option>
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-zinc-500 font-bold text-[11px]">Código:</span>
                <select
                  value={codeFilter}
                  onChange={(e) => setCodeFilter(e.target.value)}
                  className="text-xs py-2 px-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA0029]"
                >
                  <option value="ALL">Todos</option>
                  <option value="WITH_CODE">Com Código</option>
                  <option value="WITHOUT_CODE">Sem Código</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-bold">Usuário / E-mail</th>
                  <th className="pb-3 font-bold">Papel</th>
                  <th className="pb-3 font-bold">Curso</th>
                  <th className="pb-3 font-bold text-center">Login Ativo</th>
                  <th className="pb-3 font-bold text-center">Status do Código</th>
                  <th className="pb-3 font-bold text-right">Ações de Acesso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400">
                      Nenhum participante encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id + u.role} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-800 font-bold flex items-center justify-center text-[11px]">
                            {u.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900">{u.name}</p>
                            <p className="text-[11px] text-zinc-500 font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">{getRoleBadge(u.role)}</td>
                      <td className="py-3.5">
                        <p className="text-zinc-800 font-semibold">{u.course}</p>
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            u.loginActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.loginActive ? 'bg-emerald-500' : 'bg-zinc-400'
                            }`}
                          />
                          {u.loginActive ? 'Ativo' : 'Desativado'}
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            u.hasAccessCode
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {u.hasAccessCode ? 'Código configurado: Sim' : 'Código configurado: Não'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleGenerateCode(u)}
                            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                            title={u.hasAccessCode ? 'Regenerar código' : 'Gerar código'}
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>{u.hasAccessCode ? 'Regenerar código' : 'Gerar código'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleLogin(u)}
                            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                              u.loginActive
                                ? 'text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border-zinc-200'
                                : 'text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                            }`}
                          >
                            {u.loginActive ? (
                              <>
                                <UserX className="w-3 h-3 text-zinc-500" />
                                <span>Desativar login</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3 text-emerald-600" />
                                <span>Ativar login</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Course Performance Table */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#EA0029]" />
              <span>Desempenho Geral por Curso & Unidade Acadêmica</span>
            </h3>
            <span className="text-xs text-zinc-400">Ciclo Trienal ENADE</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-bold">Curso / Componente</th>
                  <th className="pb-3 font-bold">Unidade</th>
                  <th className="pb-3 font-bold text-center">Inscritos</th>
                  <th className="pb-3 font-bold text-center">Adesão</th>
                  <th className="pb-3 font-bold text-center">Nota Prevista</th>
                  <th className="pb-3 font-bold">Área Crítica de Acompanhamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                {courseSummaries.map((c, i) => (
                  <tr key={i} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 font-bold text-zinc-900">{c.course}</td>
                    <td className="py-3 text-zinc-500">{c.department}</td>
                    <td className="py-3 text-center">{c.enrolledCount}</td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        {c.simulationAdherence}%
                      </span>
                    </td>
                    <td className="py-3 text-center font-bold text-[#EA0029]">{c.projectedScore}</td>
                    <td className="py-3 text-zinc-600 text-[11px]">{c.criticalArea}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Novo Código de Acesso Gerado (Requirement 17) */}
      {generatedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-zinc-900 text-center mb-1">
              Novo código de acesso gerado.
            </h3>
            <p className="text-xs text-zinc-500 text-center mb-4">
              Código atualizado para o usuário{' '}
              <span className="font-bold text-zinc-800">{generatedModal.userName}</span> (
              <span className="font-mono text-zinc-600">{generatedModal.email}</span>). O código anterior foi invalidado imediatamente.
            </p>

            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-center mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Código de Acesso Individual
              </span>
              <span className="text-2xl font-black font-mono tracking-widest text-[#EA0029]">
                {generatedModal.code}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                id="btn-copy-access-code"
                onClick={() => handleCopyCode(generatedModal.code)}
                className="flex-1 py-2.5 px-4 bg-[#EA0029] hover:bg-[#D30026] text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-red-500/20 cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Código copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar código</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setGeneratedModal(null)}
                className="py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Por segurança, este código é exibido apenas neste momento. Não compartilhe este código publicamente.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
