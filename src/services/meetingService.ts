
import { supabase } from '@/integrations/supabase/client';
import { MeetingInput, MeetingCost, MeetingLog } from '@/types/meeting';
import { calculateMeetingCost } from '@/utils/calculateMeetingCost';
import { toast } from '@/components/ui/use-toast';

export const saveMeeting = async (
  meetingInput: MeetingInput,
  meetingCost: MeetingCost,
  userId: string
): Promise<boolean> => {
  try {
    // Check if we're in preview mode with a preview user ID (not a valid UUID)
    const isPreviewMode = userId === 'preview-user-id';
    
    if (isPreviewMode) {
      // In preview mode, just show success without saving to database
      toast({
        title: "Preview mode",
        description: "In preview mode, meetings are not actually saved to the database.",
      });
      return true;
    }

    // For real users, save to database
    const meetingLog: Omit<MeetingLog, 'id' | 'timestamp'> = {
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
      .insert(meetingLog);

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
