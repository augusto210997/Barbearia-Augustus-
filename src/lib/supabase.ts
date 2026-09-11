import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Barber, Service, Appointment, AppointmentStatus, SupabaseConfigStatus } from '../types';
import { INITIAL_BARBERS, INITIAL_SERVICES, INITIAL_APPOINTMENTS } from './mockData';

// Obtenha as variáveis de ambiente Vite
const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const rawUrl = env.VITE_SUPABASE_URL;
const rawAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Checagem se são credenciais válidas e não apenas placeholders
const isValidSupabaseConfig = (url?: string, key?: string): boolean => {
  if (!url || !key) return false;
  const cleanUrl = url.trim();
  const cleanKey = key.trim();
  if (cleanUrl === '' || cleanKey === '') return false;
  if (cleanUrl.includes('your-project') || cleanKey.includes('your-anon-key')) return false;
  return cleanUrl.startsWith('https://') && cleanUrl.includes('.supabase.co');
};

export const isConfigured = isValidSupabaseConfig(rawUrl, rawAnonKey);

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(rawUrl!.trim(), rawAnonKey!.trim())
  : null;

export const getSupabaseConfigStatus = (): SupabaseConfigStatus => ({
  isConfigured,
  url: rawUrl && !rawUrl.includes('your-project') ? rawUrl : null,
  hasAnonKey: !!rawAnonKey && !rawAnonKey.includes('your-anon-key'),
});

// Chaves do LocalStorage para modo offline/demonstração
const STORAGE_KEYS = {
  BARBERS: 'salao_barbers_v1',
  SERVICES: 'salao_services_v1',
  APPOINTMENTS: 'salao_appointments_v1',
};

// Carrega ou inicializa dados locais
function getLocalBarbers(): Barber[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BARBERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BARBERS, JSON.stringify(INITIAL_BARBERS));
      return INITIAL_BARBERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BARBERS;
  }
}

function getLocalServices(): Service[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(INITIAL_SERVICES));
      return INITIAL_SERVICES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SERVICES;
  }
}

function getLocalAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(INITIAL_APPOINTMENTS));
      return INITIAL_APPOINTMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_APPOINTMENTS;
  }
}

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- SCHEMA DO SISTEMA DE AGENDAMENTO - SALÃO DE CORTE MASCULINO / BARBEARIA
-- Execute este script no SQL Editor do seu projeto Supabase (https://supabase.com)
-- ==============================================================================

-- 1. TABELA DE BARBEIROS / PROFISSIONAIS
CREATE TABLE IF NOT EXISTS public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT,
  rating NUMERIC(2,1) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  specialties TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA DE SERVIÇOS
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10,2) NOT NULL,
  popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Remove restrições antigas que possam causar conflito com categorias de barbearia
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_category_check;

-- 3. TABELA DE AGENDAMENTOS
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
  barber_name TEXT,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  total_price NUMERIC(10,2) NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Remove restrições antigas de status
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Garante que todas as colunas necessárias existam caso a tabela tenha sido criada anteriormente
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_date DATE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_time TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS barber_id UUID;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS barber_name TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS service_id UUID;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS service_name TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS total_price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4. POLÍTICAS DE ACESSO (RLS)
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública dos serviços e profissionais
CREATE POLICY "Permitir leitura pública de barbeiros" ON public.barbers FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de serviços" ON public.services FOR SELECT USING (true);

-- Permitir agendamentos e gestão
CREATE POLICY "Permitir criar e consultar agendamentos" ON public.appointments FOR ALL USING (true);
CREATE POLICY "Permitir atualização de barbeiros" ON public.barbers FOR ALL USING (true);
CREATE POLICY "Permitir inserção e atualização de serviços" ON public.services FOR ALL USING (true);

-- 5. DADOS INICIAIS (SEED)
INSERT INTO public.barbers (name, role, avatar_url, rating, reviews_count, specialties, active) VALUES
('Mateus Silva', 'Master Barber & Visagista', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop&q=80', 4.9, 184, ARRAY['Degradê Americano', 'Corte na Tesoura', 'Visagismo'], true),
('Rodrigo Costa', 'Especialista em Navalha & Fade', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80', 4.8, 142, ARRAY['Taper Fade', 'Riscos & Freestyle', 'Pigmentação'], true),
('Gabriel Santana', 'Barboterapeuta Especialista', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80', 5.0, 210, ARRAY['Toalha Quente', 'Tratamento de Pele', 'Barba Modelada'], true),
('Lucas Oliveira', 'Hair Stylist Clássico', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', 4.9, 97, ARRAY['Cortes Sociais', 'Pompadour', 'Alinhamento'], true)
ON CONFLICT DO NOTHING;

INSERT INTO public.services (name, category, description, duration_minutes, price, popular) VALUES
('Corte Masculino Premium', 'cabelo', 'Lavagem com shampoo mentolado, corte estilizado (fade ou tesoura) e finalização com pomada fosca.', 40, 55.00, true),
('Barba Terapia Completa', 'barba', 'Toalha quente com essência de eucalipto, esfoliação facial, navalha descartável, balm hidratante e massagem.', 35, 45.00, true),
('Combo Master (Corte + Barboterapia)', 'combo', 'Experiência completa da barbearia: corte executivo ou degradê e barboterapia relaxante com toalha quente.', 60, 90.00, true),
('Corte Simples / Máquina', 'cabelo', 'Corte ágil apenas com máquina (até 2 pentes nas laterais) e acabamento alinhado na nuca.', 25, 35.00, false),
('Aparar & Alinhar Barba', 'barba', 'Desenho preciso do contorno da bochecha e pescoço com navalha e alinhamento do volume.', 20, 30.00, false),
('Combo Executivo (+ Sobrancelha)', 'combo', 'Corte Masculino Premium + Barba Terapia + Limpeza e contorno da sobrancelha na lâmina.', 75, 110.00, false),
('Sobrancelha na Navalha', 'tratamento', 'Limpeza minuciosa dos excessos e definição simétrica da sobrancelha masculina.', 15, 20.00, false),
('Pigmentação de Barba ou Fios', 'tratamento', 'Camuflagem sutil e elegante de falhas e fios brancos com efeito natural.', 30, 50.00, false)
ON CONFLICT DO NOTHING;

-- 6. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON public.appointments(appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_barber ON public.appointments(barber_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_phone ON public.appointments(client_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
`;

export const SUPABASE_STORAGE_POLICIES_SQL = `-- ==============================================================================
-- POLÍTICAS DE DADOS E ARMAZENAMENTO (SUPABASE STORAGE & DATA POLICIES)
-- Salão de Corte Masculino & Barbearia
-- Execute este script no SQL Editor do Supabase (https://supabase.com)
-- ==============================================================================

-- 1. CRIAÇÃO DOS BUCKETS DE ARMAZENAMENTO (STORAGE BUCKETS)

-- Bucket para avatares dos barbeiros e fotos de perfil dos clientes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barbershop-avatars',
  'barbershop-avatars',
  true,
  5242880, -- 5 MB limite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- Bucket para portfólio de cortes, degradês e estilos da barbearia
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barbershop-cuts',
  'barbershop-cuts',
  true,
  10485760, -- 10 MB limite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- Bucket para recibos e comprovantes de agendamento
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barbershop-receipts',
  'barbershop-receipts',
  true,
  5242880, -- 5 MB limite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];


-- NOTA: O Supabase ja mantem o RLS (Row Level Security) habilitado por padrao na tabela storage.objects.
-- Nao execute 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY' pois gerara o erro 42501 (propriedade exclusiva de supabase_storage_admin).

-- 2. POLÍTICAS DE LEITURA PÚBLICA DE ARQUIVOS (SELECT)
-- Permite que qualquer pessoa ou visitante veja as fotos de barbeiros e galeria
DROP POLICY IF EXISTS "Armazenamento: Leitura publica de avatares" ON storage.objects;
CREATE POLICY "Armazenamento: Leitura publica de avatares"
ON storage.objects FOR SELECT
USING (bucket_id = 'barbershop-avatars');

DROP POLICY IF EXISTS "Armazenamento: Leitura publica de fotos de cortes" ON storage.objects;
CREATE POLICY "Armazenamento: Leitura publica de fotos de cortes"
ON storage.objects FOR SELECT
USING (bucket_id = 'barbershop-cuts');

DROP POLICY IF EXISTS "Armazenamento: Leitura de comprovantes" ON storage.objects;
CREATE POLICY "Armazenamento: Leitura de comprovantes"
ON storage.objects FOR SELECT
USING (bucket_id = 'barbershop-receipts');


-- 4. POLÍTICAS DE UPLOAD DE ARQUIVOS (INSERT)
-- Permite envio de novas fotos com validação de extensão e bucket
DROP POLICY IF EXISTS "Armazenamento: Upload em avatares" ON storage.objects;
CREATE POLICY "Armazenamento: Upload em avatares"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'barbershop-avatars' AND
  (LOWER(SUBSTRING(name FROM '\.([^\.]+)$')) IN ('jpg', 'jpeg', 'png', 'webp'))
);

DROP POLICY IF EXISTS "Armazenamento: Upload no portfolio de cortes" ON storage.objects;
CREATE POLICY "Armazenamento: Upload no portfolio de cortes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'barbershop-cuts' AND
  (LOWER(SUBSTRING(name FROM '\.([^\.]+)$')) IN ('jpg', 'jpeg', 'png', 'webp'))
);

DROP POLICY IF EXISTS "Armazenamento: Upload de comprovantes" ON storage.objects;
CREATE POLICY "Armazenamento: Upload de comprovantes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'barbershop-receipts'
);


-- 5. POLÍTICAS DE MODIFICAÇÃO E EXCLUSÃO (UPDATE / DELETE)
DROP POLICY IF EXISTS "Armazenamento: Modificacao de arquivos" ON storage.objects;
CREATE POLICY "Armazenamento: Modificacao de arquivos"
ON storage.objects FOR UPDATE
USING (bucket_id IN ('barbershop-avatars', 'barbershop-cuts', 'barbershop-receipts'));

DROP POLICY IF EXISTS "Armazenamento: Exclusao de arquivos" ON storage.objects;
CREATE POLICY "Armazenamento: Exclusao de arquivos"
ON storage.objects FOR DELETE
USING (bucket_id IN ('barbershop-avatars', 'barbershop-cuts', 'barbershop-receipts'));
`;

export const SUPABASE_MASTER_SCRIPT_SQL = `${SUPABASE_SQL_SCHEMA}\n\n${SUPABASE_STORAGE_POLICIES_SQL}`;

// ==========================================
// FUNÇÕES DE ACESSO A DADOS (DATA PROVIDER)
// ==========================================

export async function fetchBarbers(): Promise<Barber[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .order('rating', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) return data as Barber[];
    } catch (err) {
      console.warn('Erro ao consultar Supabase (barbers), usando dados locais:', err);
    }
  }
  return getLocalBarbers();
}

export async function fetchServices(): Promise<Service[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) return data as Service[];
    } catch (err) {
      console.warn('Erro ao consultar Supabase (services), usando dados locais:', err);
    }
  }
  return getLocalServices();
}

export async function fetchAppointments(date?: string): Promise<Appointment[]> {
  if (supabase) {
    try {
      let query = supabase.from('appointments').select('*').order('appointment_time', { ascending: true });
      if (date) {
        query = query.eq('appointment_date', date);
      }
      const { data, error } = await query;
      if (error) throw error;
      if (data) return data as Appointment[];
    } catch (err) {
      console.warn('Erro ao consultar Supabase (appointments), usando dados locais:', err);
    }
  }

  const list = getLocalAppointments();
  if (date) {
    return list.filter((item) => item.appointment_date === date);
  }
  return list;
}

export async function createAppointment(
  appointmentData: Omit<Appointment, 'id' | 'created_at'>
): Promise<Appointment> {
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'apt-' + Date.now();
  const created_at = new Date().toISOString();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            client_name: appointmentData.client_name,
            client_phone: appointmentData.client_phone,
            client_email: appointmentData.client_email,
            barber_id: appointmentData.barber_id || null,
            barber_name: appointmentData.barber_name,
            service_id: appointmentData.service_id || null,
            service_name: appointmentData.service_name,
            appointment_date: appointmentData.appointment_date,
            appointment_time: appointmentData.appointment_time,
            duration_minutes: appointmentData.duration_minutes,
            total_price: appointmentData.total_price,
            notes: appointmentData.notes || '',
            status: appointmentData.status || 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) return data as Appointment;
    } catch (err) {
      console.warn('Erro ao salvar agendamento no Supabase, salvando localmente:', err);
    }
  }

  // Fallback LocalStorage
  const newAppointment: Appointment = {
    ...appointmentData,
    id: newId,
    created_at,
  };

  const list = getLocalAppointments();
  const updated = [newAppointment, ...list];
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));
  return newAppointment;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<boolean> {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (!error) return true;
    } catch (err) {
      console.warn('Erro ao atualizar status no Supabase:', err);
    }
  }

  // Fallback LocalStorage
  const list = getLocalAppointments();
  const updated = list.map((item) => (item.id === id ? { ...item, status } : item));
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));
  return true;
}

export async function deleteAppointment(id: string): Promise<boolean> {
  if (supabase) {
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('Erro ao deletar no Supabase:', err);
    }
  }

  const list = getLocalAppointments();
  const updated = list.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));
  return true;
}

export async function addCustomService(service: Omit<Service, 'id'>): Promise<Service> {
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'srv-' + Date.now();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('services').insert([service]).select().single();
      if (!error && data) return data as Service;
    } catch (err) {
      console.warn('Erro ao criar serviço no Supabase:', err);
    }
  }

  const newService: Service = { ...service, id: newId };
  const list = getLocalServices();
  const updated = [...list, newService];
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(updated));
  return newService;
}
