
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
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <MeetingForm onCalculate={handleCalculate} />
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        {meetingCost ? (
          <>
            <ResultsDisplay 
              meetingInput={meetingInput} 
              meetingCost={meetingCost} 
            />
            
            {user && (
              <div className="mt-6 flex justify-center">
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full max-w-xs"
                >
                  {saving ? "Saving..." : "Save Meeting to History"}
                </Button>
              </div>
            )}
          </>
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
