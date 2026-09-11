import { Appointment } from '../types';

export const BUSINESS_HOURS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30'
];

export interface DayOption {
  dateIso: string; // YYYY-MM-DD
  dayNumber: number;
  weekdayShort: string;
  isToday: boolean;
  isTomorrow: boolean;
  isWeekend: boolean;
  label: string;
}

export function getUpcomingDays(count: number = 14): DayOption[] {
  const days: DayOption[] = [];
  const today = new Date();

  const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    // Barbearias geralmente fecham aos domingos ou segundas, mas permitimos de Seg a Sáb
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0) continue; // Pula domingos

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateIso = `${year}-${month}-${day}`;

    const isToday = i === 0;
    const isTomorrow = i === 1;

    let label = `${weekdayNames[dayOfWeek]}, ${d.getDate()} ${monthNames[d.getMonth()]}`;
    if (isToday) label = 'Hoje';
    else if (isTomorrow) label = 'Amanhã';

    days.push({
      dateIso,
      dayNumber: d.getDate(),
      weekdayShort: weekdayNames[dayOfWeek],
      isToday,
      isTomorrow,
      isWeekend: dayOfWeek === 6,
      label,
    });
  }

  return days;
}

export function formatCurrencyBRL(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val);
}

export function formatPhoneMask(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function isSlotAvailable(
  time: string,
  dateIso: string,
  barberId: string,
  appointments: Appointment[]
): boolean {
  // Se for hoje e o horário já passou, indisponível
  const now = new Date();
  const todayIso = now.toISOString().split('T')[0];
  if (dateIso === todayIso) {
    const [hours, minutes] = time.split(':').map(Number);
    const slotTime = new Date();
    slotTime.setHours(hours, minutes, 0, 0);
    if (slotTime <= now) {
      return false;
    }
  }

  // Verifica se já existe agendamento ativo (não cancelado)
  const conflict = appointments.some((apt) => {
    if (apt.status === 'cancelled') return false;
    if (apt.appointment_date !== dateIso) return false;
    if (apt.appointment_time !== time) return false;

    // Se o cliente escolheu um barbeiro específico ou 'any'
    if (barberId && barberId !== 'any') {
      return apt.barber_id === barberId;
    }

    return false;
  });

  return !conflict;
}

export function createWhatsAppDirectBookingUrl(
  shopPhone: string = '5511987654321',
  customMessage?: string
): string {
  const defaultText = `Olá! Gostaria de agendar um horário na Dom Barber. Quais são os horários disponíveis?`;
  const message = customMessage || defaultText;
  return `https://wa.me/${shopPhone}?text=${encodeURIComponent(message)}`;
}

export function createWhatsAppMessageUrl(apt: Appointment, shopPhone: string = '5511987654321'): string {
  const text = `*Agendamento Confirmado - Dom Barber*\n\n` +
    `Olá, meu nome é *${apt.client_name}*.\n` +
    `Agendei o seguinte horário:\n` +
    `💈 *Serviço:* ${apt.service_name}\n` +
    `✂️ *Barbeiro:* ${apt.barber_name || 'Qualquer Profissional'}\n` +
    `📅 *Data:* ${apt.appointment_date.split('-').reverse().join('/')}\n` +
    `⏰ *Horário:* ${apt.appointment_time} (${apt.duration_minutes} min)\n` +
    `💰 *Valor:* ${formatCurrencyBRL(apt.total_price)}\n` +
    (apt.notes ? `📝 *Obs:* ${apt.notes}\n` : '') +
    `\nAguardo a confirmação da barbearia!`;

  return `https://wa.me/${shopPhone}?text=${encodeURIComponent(text)}`;
}
