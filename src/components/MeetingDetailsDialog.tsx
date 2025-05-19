
import React from 'react';
import { MeetingLog } from '@/types/meeting';
import { formatCurrency } from '@/utils/calculateMeetingCost';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Users, 
  DollarSign, 
  CheckCircle, 
  XCircle,
  HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface MeetingDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: MeetingLog | null;
}

const MeetingDetailsDialog: React.FC<MeetingDetailsDialogProps> = ({ 
  isOpen, 
  onOpenChange, 
  meeting 
}) => {
  const getWorthItStatus = (worthIt: boolean | null) => {
    if (worthIt === true) return { icon: <CheckCircle className="h-5 w-5 text-green-500" />, label: "Yes" };
    if (worthIt === false) return { icon: <XCircle className="h-5 w-5 text-red-500" />, label: "No" };
    return { icon: <HelpCircle className="h-5 w-5 text-gray-400" />, label: "Not specified" };
  };

  if (!meeting) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Meeting Details</DialogTitle>
          <DialogDescription>
            Full information about your meeting
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">
                {format(new Date(meeting.created_at || meeting.timestamp || ''), 'PPP')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Time</p>
              <p className="font-medium">
                {format(new Date(meeting.created_at || meeting.timestamp || ''), 'p')}
              </p>
            </div>
          </div>
          
          <Separator />
          
          {meeting.purpose && (
            <div>
              <p className="text-sm text-gray-500">Purpose</p>
              <p className="font-medium">{meeting.purpose}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{meeting.duration} minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Attendees</p>
                <p className="font-medium">{meeting.attendees} people</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Avg. Salary</p>
                <p className="font-medium">{formatCurrency(meeting.average_salary)}/year</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Hourly Rate</p>
                <p className="font-medium">{formatCurrency(meeting.hourly_rate)}/hour</p>
              </div>
            </div>
          </div>
          
          <Card className={meeting.total_cost > 1000 ? "border-red-200 bg-red-50" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Total Meeting Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(meeting.total_cost)}</p>
            </CardContent>
          </Card>
          
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-sm text-gray-500">Was this meeting worth it?</p>
              <div className="flex items-center gap-2 mt-1">
                {getWorthItStatus(meeting.worth_it).icon}
                <span className="font-medium">{getWorthItStatus(meeting.worth_it).label}</span>
              </div>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingDetailsDialog;
