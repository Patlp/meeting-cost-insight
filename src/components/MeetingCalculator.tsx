
import React, { useState } from 'react';
import MeetingForm from './MeetingForm';
import ResultsDisplay from './ResultsDisplay';
import { MeetingInput, MeetingCost } from '../types/meeting';
import { calculateMeetingCost } from '../utils/calculateMeetingCost';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { saveMeeting } from '@/services/meetingService';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { Save } from 'lucide-react';

const MeetingCalculator: React.FC = () => {
  const [meetingInput, setMeetingInput] = useState<MeetingInput>({
    duration: 30,
    attendees: 5,
    averageSalary: 60000,
  });
  const [meetingCost, setMeetingCost] = useState<MeetingCost | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const handleCalculate = (input: MeetingInput) => {
    setMeetingInput(input);
    const cost = calculateMeetingCost(input);
    setMeetingCost(cost);
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save meetings to your history.",
        variant: "destructive",
      });
      return;
    }
    
    if (!meetingCost) return;
    
    setSaving(true);
    
    try {
      const success = await saveMeeting(meetingInput, meetingCost, user.id);
      
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        queryClient.invalidateQueries({ queryKey: ['meetingsCount'] });
      }
    } catch (error) {
      console.error('Error saving meeting:', error);
      toast({
        title: "Error",
        description: "Failed to save meeting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <MeetingForm onCalculate={handleCalculate} />
        {meetingCost && (
          <div className="mt-4">
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2"
              variant="outline"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save to History"}
            </Button>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        {meetingCost ? (
          <div>
            <ResultsDisplay 
              meetingInput={meetingInput} 
              meetingCost={meetingCost} 
            />
            
            {meetingCost && (
              <div className="mt-6">
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2"
                  variant="default"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Meeting to History"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Fill out the form and click "Calculate" to see the meeting cost.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingCalculator;
