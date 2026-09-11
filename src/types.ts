export interface Barber {
  id: string;
  name: string;
  role: string;
  avatar_url: string;
  rating: number;
  reviews_count: number;
  specialties: string[];
  active: boolean;
}

export type ServiceCategory = 'cabelo' | 'barba' | 'combo' | 'tratamento';

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  duration_minutes: number;
  price: number;
  popular?: boolean;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  barber_id: string;
  barber_name?: string;
  service_id: string;
  service_name?: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:mm
  duration_minutes: number;
  total_price: number;
  notes?: string;
  status: AppointmentStatus;
  created_at?: string;
}

export interface BusinessHours {
  open: string;  // e.g. "09:00"
  close: string; // e.g. "20:00"
  intervalMinutes: number; // e.g. 30
  workingDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  url: string | null;
  hasAnonKey: boolean;
}
