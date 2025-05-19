
import React from 'react';
import { MeetingLog } from '@/types/meeting';
import { formatCurrency } from '@/utils/calculateMeetingCost';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Trash2 } from 'lucide-react';

interface MeetingHistoryTableProps {
  meetings: MeetingLog[];
  onViewDetails: (meeting: MeetingLog) => void;
  onDeleteMeeting: (id: string) => void;
}

const MeetingHistoryTable: React.FC<MeetingHistoryTableProps> = ({ 
  meetings, 
  onViewDetails, 
  onDeleteMeeting 
}) => {
  return (
    <Table>
      <TableCaption>Your meeting history</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Purpose</TableHead>
          <TableHead className="text-right">Duration</TableHead>
          <TableHead className="text-right">Attendees</TableHead>
          <TableHead className="text-right">Cost</TableHead>
          <TableHead className="text-right">Worth it?</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {meetings.map((meeting) => (
          <TableRow key={meeting.id}>
            <TableCell>{format(new Date(meeting.created_at || meeting.timestamp || ''), 'MMM d, yyyy')}</TableCell>
            <TableCell className="max-w-[200px] truncate">{meeting.purpose || '—'}</TableCell>
            <TableCell className="text-right">{meeting.duration} min</TableCell>
            <TableCell className="text-right">{meeting.attendees}</TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(meeting.total_cost)}
            </TableCell>
            <TableCell className="text-right">
              {meeting.worth_it === true ? '✅' : meeting.worth_it === false ? '❌' : '—'}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onViewDetails(meeting)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onDeleteMeeting(meeting.id as string)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default MeetingHistoryTable;
