
import { MeetingInput, MeetingCost } from '../types/meeting';

export const calculateMeetingCost = (input: MeetingInput): MeetingCost => {
  // Calculate hourly cost per attendee: Salary / 52 weeks / 5 days / 8 hours
  const hourlyRatePerAttendee = input.averageSalary / 52 / 5 / 8;
  
  // Calculate total cost: hourly rate * number of attendees * (meeting duration in minutes / 60)
  const totalCost = hourlyRatePerAttendee * input.attendees * (input.duration / 60);
  
  // Determine if this is a high-cost meeting (> £500)
  const isHighCost = totalCost > 500;

  return {
    totalCost,
    hourlyRatePerAttendee,
    isHighCost
  };
};

// Format currency for display
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};
