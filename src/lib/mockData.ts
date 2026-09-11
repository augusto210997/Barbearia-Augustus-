import { Barber, Service, Appointment } from '../types';

export const INITIAL_BARBERS: Barber[] = [
  {
    id: 'b1',
    name: 'Mateus Silva',
    role: 'Master Barber & Visagista',
    avatar_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviews_count: 184,
    specialties: ['Degradê Americano', 'Corte na Tesoura', 'Visagismo'],
    active: true
  },
  {
    id: 'b2',
    name: 'Rodrigo Costa',
    role: 'Especialista em Navalha & Fade',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviews_count: 142,
    specialties: ['Taper Fade', 'Riscos & Freestyle', 'Pigmentação'],
    active: true
  },
  {
    id: 'b3',
    name: 'Gabriel Santana',
    role: 'Barboterapeuta Especialista',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    rating: 5.0,
    reviews_count: 210,
    specialties: ['Toalha Quente', 'Tratamento de Pele', 'Barba Modelada'],
    active: true
  },
  {
    id: 'b4',
    name: 'Lucas Oliveira',
    role: 'Hair Stylist Clássico',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviews_count: 97,
    specialties: ['Cortes Sociais', 'Pompadour', 'Alinhamento'],
    active: true
  }
];

export const INITIAL_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Corte Masculino Premium',
    category: 'cabelo',
    description: 'Lavagem com shampoo mentolado refrescante, corte estilizado (fade navalhado ou tesoura) e finalização com pomada fosca.',
    duration_minutes: 40,
    price: 55.00,
    popular: true
  },
  {
    id: 's2',
    name: 'Barba Terapia Completa',
    category: 'barba',
    description: 'Toalha quente aromatizada com eucalipto, esfoliação facial, lâmina descartável de precisão, balm hidratante e massagem vibratória.',
    duration_minutes: 35,
    price: 45.00,
    popular: true
  },
  {
    id: 's3',
    name: 'Combo Master (Corte + Barboterapia)',
    category: 'combo',
    description: 'Experiência completa da barbearia: corte executivo ou degradê e barboterapia relaxante com toalha quente e massagem.',
    duration_minutes: 60,
    price: 90.00,
    popular: true
  },
  {
    id: 's4',
    name: 'Corte Simples / Máquina',
    category: 'cabelo',
    description: 'Corte ágil apenas com máquina (até 2 pentes nas laterais) e acabamento alinhado na nuca.',
    duration_minutes: 25,
    price: 35.00
  },
  {
    id: 's5',
    name: 'Aparar & Alinhar Barba',
    category: 'barba',
    description: 'Desenho preciso do contorno da bochecha e pescoço com navalha e alinhamento do volume.',
    duration_minutes: 20,
    price: 30.00
  },
  {
    id: 's6',
    name: 'Combo Executivo (+ Sobrancelha)',
    category: 'combo',
    description: 'Corte Masculino Premium + Barba Terapia + Limpeza e contorno da sobrancelha na lâmina.',
    duration_minutes: 75,
    price: 110.00
  },
  {
    id: 's7',
    name: 'Sobrancelha na Navalha',
    category: 'tratamento',
    description: 'Limpeza minuciosa dos excessos e definição simétrica da sobrancelha masculina.',
    duration_minutes: 15,
    price: 20.00
  },
  {
    id: 's8',
    name: 'Pigmentação / Camuflagem de Barba',
    category: 'tratamento',
    description: 'Camuflagem profissional de falhas e fios brancos com efeito natural e duradouro.',
    duration_minutes: 30,
    price: 50.00
  },
  {
    id: 's9',
    name: 'Hidratação & Peeling Capilar',
    category: 'tratamento',
    description: 'Tratamento intensivo antioleosidade para couro cabeludo com massagem estimulante.',
    duration_minutes: 30,
    price: 45.00
  }
];

// Gera alguns agendamentos para hoje e amanhã no modo local
const getTodayIso = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const getTomorrowIso = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    client_name: 'Carlos Eduardo Mendes',
    client_phone: '(11) 98765-4321',
    client_email: 'carlos.mendes@email.com',
    barber_id: 'b1',
    barber_name: 'Mateus Silva',
    service_id: 's3',
    service_name: 'Combo Master (Corte + Barboterapia)',
    appointment_date: getTodayIso(),
    appointment_time: '10:00',
    duration_minutes: 60,
    total_price: 90.00,
    notes: 'Degradê baixo na zero e barba bem alinhada',
    status: 'confirmed',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'apt-2',
    client_name: 'Fernando Rocha',
    client_phone: '(11) 97654-3210',
    client_email: 'fernando.rocha@email.com',
    barber_id: 'b2',
    barber_name: 'Rodrigo Costa',
    service_id: 's1',
    service_name: 'Corte Masculino Premium',
    appointment_date: getTodayIso(),
    appointment_time: '11:30',
    duration_minutes: 40,
    total_price: 55.00,
    notes: 'Apenas tesoura no topo',
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'apt-3',
    client_name: 'Guilherme Bastos',
    client_phone: '(11) 99123-4567',
    client_email: 'guilherme.bastos@email.com',
    barber_id: 'b3',
    barber_name: 'Gabriel Santana',
    service_id: 's2',
    service_name: 'Barba Terapia Completa',
    appointment_date: getTodayIso(),
    appointment_time: '14:00',
    duration_minutes: 35,
    total_price: 45.00,
    notes: 'Pele sensível',
    status: 'confirmed',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'apt-4',
    client_name: 'Marcelo Pires',
    client_phone: '(11) 98321-7654',
    client_email: 'marcelo.pires@email.com',
    barber_id: 'b1',
    barber_name: 'Mateus Silva',
    service_id: 's1',
    service_name: 'Corte Masculino Premium',
    appointment_date: getTomorrowIso(),
    appointment_time: '15:00',
    duration_minutes: 40,
    total_price: 55.00,
    status: 'confirmed',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];
