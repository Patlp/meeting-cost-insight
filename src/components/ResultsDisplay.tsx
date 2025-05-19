
import React from 'react';
import { MeetingCost, MeetingInput } from '@/types/meeting';
import { formatCurrency } from '@/utils/calculateMeetingCost';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Clock, Users, CreditCard } from 'lucide-react';

interface ResultsDisplayProps {
  results?: MeetingCost | null;
  meetingCost?: MeetingCost; // Add this property to match what's passed in MeetingCalculator
  meetingInput?: MeetingInput;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, meetingCost, meetingInput }) => {
  // Use either results or meetingCost, whichever is provided
  const costData = results || meetingCost;
  
  if (!costData) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className={`${costData.isHighCost ? 'border-red-400 bg-red-50' : ''}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <span>Meeting Cost Summary</span>
            {costData.isHighCost && (
              <div className="flex items-center text-red-500">
                <AlertTriangle className="mr-1 h-5 w-5" />
                <span className="text-sm font-medium">High-Cost Meeting</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Meeting Cost</dt>
              <dd className="text-3xl font-bold">{formatCurrency(costData.totalCost)}</dd>
            </div>
            
            {meetingInput && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Duration</dt>
                      <dd className="font-semibold">{meetingInput.duration} minutes</dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Attendees</dt>
                      <dd className="font-semibold">{meetingInput.attendees} people</dd>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}
            
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-400" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Hourly Rate per Attendee</dt>
                <dd className="text-lg font-semibold">{formatCurrency(costData.hourlyRatePerAttendee)}/hour</dd>
              </div>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsDisplay;
