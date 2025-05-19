
import React from 'react';
import { Calendar } from 'lucide-react';

const EmptyMeetingHistory: React.FC = () => {
  return (
    <div className="text-center p-8 text-gray-500">
      <Calendar className="mx-auto h-16 w-16 mb-4 text-gray-300" />
      <h3 className="text-xl font-medium mb-2">No meetings recorded yet</h3>
      <p>Your meeting history will appear here once you save some meetings.</p>
    </div>
  );
};

export default EmptyMeetingHistory;
