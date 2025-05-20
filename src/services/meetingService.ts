
import { supabase } from '@/integrations/supabase/client';
import { MeetingInput, MeetingCost } from '@/types/meeting';
import { toast } from '@/components/ui/use-toast';
import { Database } from '@/integrations/supabase/types';

// Define the type for meeting log insert based on database schema
type MeetingLogInsert = Database['public']['Tables']['meeting_logs']['Insert'];

/**
 * Attempts to save a meeting with retry logic for lock-related errors
 */
export const saveMeeting = async (
  meetingInput: MeetingInput,
  meetingCost: MeetingCost,
  userId: string
): Promise<boolean> => {
  // Maximum number of retries for lock-related errors
  const MAX_RETRIES = 2;
  let retryCount = 0;
  
  // Helper function to prepare meeting data with proper typing
  const prepareMeetingData = (): MeetingLogInsert => ({
    user_id: userId,
    duration: meetingInput.duration,
    attendees: meetingInput.attendees,
    average_salary: meetingInput.averageSalary,
    purpose: meetingInput.purpose || null,
    worth_it: meetingInput.worthIt || null,
    total_cost: meetingCost.totalCost,
    hourly_rate: meetingCost.hourlyRatePerAttendee
  });

  // Function to attempt save operation
  const attemptSave = async (): Promise<boolean> => {
    try {
      const meetingData = prepareMeetingData();
      
      // Fix: Ensure proper typing for Supabase insert
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
      // Check specifically for lock-related errors
      if (
        error.message?.includes('LockManager') || 
        error.message?.includes('request()') ||
        error.message?.includes('storage access')
      ) {
        console.warn('Lock-related error encountered when saving meeting:', error.message);
        
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying save operation (attempt ${retryCount}/${MAX_RETRIES})...`);
          
          // Refresh the session first to ensure token is valid
          try {
            await supabase.auth.refreshSession();
            console.log('Session refreshed successfully');
          } catch (refreshError) {
            console.warn('Session refresh failed, continuing with retry anyway:', refreshError);
          }
          
          // Wait briefly before retry
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
          return attemptSave();
        }
        
        // Fall through to memory-only mode if we've exhausted retries
        console.warn('Maximum retries reached, attempting memory-only save...');
        try {
          // Get the current session
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token;
          
          if (!accessToken) {
            throw new Error('No access token available');
          }
          
          // Extract URL and API key from the Supabase client for direct API call
          const supabaseUrl = "https://vklytnmygsdihdbxzhlf.supabase.co";
          const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbHl0bm15Z3NkaWhkYnh6aGxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NDQ3MjksImV4cCI6MjA2MzIyMDcyOX0.JWaAnm_FQ8idv8Ngbjq5n3ms4j6os6jXg4mzWBsRpno";
          
          // Direct API call without using the storage mechanisms
          const memoryMeetingData = prepareMeetingData();
          const response = await fetch(`${supabaseUrl}/rest/v1/meeting_logs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(memoryMeetingData)
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          toast({
            title: "Meeting saved",
            description: "Your meeting has been saved to your history.",
          });
          
          return true;
        } catch (memoryError: any) {
          console.error('Even memory-only save failed:', memoryError);
          toast({
            title: "Error saving meeting",
            description: "Failed to save meeting due to browser storage restrictions. Please try again later.",
            variant: "destructive",
          });
          return false;
        }
      }
      
      // For other errors, log and show toast
      console.error('Error saving meeting:', error);
      toast({
        title: "Error saving meeting",
        description: error.message || "Failed to save meeting data",
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Start the first save attempt
  return attemptSave();
};
