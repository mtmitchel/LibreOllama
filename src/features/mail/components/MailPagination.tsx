import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Text } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';

interface MailPaginationProps {
  className?: string;
}

export function MailPagination({ className = '' }: MailPaginationProps) {
  console.log('🔵 [PAGINATION] Component function called - attempting to render');
  
  const { 
    currentPage, 
    pageSize, 
    totalMessages, 
    currentPageStartIndex, 
    nextPageToken, 
    prevPage, 
    nextPage, 
    isLoadingMessages,
    getMessages 
  } = useMailStore();

  const messages = getMessages();
  const currentPageMessages = messages.length;
  const startIndex = currentPageStartIndex + 1;
  const endIndex = currentPageStartIndex + currentPageMessages;
  const hasPrevious = currentPage > 1;
  const hasNext = !!nextPageToken;

  console.log('🔵 [PAGINATION] Render state:', {
    currentPageMessages,
    totalMessages,
    messages: messages.length,
    willRender: currentPageMessages > 0
  });

  const handlePreviousPage = async () => {
    console.log('🔥 [PAGINATION] PREVIOUS PAGE HANDLER CALLED!!!');
    console.log('📄 [PAGINATION] Previous page clicked, hasPrevious:', hasPrevious, 'isLoading:', isLoadingMessages);
    if (hasPrevious && !isLoadingMessages) {
      await prevPage();
    }
  };

  const handleNextPage = async () => {
    console.log('🔥 [PAGINATION] NEXT PAGE HANDLER CALLED!!!');
    console.log('📄 [PAGINATION] Next page clicked, hasNext:', hasNext, 'isLoading:', isLoadingMessages);
    console.log('📄 [PAGINATION] nextPageToken:', nextPageToken);
    if (hasNext && !isLoadingMessages) {
      await nextPage();
    }
  };

  // Debug pagination state
  React.useEffect(() => {
    console.log('📄 [PAGINATION] currentPage:', currentPage);
    console.log('📄 [PAGINATION] hasNext:', hasNext);
    console.log('📄 [PAGINATION] hasPrevious:', hasPrevious);
    console.log('📄 [PAGINATION] nextPageToken:', nextPageToken);
    console.log('📄 [PAGINATION] currentPageMessages:', currentPageMessages);
    console.log('📄 [PAGINATION] totalMessages:', totalMessages);
    console.log('📄 [PAGINATION] isLoadingMessages:', isLoadingMessages);
    console.log('📄 [PAGINATION] Next button disabled:', !hasNext || isLoadingMessages);
    console.log('📄 [PAGINATION] Previous button disabled:', !hasPrevious || isLoadingMessages);
  }, [currentPage, currentPageMessages, totalMessages, hasNext, hasPrevious, nextPageToken, isLoadingMessages]);

  if (currentPageMessages === 0) {
    console.log('🔵 [PAGINATION] Early return - no messages to paginate');
    return null;
  }

  console.log('🔵 [PAGINATION] About to render pagination component');

  return (
    <div 
      className={`flex items-center justify-between p-4 border-t border-[var(--border-default)] bg-[var(--bg-tertiary)] ${className}`}
    >
      {/* Message count info */}
      <div className="flex items-center gap-2">
        <Text size="sm" variant="secondary">
          {startIndex}-{endIndex} of {totalMessages > endIndex ? `${totalMessages}+` : totalMessages}
        </Text>
        
        {/* Loading indicator */}
        {isLoadingMessages && (
          <div className="w-4 h-4 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            console.log('🚨 [PAGINATION] PREVIOUS BUTTON CLICKED - RAW EVENT!!!');
            e.preventDefault();
            console.log('📄 [PAGINATION] Previous button clicked!');
            handlePreviousPage();
          }}
          disabled={!hasPrevious || isLoadingMessages}
          title="Previous page"
          className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            console.log('🚨 [PAGINATION] NEXT BUTTON CLICKED - RAW EVENT!!!');
            e.preventDefault();
            console.log('📄 [PAGINATION] Next button clicked!');
            handleNextPage();
          }}
          disabled={!hasNext || isLoadingMessages}
          title="Next page"
          className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
} 