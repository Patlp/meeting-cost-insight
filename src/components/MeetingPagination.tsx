
import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface MeetingPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const MeetingPagination: React.FC<MeetingPaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  if (totalPages <= 1) return null;
  
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
        
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum = i + 1;
          
          if (totalPages > 5 && currentPage > 3) {
            pageNum = currentPage - 3 + i;
            if (pageNum > totalPages) pageNum = totalPages - (4 - i);
          }
          
          return (
            <PaginationItem key={i}>
              <PaginationLink 
                isActive={pageNum === currentPage}
                onClick={() => onPageChange(pageNum)}
                className="cursor-pointer"
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        
        {totalPages > 5 && currentPage < totalPages - 2 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        
        <PaginationItem>
          <PaginationNext 
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default MeetingPagination;
