
import { MeetingLog } from '@/types/meeting';

// Sample data for empty state examples or demo purposes
// Not used in production, but kept for reference
export const SAMPLE_MEETINGS: MeetingLog[] = [
  {
    id: '1',
    user_id: '',
    duration: 60,
    attendees: 8,
    average_salary: 75000,
    purpose: 'Weekly Team Sync',
    worth_it: true,
    total_cost: 576.92,
    hourly_rate: 36.06,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: '',
    duration: 30,
    attendees: 4,
    average_salary: 65000,
    purpose: 'Project Planning',
    worth_it: false,
    total_cost: 125.00,
    hourly_rate: 31.25,
    created_at: new Date(Date.now() - 86400000).toISOString() // Yesterday
  },
  {
    id: '3',
    user_id: '',
    duration: 90,
    attendees: 12,
    average_salary: 85000,
    purpose: 'Quarterly Review',
    worth_it: null,
    total_cost: 1230.77,
    hourly_rate: 40.87,
    created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  }
];
