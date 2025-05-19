
import { supabase } from '@/integrations/supabase/client';
import { MeetingInput, MeetingCost, MeetingLog } from '@/types/meeting';
import { toast } from '@/components/ui/use-toast';
import { Database } from '@/integrations/supabase/types';

export const saveMeeting = async (
  meetingInput: MeetingInput,
  meetingCost: MeetingCost,
  userId: string
): Promise<boolean> => {
  try {
    // Save to database for authenticated users
    // Use the correct type from the Database type definition
    const meetingData: Database['public']['Tables']['meeting_logs']['Insert'] = {
      user_id: userId,
      duration: meetingInput.duration,
      attendees: meetingInput.attendees,
      average_salary: meetingInput.averageSalary,
      purpose: meetingInput.purpose || null,
      worth_it: meetingInput.worthIt || null,
      total_cost: meetingCost.totalCost,
      hourly_rate: meetingCost.hourlyRatePerAttendee
    };

    const { error } = await supabase
      .from('meeting_logs')
      .insert(meetingData);

    if (error) throw error;

    toast({
      title: "Meeting saved",
      description: "Your meeting has been saved to your history.",
    });
    
    return true;
  } catch (error: any) {
    console.error('Error saving meeting:', error);
    toast({
      title: "Error saving meeting",
      description: error.message || "Failed to save meeting data",
      variant: "destructive",
    });
    return false;
  }
};
