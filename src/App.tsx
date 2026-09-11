import { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { BookingWizard } from './components/BookingWizard';
import { AdminSchedule } from './components/AdminSchedule';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton';
import { Barber, Service, Appointment, AppointmentStatus } from './types';
import {
  fetchBarbers,
  fetchServices,
  fetchAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  addCustomService,
} from './lib/supabase';
import { Scissors, Clock, MapPin, Phone } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'booking' | 'admin'>('booking');
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Carrega dados iniciais
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const [loadedBarbers, loadedServices, loadedAppointments] = await Promise.all([
          fetchBarbers(),
          fetchServices(),
          fetchAppointments(),
        ]);

        if (mounted) {
          setBarbers(loadedBarbers);
          setServices(loadedServices);
          setAppointments(loadedAppointments);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // Quantidade de agendamentos para hoje
  const appointmentsCountToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter((a) => a.appointment_date === today && a.status !== 'cancelled').length;
  }, [appointments]);

  // Ação de novo agendamento
  const handleBookSuccess = async (appointmentData: Omit<Appointment, 'id' | 'created_at'>) => {
    const created = await createAppointment(appointmentData);
    setAppointments((prev) => [created, ...prev]);
    showToast(`Agendamento de ${created.client_name} registrado com sucesso!`);
    return created;
  };

  // Ação de atualizar status
  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    await updateAppointmentStatus(id, status);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    const label = {
      confirmed: 'confirmado',
      completed: 'concluído',
      cancelled: 'cancelado',
      pending: 'pendente',
    }[status];
    showToast(`Agendamento marcado como ${label}.`);
  };

  // Ação de deletar agendamento
  const handleDeleteAppointment = async (id: string) => {
    await deleteAppointment(id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    showToast('Agendamento excluído da agenda.');
  };

  // Ação de adicionar serviço
  const handleAddService = async (serviceData: Omit<Service, 'id'>) => {
    const created = await addCustomService(serviceData);
    setServices((prev) => [...prev, created]);
    showToast(`Serviço "${created.name}" adicionado com sucesso!`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-900 text-stone-100 selection:bg-amber-500 selection:text-stone-950 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs shadow-2xl flex items-center gap-2 border border-amber-400 animate-bounce">
          <Scissors className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        appointmentsCountToday={appointmentsCountToday}
      />

      {/* Hero Banner / Subheader */}
      <div className="border-b border-stone-800/80 bg-stone-950/40 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-stone-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Seg à Sáb: 09:00 às 20:00</span>
            </span>
            <span className="hidden sm:inline text-stone-600">•</span>
            <span className="flex items-center gap-1.5 text-stone-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Av. Paulista, 1500 - Jardins</span>
            </span>
            <span className="hidden sm:inline text-stone-600">•</span>
            <span className="flex items-center gap-1.5 text-stone-300">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>(11) 98765-4321</span>
            </span>
          </div>
          <span className="text-[11px] text-amber-500/80 font-medium">
            Atendimento com hora marcada ou por ordem de chegada
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-stone-400">Carregando serviços e profissionais...</p>
          </div>
        ) : activeTab === 'booking' ? (
          <BookingWizard
            barbers={barbers}
            services={services}
            appointments={appointments}
            onBookSuccess={handleBookSuccess}
          />
        ) : (
          <AdminSchedule
            barbers={barbers}
            services={services}
            appointments={appointments}
            onUpdateStatus={handleUpdateStatus}
            onDeleteAppointment={handleDeleteAppointment}
            onCreateManualAppointment={handleBookSuccess}
            onAddService={handleAddService}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800 bg-stone-950 py-8 px-4 text-xs text-stone-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-stone-300">Dom Barber - Salão de Corte Masculino</span>
            <span>© {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-stone-400">
            <span>Cortes clássicos, modernos e barboterapia de excelência</span>
          </div>
        </div>
      </footer>

      {/* Botão Flutuante de Agendamento por WhatsApp */}
      <WhatsAppFloatingButton phoneNumber="5511987654321" />
    </div>
  );
}
