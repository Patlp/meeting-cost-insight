import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MeetingLog } from '@/types/meeting';
import { formatCurrency } from '@/utils/calculateMeetingCost';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  Calendar, 
  Eye, 
  Clock, 
  Users, 
  DollarSign, 
  CheckCircle, 
  XCircle,
  HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
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

// Sample data for preview mode
const SAMPLE_MEETINGS: MeetingLog[] = [
  {
    id: '1',
    user_id: 'preview-user-id',
    duration: 60,
    attendees: 8,
    average_salary: 75000,
    purpose: 'Weekly Team Sync',
    worth_it: true,
    total_cost: 576.92,
    hourly_rate: 36.06,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 'preview-user-id',
    duration: 30,
    attendees: 4,
    average_salary: 65000,
    purpose: 'Project Planning',
    worth_it: false,
    total_cost: 125.00,
    hourly_rate: 31.25,
    created_at: new Date(Date.now() - 86400000).toISOString() // Yesterday
  },
  {
    id: '3',
    user_id: 'preview-user-id',
    duration: 90,
    attendees: 12,
    average_salary: 85000,
    purpose: 'Quarterly Review',
    worth_it: null,
    total_cost: 1230.77,
    hourly_rate: 40.87,
    created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  }
];

const MeetingHistory: React.FC = () => {
  const { user } = useAuth();
  const [page, setPage] = React.useState(1);
  const pageSize = 5;
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const isPreviewMode = user?.id === 'preview-user-id';

  const fetchMeetingLogs = async (): Promise<MeetingLog[]> => {
    if (!user) return [];

    // For preview mode, return sample data
    if (isPreviewMode) {
      // Calculate pagination for sample data
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return SAMPLE_MEETINGS.slice(startIndex, endIndex);
    }

    // For real users, fetch from the database
    const { data, error } = await supabase
      .from('meeting_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      toast({
        title: "Error fetching meeting logs",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    // Map the created_at field to timestamp for compatibility with our types
    return (data || []).map(meeting => ({
      ...meeting,
      timestamp: meeting.created_at
    }));
  };

  const { data: meetings = [], refetch, isLoading, isError } = useQuery({
    queryKey: ['meetings', page, user?.id],
    queryFn: fetchMeetingLogs,
    enabled: !!user,
  });

  const deleteMeeting = async (id: string) => {
    // In preview mode, just show a toast message
    if (isPreviewMode) {
      toast({
        title: "Preview mode",
        description: "In preview mode, meetings cannot be deleted.",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('meeting_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Meeting deleted",
        description: "The meeting has been successfully deleted from your history.",
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error deleting meeting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchTotalCount = async () => {
    if (!user) return 0;
    
    // For preview mode, return sample data length
    if (isPreviewMode) {
      return SAMPLE_MEETINGS.length;
    }
    
    // For real users, get count from database
    const { count, error } = await supabase
      .from('meeting_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching meeting count:', error);
      return 0;
    }
    
    return count || 0;
  };

  const { data: totalCount = 0 } = useQuery({
    queryKey: ['meetingsCount', user?.id],
    queryFn: fetchTotalCount,
    enabled: !!user,
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  const showMeetingDetails = (meeting: MeetingLog) => {
    setSelectedMeeting(meeting);
    setIsDetailsOpen(true);
  };

  const getWorthItStatus = (worthIt: boolean | null) => {
    if (worthIt === true) return { icon: <CheckCircle className="h-5 w-5 text-green-500" />, label: "Yes" };
    if (worthIt === false) return { icon: <XCircle className="h-5 w-5 text-red-500" />, label: "No" };
    return { icon: <HelpCircle className="h-5 w-5 text-gray-400" />, label: "Not specified" };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-8 text-red-500">
        Failed to load meeting history. Please try again later.
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <Calendar className="mx-auto h-16 w-16 mb-4 text-gray-300" />
        <h3 className="text-xl font-medium mb-2">No meetings recorded yet</h3>
        <p>Your meeting history will appear here once you save some meetings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
                    onClick={() => showMeetingDetails(meeting)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deleteMeeting(meeting.id as string)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum = i + 1;
              
              if (totalPages > 5 && page > 3) {
                pageNum = page - 3 + i;
                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
              }
              
              return (
                <PaginationItem key={i}>
                  <PaginationLink 
                    isActive={pageNum === page}
                    onClick={() => setPage(pageNum)}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {totalPages > 5 && page < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Meeting Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Meeting Details</DialogTitle>
            <DialogDescription>
              Full information about your meeting
            </DialogDescription>
          </DialogHeader>
          
          {selectedMeeting && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedMeeting.created_at || selectedMeeting.timestamp || ''), 'PPP')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">
                    {format(new Date(selectedMeeting.created_at || selectedMeeting.timestamp || ''), 'p')}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              {selectedMeeting.purpose && (
                <div>
                  <p className="text-sm text-gray-500">Purpose</p>
                  <p className="font-medium">{selectedMeeting.purpose}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">{selectedMeeting.duration} minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Attendees</p>
                    <p className="font-medium">{selectedMeeting.attendees} people</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Avg. Salary</p>
                    <p className="font-medium">{formatCurrency(selectedMeeting.average_salary)}/year</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Hourly Rate</p>
                    <p className="font-medium">{formatCurrency(selectedMeeting.hourly_rate)}/hour</p>
                  </div>
                </div>
              </div>
              
              <Card className={selectedMeeting.total_cost > 1000 ? "border-red-200 bg-red-50" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Total Meeting Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatCurrency(selectedMeeting.total_cost)}</p>
                </CardContent>
              </Card>
              
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Was this meeting worth it?</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getWorthItStatus(selectedMeeting.worth_it).icon}
                    <span className="font-medium">{getWorthItStatus(selectedMeeting.worth_it).label}</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MeetingHistory;
