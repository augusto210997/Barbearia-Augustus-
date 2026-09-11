import { useState, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Scissors,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Phone,
  Mail,
  FileText,
  Star,
  Flame,
  Check,
  CalendarCheck,
  Send,
  Users,
  MessageCircle
} from 'lucide-react';
import { Barber, Service, Appointment, ServiceCategory } from '../types';
import {
  BUSINESS_HOURS,
  getUpcomingDays,
  formatCurrencyBRL,
  formatPhoneMask,
  isSlotAvailable,
  createWhatsAppMessageUrl,
  createWhatsAppDirectBookingUrl
} from '../lib/dateUtils';

interface BookingWizardProps {
  barbers: Barber[];
  services: Service[];
  appointments: Appointment[];
  onBookSuccess: (appointment: Omit<Appointment, 'id' | 'created_at'>) => Promise<Appointment>;
}

export function BookingWizard({
  barbers,
  services,
  appointments,
  onBookSuccess,
}: BookingWizardProps) {
  // Step state: 1 to 5
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedBarber, setSelectedBarber] = useState<Barber | null | 'any'>('any');
  
  const upcomingDays = getUpcomingDays(14);
  const [selectedDate, setSelectedDate] = useState<string>(upcomingDays[0]?.dateIso || '');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Client info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedAppointment, setCompletedAppointment] = useState<Appointment | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Filtered services
  const filteredServices = selectedCategory === 'todos'
    ? services
    : services.filter((s) => s.category === selectedCategory);

  const categories: { key: string; label: string }[] = [
    { key: 'todos', label: 'Todos os Serviços' },
    { key: 'cabelo', label: 'Cortes de Cabelo' },
    { key: 'barba', label: 'Barba & Navalha' },
    { key: 'combo', label: 'Combos Especiais' },
    { key: 'tratamento', label: 'Tratamentos' },
  ];

  // Handler for phone change with mask
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    setClientPhone(formatPhoneMask(e.target.value));
  };

  // Submit appointment
  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      setFormError('Por favor, verifique serviço, data e horário.');
      return;
    }

    if (!clientName.trim() || clientPhone.replace(/\D/g, '').length < 10) {
      setFormError('Por favor, informe seu nome e um número de WhatsApp válido.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      // Determina barbeiro
      let resolvedBarber: Barber | undefined;
      if (selectedBarber === 'any' || !selectedBarber) {
        // Encontra o primeiro barbeiro ativo sem conflito nesse slot
        resolvedBarber = barbers.find((b) =>
          b.active && isSlotAvailable(selectedTime, selectedDate, b.id, appointments)
        ) || barbers[0];
      } else {
        resolvedBarber = selectedBarber;
      }

      const appointmentPayload: Omit<Appointment, 'id' | 'created_at'> = {
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        client_email: clientEmail.trim() || undefined,
        barber_id: resolvedBarber?.id || 'any',
        barber_name: resolvedBarber?.name || 'Qualquer Profissional',
        service_id: selectedService.id,
        service_name: selectedService.name,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        duration_minutes: selectedService.duration_minutes,
        total_price: selectedService.price,
        notes: clientNotes.trim() || undefined,
        status: 'confirmed',
      };

      const created = await onBookSuccess(appointmentPayload);
      setCompletedAppointment(created);
      setCurrentStep(5);
    } catch (err) {
      setFormError('Ocorreu um erro ao registrar o agendamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to start a new appointment
  const handleReset = () => {
    setSelectedService(null);
    setSelectedBarber('any');
    setSelectedTime('');
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setClientNotes('');
    setCompletedAppointment(null);
    setCurrentStep(1);
  };

  // Check if current step can advance
  const canAdvance = () => {
    if (currentStep === 1) return selectedService !== null;
    if (currentStep === 2) return selectedBarber !== null;
    if (currentStep === 3) return selectedDate !== '' && selectedTime !== '';
    if (currentStep === 4) return clientName.trim().length >= 3 && clientPhone.replace(/\D/g, '').length >= 10;
    return true;
  };

  const stepsLabels = [
    { num: 1, label: 'Serviço' },
    { num: 2, label: 'Barbeiro' },
    { num: 3, label: 'Data & Hora' },
    { num: 4, label: 'Seus Dados' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Step Indicator Header (if not on completed step) */}
      {currentStep < 5 && (
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-stone-800 -z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-amber-500 transition-all duration-300 -z-0"
              style={{ width: `${((currentStep - 1) / (stepsLabels.length - 1)) * 100}%` }}
            />

            {stepsLabels.map((s) => {
              const isDone = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center relative z-10">
                  <button
                    type="button"
                    disabled={currentStep < s.num}
                    onClick={() => currentStep > s.num && setCurrentStep(s.num)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isDone
                        ? 'bg-amber-500 text-stone-950 ring-4 ring-stone-950'
                        : isCurrent
                        ? 'bg-stone-950 text-amber-400 border-2 border-amber-500 ring-4 ring-stone-950'
                        : 'bg-stone-800 text-stone-400 border border-stone-700 ring-4 ring-stone-950'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                  </button>
                  <span
                    className={`text-[11px] font-medium mt-2 whitespace-nowrap ${
                      isCurrent ? 'text-amber-400 font-semibold' : 'text-stone-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Container Card */}
      <div className="bg-stone-950/70 border border-stone-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
        <AnimatePresence mode="wait">
          {/* ========================================================================= */}
          {/* ETAPA 1: ESCOLHA DO SERVIÇO */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Passo 1 de 4</span>
                <h2 className="text-2xl font-bold text-stone-100 tracking-tight mt-1">
                  Qual serviço você gostaria de agendar?
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Selecione o corte, barba ou combo de sua preferência.
                </p>
              </div>

              {/* WhatsApp Fast Booking Option */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-200">Prefere agendar pelo WhatsApp?</p>
                    <p className="text-[11px] text-stone-400">Atendimento rápido para tirar dúvidas e reservar seu horário diretamente.</p>
                  </div>
                </div>
                <a
                  href={createWhatsAppDirectBookingUrl('5511987654321')}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs shadow-md shadow-emerald-600/20 transition-all shrink-0"
                >
                  <MessageCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Agendar no WhatsApp</span>
                </a>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat.key
                        ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10'
                        : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Services Grid */}
              <div className="grid sm:grid-cols-2 gap-3.5">
                {filteredServices.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                          : 'bg-stone-900/50 border-stone-800/80 hover:border-stone-700 hover:bg-stone-900'
                      }`}
                    >
                      {service.popular && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>Popular</span>
                        </div>
                      )}

                      <div>
                        <h3 className="font-bold text-stone-100 text-base group-hover:text-amber-400 transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-xs text-stone-400 mt-1.5 leading-relaxed line-clamp-2">
                          {service.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-2 border-t border-stone-800/60">
                        <div className="flex items-center gap-1.5 text-xs text-stone-400">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>{service.duration_minutes} min</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-base font-extrabold text-amber-400">
                            {formatCurrencyBRL(service.price)}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                              isSelected
                                ? 'bg-amber-500 border-amber-500 text-stone-950'
                                : 'border-stone-700 bg-stone-950'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 2: ESCOLHA DO BARBEIRO */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Passo 2 de 4</span>
                <h2 className="text-2xl font-bold text-stone-100 tracking-tight mt-1">
                  Com quem você prefere ser atendido?
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Nossos profissionais são especialistas certificados em cortes masculinos e barboterapia.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5">
                {/* Opção: Qualquer Barbeiro */}
                <div
                  onClick={() => setSelectedBarber('any')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${
                    selectedBarber === 'any'
                      ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                      : 'bg-stone-900/50 border-stone-800/80 hover:border-stone-700 hover:bg-stone-900'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400 shrink-0">
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-stone-100 text-sm">Qualquer Profissional</h3>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Mais Rápido
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Encaixe imediato com o primeiro barbeiro com horário livre.
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                      selectedBarber === 'any'
                        ? 'bg-amber-500 border-amber-500 text-stone-950'
                        : 'border-stone-700 bg-stone-950'
                    }`}
                  >
                    {selectedBarber === 'any' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Cards de cada Barbeiro */}
                {barbers.filter((b) => b.active).map((barber) => {
                  const isSelected = selectedBarber !== 'any' && selectedBarber?.id === barber.id;
                  return (
                    <div
                      key={barber.id}
                      onClick={() => setSelectedBarber(barber)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                          : 'bg-stone-900/50 border-stone-800/80 hover:border-stone-700 hover:bg-stone-900'
                      }`}
                    >
                      <img
                        src={barber.avatar_url}
                        alt={barber.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-xl object-cover border border-stone-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-stone-100 text-sm truncate">
                            {barber.name}
                          </h3>
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{barber.rating}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-stone-400 truncate mt-0.5">
                          {barber.role}
                        </p>
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {barber.specialties.slice(0, 2).map((sp, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 border border-stone-700/60"
                            >
                              {sp}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-amber-500 border-amber-500 text-stone-950'
                            : 'border-stone-700 bg-stone-950'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 3: DATA E HORÁRIO */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Passo 3 de 4</span>
                <h2 className="text-2xl font-bold text-stone-100 tracking-tight mt-1">
                  Escolha o melhor dia e horário
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Atendimento de segunda a sábado das 09:00 às 20:00.
                </p>
              </div>

              {/* Days Carousel/List */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2.5">
                  1. Selecione o Dia
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  {upcomingDays.slice(0, 7).map((d) => {
                    const isSelected = selectedDate === d.dateIso;
                    return (
                      <button
                        key={d.dateIso}
                        type="button"
                        onClick={() => {
                          setSelectedDate(d.dateIso);
                          setSelectedTime(''); // reseta horário ao trocar o dia
                        }}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md shadow-amber-500/20'
                            : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                        }`}
                      >
                        <span className={`text-[10px] uppercase font-bold ${isSelected ? 'text-stone-900' : 'text-stone-400'}`}>
                          {d.weekdayShort}
                        </span>
                        <span className="text-lg font-extrabold mt-0.5">
                          {d.dayNumber}
                        </span>
                        <span className={`text-[9px] font-medium mt-0.5 ${isSelected ? 'text-stone-950' : 'text-amber-400'}`}>
                          {d.isToday ? 'Hoje' : d.isTomorrow ? 'Amanhã' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
                    2. Selecione o Horário Disponível
                  </label>
                  {selectedService && (
                    <span className="text-xs text-stone-400">
                      Duração estimada: <strong className="text-amber-400">{selectedService.duration_minutes} minutos</strong>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {BUSINESS_HOURS.map((slot) => {
                    const barberTargetId = typeof selectedBarber === 'object' && selectedBarber ? selectedBarber.id : 'any';
                    const available = isSlotAvailable(slot, selectedDate, barberTargetId, appointments);
                    const isSelected = selectedTime === slot;

                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={!available}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-amber-500 border-amber-400 text-stone-950 shadow-md shadow-amber-500/20'
                            : available
                            ? 'bg-stone-900 border-stone-800 text-stone-200 hover:border-amber-500/40 hover:bg-stone-800'
                            : 'bg-stone-950/60 border-stone-800/40 text-stone-600 cursor-not-allowed line-through'
                        }`}
                      >
                        <span>{slot}</span>
                        {!available && (
                          <span className="text-[8px] no-underline font-normal text-stone-600 uppercase">
                            Ocupado
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 4: DADOS DO CLIENTE */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Passo 4 de 4</span>
                <h2 className="text-2xl font-bold text-stone-100 tracking-tight mt-1">
                  Seus dados para confirmação
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Enviaremos o lembrete e detalhes pelo WhatsApp.
                </p>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-medium">
                  {formError}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Nome Completo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Nome Completo *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo Mendes"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>WhatsApp com DDD *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 98765-4321"
                    value={clientPhone}
                    onChange={handlePhoneChange}
                    maxLength={15}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* E-mail */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>E-mail (Opcional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="exemplo@email.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Observações */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Estilo ou Preferência (Opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Taper fade navalhado, barba lenhador..."
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Order Summary Box before submitting */}
              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-3">
                <span className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                  Resumo da Reserva
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-stone-500 block text-[11px]">Serviço</span>
                    <strong className="text-stone-200">{selectedService?.name}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Barbeiro</span>
                    <strong className="text-stone-200">
                      {selectedBarber === 'any' ? 'Qualquer Profissional' : selectedBarber?.name}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Data & Hora</span>
                    <strong className="text-stone-200">
                      {selectedDate.split('-').reverse().join('/')} às {selectedTime}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Valor Total</span>
                    <strong className="text-amber-400 text-sm">
                      {selectedService ? formatCurrencyBRL(selectedService.price) : ''}
                    </strong>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 5: CONFIRMAÇÃO / COMPROVANTE */}
          {/* ========================================================================= */}
          {currentStep === 5 && completedAppointment && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-4 space-y-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs uppercase font-bold text-amber-500 tracking-wider">
                  Agendamento Concluído com Sucesso!
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-100 mt-1">
                  Nos vemos na cadeira, {completedAppointment.client_name.split(' ')[0]}!
                </h2>
                <p className="text-xs text-stone-400 mt-2 max-w-md mx-auto leading-relaxed">
                  Seu horário foi reservado no sistema e já está disponível para visualização na agenda do salão.
                </p>
              </div>

              {/* Ticket Card */}
              <div className="max-w-md mx-auto p-6 rounded-2xl bg-stone-900 border border-stone-800 text-left space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-500">Comprovante de Agendamento</span>
                    <p className="font-mono text-xs text-amber-400 font-bold">
                      #{completedAppointment.id.slice(0, 8)}
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    Confirmado
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Serviço:</span>
                    <span className="font-bold text-stone-200">{completedAppointment.service_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Profissional:</span>
                    <span className="font-bold text-stone-200">{completedAppointment.barber_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Data:</span>
                    <span className="font-bold text-stone-200">
                      {completedAppointment.appointment_date.split('-').reverse().join('/')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Horário:</span>
                    <span className="font-bold text-stone-200">
                      {completedAppointment.appointment_time} ({completedAppointment.duration_minutes} min)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Cliente:</span>
                    <span className="font-bold text-stone-200">{completedAppointment.client_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">WhatsApp:</span>
                    <span className="font-bold text-stone-200">{completedAppointment.client_phone}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-stone-800 text-sm">
                    <span className="font-bold text-stone-300">Valor Total:</span>
                    <span className="font-extrabold text-amber-400">
                      {formatCurrencyBRL(completedAppointment.total_price)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={createWhatsAppMessageUrl(completedAppointment)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Comprovante pelo WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs transition-colors"
                >
                  Fazer Outro Agendamento
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Next/Back Footer (Step 1 to 4) */}
        {currentStep < 5 && (
          <div className="flex items-center justify-between pt-6 mt-8 border-t border-stone-800/80">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold border border-stone-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                disabled={!canAdvance()}
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className={`inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  canAdvance()
                    ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/10'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                <span>Avançar</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!canAdvance() || isSubmitting}
                onClick={handleConfirmBooking}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  canAdvance() && !isSubmitting
                    ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <span>Agendando...</span>
                ) : (
                  <>
                    <CalendarCheck className="w-4 h-4" />
                    <span>Confirmar Agendamento</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
