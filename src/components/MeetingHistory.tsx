import React from 'react';
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
import { Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

const MeetingHistory: React.FC = () => {
  const { user } = useAuth();
  const [page, setPage] = React.useState(1);
  const pageSize = 5;

  const fetchMeetingLogs = async (): Promise<MeetingLog[]> => {
    if (!user) return [];

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
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {meetings.map((meeting) => (
            <TableRow key={meeting.id}>
              <TableCell>{format(new Date(meeting.created_at || meeting.timestamp || ''), 'MMM d, yyyy')}</TableCell>
              <TableCell>{meeting.purpose || '—'}</TableCell>
              <TableCell className="text-right">{meeting.duration} min</TableCell>
              <TableCell className="text-right">{meeting.attendees}</TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(meeting.total_cost)}
              </TableCell>
              <TableCell className="text-right">
                {meeting.worth_it === true ? '✅' : meeting.worth_it === false ? '❌' : '—'}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => deleteMeeting(meeting.id as string)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
    </div>
  );
};

export default MeetingHistory;
