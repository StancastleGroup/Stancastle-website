export interface NavItem {
  label: string;
  href: string;
}

export interface Testimonial {
  id: number;
  content: string;
  author: string;
  role: string;
  metric?: string;
  company: string;
}

export interface Service {
  id: string;
  title: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

export interface ComparisonPoint {
  feature: string;
  generic: string;
  stancastle: string;
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
  phone?: string | null;
  company_website?: string | null;
  is_partner: boolean;
}

export interface Appointment {
  id: string;
  user_id: string | null;
  service_type: string;
  date: string;
  time: string;
  status: 'pending' | 'paid' | 'booked' | 'completed' | 'cancelled';
  zoom_join_url?: string | null;
  zoom_meeting_id?: string | null;
}