
import React from 'react';
import { MeetingCost } from '@/types/meeting';
import { formatCurrency } from '@/utils/calculateMeetingCost';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface ResultsDisplayProps {
  results: MeetingCost | null;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  if (!results) return null;

  return (
    <Card className={`animate-fade-in ${results.isHighCost ? 'border-red-400' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Meeting Cost Summary</span>
          {results.isHighCost && (
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
            <dd className="text-3xl font-bold">{formatCurrency(results.totalCost)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Hourly Rate per Attendee</dt>
            <dd className="text-lg font-semibold">{formatCurrency(results.hourlyRatePerAttendee)}/hour</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
};

export default ResultsDisplay;
