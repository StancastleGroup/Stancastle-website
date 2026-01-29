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
  is_partner: boolean;
}

export interface Appointment {
  id: string;
  user_id: string;
  service_type: string;
  date: string;
  time: string;
  status: 'booked' | 'completed' | 'cancelled';
}