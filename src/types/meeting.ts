
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

export interface MeetingLog extends MeetingInput, MeetingCost {
  id?: number;
  timestamp: string;
}
