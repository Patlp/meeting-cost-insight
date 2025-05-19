
import { User } from '@supabase/supabase-js';

export interface MeetingInput {
  duration: number;
  attendees: number;
  averageSalary: number;
  purpose?: string;
  worthIt?: boolean | null;
}

export interface MeetingCost {
  totalCost: number;
  hourlyRatePerAttendee: number;
  isHighCost: boolean;
}

export interface MeetingLog {
  id?: string;
  user_id: string;
  duration: number;
  attendees: number;
  average_salary: number;
  purpose?: string | null;
  worth_it?: boolean | null;
  total_cost: number;
  hourly_rate: number;
  timestamp: string;
}
