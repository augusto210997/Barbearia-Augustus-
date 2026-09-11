import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { createWhatsAppDirectBookingUrl } from '../lib/dateUtils';

interface WhatsAppFloatingButtonProps {
  phoneNumber?: string;
}

export function WhatsAppFloatingButton({ phoneNumber = '5511987654321' }: WhatsAppFloatingButtonProps) {
  const [showTooltip, setShowTooltip] = useState(true);

  const whatsappUrl = createWhatsAppDirectBookingUrl(
    phoneNumber,
    'Olá! Gostaria de agendar um horário na Dom Barber. Quais são os horários disponíveis hoje?'
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3 flex-col select-none">
      {/* Tooltip Card / Bubble */}
      {showTooltip && (
        <div className="relative bg-stone-900 text-stone-100 border border-stone-800 rounded-2xl p-3 shadow-2xl max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            type="button"
            onClick={() => setShowTooltip(false)}
            className="absolute top-2 right-2 text-stone-400 hover:text-stone-200 p-0.5 rounded"
            title="Fechar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Atendimento Rápido
            </span>
          </div>
          <p className="text-xs text-stone-300 pr-4 leading-snug">
            Prefere agendar direto pelo WhatsApp? Fale com a gente em 1 clique!
          </p>
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-stone-900 border-r border-b border-stone-800 rotate-45" />
        </div>
      )}

      {/* Main WhatsApp Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        id="whatsapp-direct-booking-fab"
        className="group flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold px-4 py-3.5 rounded-full shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all"
        title="Agendar horário pelo WhatsApp"
      >
        <div className="relative flex items-center justify-center">
          <MessageCircle className="w-6 h-6 stroke-[2.4] fill-stone-950/20 text-stone-950" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 border-2 border-emerald-500 rounded-full animate-pulse" />
        </div>
        <span className="text-xs tracking-wide hidden sm:inline-block font-extrabold pr-1">
          Agendar no WhatsApp
        </span>
      </a>
    </div>
  );
}
