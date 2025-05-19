
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MeetingLog } from '@/types/meeting';
import { toast } from '@/components/ui/use-toast';
import MeetingHistoryTable from './MeetingHistoryTable';
import MeetingDetailsDialog from './MeetingDetailsDialog';
import MeetingPagination from './MeetingPagination';
import EmptyMeetingHistory from './EmptyMeetingHistory';

const MeetingHistory: React.FC = () => {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchMeetingLogs = async (): Promise<MeetingLog[]> => {
    if (!user) return [];

    // Fetch from the database
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
    
    // Get count from database
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
    return <EmptyMeetingHistory />;
  }

  return (
    <div className="space-y-4">
      <MeetingHistoryTable 
        meetings={meetings} 
        onViewDetails={showMeetingDetails} 
        onDeleteMeeting={deleteMeeting} 
      />

      <MeetingPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <MeetingDetailsDialog
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        meeting={selectedMeeting}
      />
    </div>
  );
};

export default MeetingHistory;
