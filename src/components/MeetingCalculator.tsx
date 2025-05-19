
import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MeetingForm from './MeetingForm';
import ResultsDisplay from './ResultsDisplay';
import { calculateMeetingCost } from '@/utils/calculateMeetingCost';
import { MeetingInput, MeetingCost, MeetingLog } from '@/types/meeting';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const MeetingCalculator: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [results, setResults] = useState<MeetingCost | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async (data: MeetingInput) => {
    setLoading(true);
    
    try {
      // Calculate the meeting cost
      const costResults = calculateMeetingCost(data);
      setResults(costResults);
      
      if (user) {
        // Create meeting log entry
        const meetingLog: MeetingLog = {
          user_id: user.id,
          duration: data.duration,
          attendees: data.attendees,
          average_salary: data.averageSalary,
          purpose: data.purpose || null,
          worth_it: data.worthIt,
          total_cost: costResults.totalCost,
          hourly_rate: costResults.hourlyRatePerAttendee,
          timestamp: new Date().toISOString()
        };
        
        // Save to database
        const { error } = await supabase
          .from('meeting_logs')
          .insert(meetingLog);
          
        if (error) {
          console.error("Error saving meeting log:", error);
          toast({
            title: "Error",
            description: "Your meeting was calculated but could not be saved.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Meeting cost calculated and saved.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Calculation Failed",
        description: "There was an error calculating the meeting cost.",
        variant: "destructive",
      });
      console.error("Calculation error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Meeting Cost Calculator</CardTitle>
          <CardDescription>
            Calculate the true cost of your meetings based on time and attendee salaries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MeetingForm onCalculate={handleCalculate} loading={loading} />
        </CardContent>
      </Card>

      {results && (
        <div className="mt-6">
          <ResultsDisplay results={results} />
        </div>
      )}
    </div>
  );
};

export default MeetingCalculator;
