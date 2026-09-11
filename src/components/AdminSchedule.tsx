import { useState, useMemo, FormEvent } from 'react';
import {
  Calendar as CalendarIcon,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  Phone,
  Plus,
  DollarSign,
  TrendingUp,
  UserCheck,
  Search,
  Scissors,
  X,
  Send,
  AlertCircle
} from 'lucide-react';
import { Barber, Service, Appointment, AppointmentStatus } from '../types';
import {
  BUSINESS_HOURS,
  formatCurrencyBRL,
  formatPhoneMask,
  createWhatsAppMessageUrl
} from '../lib/dateUtils';

interface AdminScheduleProps {
  barbers: Barber[];
  services: Service[];
  appointments: Appointment[];
  onUpdateStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  onDeleteAppointment: (id: string) => Promise<void>;
  onCreateManualAppointment: (data: Omit<Appointment, 'id' | 'created_at'>) => Promise<Appointment>;
  onAddService: (service: Omit<Service, 'id'>) => Promise<void>;
}

export function AdminSchedule({
  barbers,
  services,
  appointments,
  onUpdateStatus,
  onDeleteAppointment,
  onCreateManualAppointment,
  onAddService,
}: AdminScheduleProps) {
  const getTodayIso = () => new Date().toISOString().split('T')[0];

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIso());
  const [barberFilter, setBarberFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);

  // Manual appointment form state
  const [manualClientName, setManualClientName] = useState('');
  const [manualClientPhone, setManualClientPhone] = useState('');
  const [manualBarberId, setManualBarberId] = useState(barbers[0]?.id || '');
  const [manualServiceId, setManualServiceId] = useState(services[0]?.id || '');
  const [manualTime, setManualTime] = useState('10:00');
  const [manualDate, setManualDate] = useState(getTodayIso());
  const [manualNotes, setManualNotes] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // New Service form state
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<'cabelo' | 'barba' | 'combo' | 'tratamento'>('cabelo');
  const [newServicePrice, setNewServicePrice] = useState('45');
  const [newServiceDuration, setNewServiceDuration] = useState('30');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [serviceSubmitting, setServiceSubmitting] = useState(false);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Date filter
      if (selectedDate && apt.appointment_date !== selectedDate) return false;
      // Barber filter
      if (barberFilter !== 'all' && apt.barber_id !== barberFilter) return false;
      // Status filter
      if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
      // Search query (client name or phone or service)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          apt.client_name.toLowerCase().includes(q) ||
          apt.client_phone.includes(q) ||
          (apt.service_name && apt.service_name.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [appointments, selectedDate, barberFilter, statusFilter, searchQuery]);

  // Day metrics
  const dayMetrics = useMemo(() => {
    const dayApts = appointments.filter((a) => a.appointment_date === selectedDate && a.status !== 'cancelled');
    const totalEarnings = dayApts.reduce((acc, curr) => acc + (curr.total_price || 0), 0);
    const completedCount = dayApts.filter((a) => a.status === 'completed').length;
    const pendingCount = dayApts.filter((a) => a.status === 'pending').length;
    const confirmedCount = dayApts.filter((a) => a.status === 'confirmed').length;

    return {
      total: dayApts.length,
      earnings: totalEarnings,
      completed: completedCount,
      pending: pendingCount,
      confirmed: confirmedCount,
    };
  }, [appointments, selectedDate]);

  // Handle manual appointment submit
  const handleCreateManual = async (e: FormEvent) => {
    e.preventDefault();
    if (!manualClientName.trim() || !manualServiceId) return;

    setManualSubmitting(true);
    try {
      const srv = services.find((s) => s.id === manualServiceId);
      const brb = barbers.find((b) => b.id === manualBarberId);

      await onCreateManualAppointment({
        client_name: manualClientName.trim(),
        client_phone: manualClientPhone.trim() || '(11) 99999-9999',
        barber_id: brb?.id || 'b1',
        barber_name: brb?.name || 'Barbeiro',
        service_id: srv?.id || 's1',
        service_name: srv?.name || 'Corte',
        appointment_date: manualDate,
        appointment_time: manualTime,
        duration_minutes: srv?.duration_minutes || 30,
        total_price: srv?.price || 50,
        notes: manualNotes.trim() || 'Agendamento balcão',
        status: 'confirmed',
      });

      setIsManualModalOpen(false);
      setManualClientName('');
      setManualClientPhone('');
      setManualNotes('');
    } finally {
      setManualSubmitting(false);
    }
  };

  // Handle new service submit
  const handleCreateService = async (e: FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    setServiceSubmitting(true);
    try {
      await onAddService({
        name: newServiceName.trim(),
        category: newServiceCategory,
        description: newServiceDesc.trim() || 'Serviço personalizado da barbearia.',
        price: parseFloat(newServicePrice) || 30,
        duration_minutes: parseInt(newServiceDuration, 10) || 30,
        popular: false,
      });

      setIsNewServiceModalOpen(false);
      setNewServiceName('');
      setNewServiceDesc('');
    } finally {
      setServiceSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-100 tracking-tight">
              Agenda & Gestão do Salão
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
              Painel Barbeiro
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Controle os atendimentos em tempo real, confirme horários e gerencie serviços.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsNewServiceModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-stone-100 hover:bg-stone-800 text-xs font-semibold transition-colors"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Novo Serviço</span>
          </button>

          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-md shadow-amber-500/10 transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Encaixe / Balcão</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">Total Agendamentos</span>
            <div className="p-2 rounded-lg bg-stone-900 text-stone-300">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-stone-100">
            {dayMetrics.total}
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {selectedDate === getTodayIso() ? 'Para hoje' : 'Na data selecionada'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">Faturamento Estimado</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-400">
            {formatCurrencyBRL(dayMetrics.earnings)}
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Valor total dos agendamentos
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">Confirmados</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400">
            {dayMetrics.confirmed}
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {dayMetrics.completed} já foram concluídos
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">Pendentes</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-300">
            {dayMetrics.pending}
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Aguardando atendimento
          </p>
        </div>
      </div>

      {/* Controls Bar: Date, Barber, Status and Search */}
      <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Selector */}
          <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2">
            <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-stone-200 focus:outline-none cursor-pointer"
            />
            {selectedDate !== getTodayIso() && (
              <button
                type="button"
                onClick={() => setSelectedDate(getTodayIso())}
                className="text-[10px] uppercase font-bold text-amber-400 hover:underline ml-1"
              >
                Hoje
              </button>
            )}
          </div>

          {/* Barber Filter */}
          <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={barberFilter}
              onChange={(e) => setBarberFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-stone-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-stone-900 text-stone-200">Todos os Barbeiros</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id} className="bg-stone-900 text-stone-200">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-stone-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-stone-900 text-stone-200">Todos os Status</option>
              <option value="confirmed" className="bg-stone-900 text-stone-200">Confirmados</option>
              <option value="pending" className="bg-stone-900 text-stone-200">Pendentes</option>
              <option value="completed" className="bg-stone-900 text-stone-200">Concluídos</option>
              <option value="cancelled" className="bg-stone-900 text-stone-200">Cancelados</option>
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente ou serviço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-500 placeholder-stone-500"
          />
        </div>
      </div>

      {/* Appointments List / Grid */}
      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-stone-950/40 border border-stone-800/60 space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-900 text-stone-500 flex items-center justify-center mx-auto">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-200 text-base">Nenhum agendamento encontrado</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Não há agendamentos cadastrados para esta data ou filtros selecionados. Clique em "Encaixe / Balcão" para adicionar um cliente.
            </p>
          </div>
        ) : (
          filteredAppointments.map((apt) => {
            const statusConfig = {
              confirmed: { label: 'Confirmado', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
              pending: { label: 'Pendente', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
              completed: { label: 'Concluído', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
              cancelled: { label: 'Cancelado', bg: 'bg-red-500/10 text-red-400 border-red-500/20' },
            }[apt.status] || { label: apt.status, bg: 'bg-stone-800 text-stone-300' };

            return (
              <div
                key={apt.id}
                className="p-4 sm:p-5 rounded-2xl bg-stone-950/80 border border-stone-800/80 hover:border-stone-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
              >
                {/* Time & Service info */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-stone-900 border border-stone-800 text-amber-400 shrink-0">
                    <span className="text-sm font-extrabold">{apt.appointment_time}</span>
                    <span className="text-[10px] text-stone-400 font-medium">
                      {apt.duration_minutes}m
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-stone-100 text-sm sm:text-base">
                        {apt.client_name}
                      </h3>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${statusConfig.bg}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-stone-400 flex-wrap">
                      <span className="font-semibold text-stone-200">{apt.service_name}</span>
                      <span>•</span>
                      <span className="text-amber-400/90 font-medium">{apt.barber_name}</span>
                      <span>•</span>
                      <span className="font-bold text-stone-200">
                        {formatCurrencyBRL(apt.total_price)}
                      </span>
                    </div>

                    {apt.notes && (
                      <p className="text-[11px] text-stone-400 italic">
                        "{apt.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions & WhatsApp Contact */}
                <div className="flex items-center gap-2 sm:gap-3 self-end md:self-center flex-wrap">
                  {/* WhatsApp direct link */}
                  <a
                    href={createWhatsAppMessageUrl(apt)}
                    target="_blank"
                    rel="noreferrer"
                    title="Falar no WhatsApp"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{apt.client_phone}</span>
                  </a>

                  {/* Status buttons */}
                  {apt.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(apt.id, 'completed')}
                      title="Marcar como Concluído"
                      className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-blue-950/50 text-stone-300 hover:text-blue-300 border border-stone-800 text-xs font-semibold transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5 inline mr-1 text-blue-400" />
                      Concluir
                    </button>
                  )}

                  {apt.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(apt.id, 'confirmed')}
                      title="Confirmar Agendamento"
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-colors"
                    >
                      Confirmar
                    </button>
                  )}

                  {apt.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(apt.id, 'cancelled')}
                      title="Cancelar Agendamento"
                      className="p-1.5 rounded-xl text-stone-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deseja realmente excluir o agendamento de ${apt.client_name}?`)) {
                        onDeleteAppointment(apt.id);
                      }
                    }}
                    title="Excluir Agendamento"
                    className="p-1.5 rounded-xl text-stone-500 hover:text-red-400 hover:bg-stone-900 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Encaixe / Agendamento Balcão */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
              <h3 className="font-bold text-stone-100 text-base">Novo Encaixe / Agendamento Manual</h3>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManual} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-300">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo"
                  value={manualClientName}
                  onChange={(e) => setManualClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-300">Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={manualClientPhone}
                  onChange={(e) => setManualClientPhone(formatPhoneMask(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-300">Serviço *</label>
                  <select
                    value={manualServiceId}
                    onChange={(e) => setManualServiceId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({formatCurrencyBRL(s.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-300">Barbeiro *</label>
                  <select
                    value={manualBarberId}
                    onChange={(e) => setManualBarberId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                  >
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-300">Data</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-300">Horário</label>
                  <select
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                  >
                    {BUSINESS_HOURS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-300">Observações (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Cliente aguardando na recepção"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-sm"
                >
                  {manualSubmitting ? 'Salvando...' : 'Confirmar Encaixe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Novo Serviço */}
      {isNewServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
              <h3 className="font-bold text-stone-100 text-base">Adicionar Novo Serviço ao Salão</h3>
              <button
                type="button"
                onClick={() => setIsNewServiceModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-300">Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Têmporas & Barboterapia Vip"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-300">Categoria</label>
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                  >
                    <option value="cabelo">Cabelo</option>
                    <option value="barba">Barba</option>
                    <option value="combo">Combo</option>
                    <option value="tratamento">Tratamento</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-300">Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-300">Duração (minutos)</label>
                  <input
                    type="number"
                    step="5"
                    required
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-300">Descrição do Serviço</label>
                <textarea
                  rows={2}
                  placeholder="Breve descrição dos passos ou benefícios do serviço..."
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsNewServiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={serviceSubmitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-sm"
                >
                  {serviceSubmitting ? 'Cadastrando...' : 'Cadastrar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
