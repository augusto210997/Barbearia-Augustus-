import { Scissors, CalendarPlus, CalendarDays, MessageCircle } from 'lucide-react';
import { createWhatsAppDirectBookingUrl } from '../lib/dateUtils';

interface HeaderProps {
  activeTab: 'booking' | 'admin';
  setActiveTab: (tab: 'booking' | 'admin') => void;
  appointmentsCountToday: number;
}

export function Header({
  activeTab,
  setActiveTab,
  appointmentsCountToday,
}: HeaderProps) {
  const whatsappUrl = createWhatsAppDirectBookingUrl(
    '5511987654321',
    'Olá! Gostaria de agendar um horário na Dom Barber. Quais são os horários disponíveis hoje?'
  );

  return (
    <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30">
              <Scissors className="w-6 h-6 rotate-45 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-wider text-stone-100 uppercase">
                  Dom Barber
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Classic & Modern
                </span>
              </div>
              <p className="text-xs text-stone-400 font-medium">
                Salão de Corte Masculino & Barba Terapia
              </p>
            </div>
          </div>

          {/* Navigation and Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Tab switch buttons */}
            <nav className="flex items-center p-1 rounded-xl bg-stone-900 border border-stone-800">
              <button
                type="button"
                id="tab-booking-btn"
                onClick={() => setActiveTab('booking')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'booking'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Novo Agendamento</span>
              </button>

              <button
                type="button"
                id="tab-admin-btn"
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Painel da Agenda</span>
                {appointmentsCountToday > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-tight ${
                      activeTab === 'admin'
                        ? 'bg-stone-950 text-amber-400'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {appointmentsCountToday}
                  </span>
                )}
              </button>
            </nav>

            {/* WhatsApp Booking Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              id="header-whatsapp-booking-btn"
              title="Agendar diretamente pelo WhatsApp"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-stone-950 shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <MessageCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Agendar no WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
