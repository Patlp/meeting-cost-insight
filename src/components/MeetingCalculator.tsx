
import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MeetingForm from './MeetingForm';
import ResultsDisplay from './ResultsDisplay';
import { calculateMeetingCost } from '@/utils/calculateMeetingCost';
import { MeetingInput, MeetingCost, MeetingLog } from '@/types/meeting';

const MeetingCalculator: React.FC = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<MeetingCost | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = (data: MeetingInput) => {
    setLoading(true);
    
    try {
      // Calculate the meeting cost
      const costResults = calculateMeetingCost(data);
      setResults(costResults);
      
      // In a real app with Supabase, we would save to the database here
      // const meetingLog: MeetingLog = {
      //   ...data,
      //   ...costResults,
      //   timestamp: new Date().toISOString()
      // };
      // saveMeetingLog(meetingLog);

      toast({
        title: "Calculation Complete",
        description: "The meeting cost has been calculated.",
      });
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
