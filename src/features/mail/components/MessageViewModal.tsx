import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui';
import { MessageView } from './MessageView';
import { useMailStore } from '../stores/mailStore';

export function MessageViewModal() {
  const { currentMessage, clearCurrentMessage } = useMailStore();

  if (!currentMessage) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <MessageView />
      </div>
    </div>
  );
}

export default MessageViewModal;