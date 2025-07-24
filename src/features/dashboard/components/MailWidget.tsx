import React from 'react';
import { Mail, Inbox, Send, Star } from 'lucide-react';
import { Button } from '../../../components/ui';
import { useNavigate } from 'react-router-dom';

interface MailStats {
  unread: number;
  starred: number;
  drafts: number;
}

export function MailWidget() {
  const navigate = useNavigate();

  // Mock data - replace with actual data from your store/API
  const mailStats: MailStats = {
    unread: 12,
    starred: 5,
    drafts: 2
  };

  const recentEmails = [
    {
      id: '1',
      sender: 'John Doe',
      subject: 'Project Update',
      preview: 'Hi, I wanted to update you on the current progress...',
      time: '10:30 AM',
      unread: true
    },
    {
      id: '2',
      sender: 'Jane Smith',
      subject: 'Meeting Tomorrow',
      preview: 'Just a reminder about our meeting scheduled for...',
      time: '9:15 AM',
      unread: true
    },
    {
      id: '3',
      sender: 'Mike Johnson',
      subject: 'Re: Budget Proposal',
      preview: 'Thanks for sending the proposal. I have reviewed...',
      time: 'Yesterday',
      unread: false
    }
  ];

  const handleViewAll = () => {
    navigate('/mail');
  };

  return (
    <div className="bg-card rounded-xl border border-border-default p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Mail size={20} className="text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold">Mail</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewAll}
          className="text-xs"
        >
          View all
        </Button>
      </div>

      {/* Stats - Compact inline version */}
      <div className="flex items-center gap-4 mb-3 text-sm">
        <div className="flex items-center gap-1">
          <Inbox size={12} className="text-blue-500" />
          <span className="font-medium">{mailStats.unread}</span>
          <span className="text-xs text-secondary">unread</span>
        </div>
        <div className="flex items-center gap-1">
          <Star size={12} className="text-yellow-500" />
          <span className="font-medium">{mailStats.starred}</span>
          <span className="text-xs text-secondary">starred</span>
        </div>
        <div className="flex items-center gap-1">
          <Send size={12} className="text-green-500" />
          <span className="font-medium">{mailStats.drafts}</span>
          <span className="text-xs text-secondary">drafts</span>
        </div>
      </div>

      {/* Recent Emails */}
      <div className="flex-1 overflow-y-auto">
        <h4 className="text-sm font-medium text-secondary mb-2">Recent</h4>
        <div className="space-y-2">
          {recentEmails.map((email) => (
            <div
              key={email.id}
              className="p-3 rounded-lg bg-tertiary/50 hover:bg-tertiary transition-colors cursor-pointer"
              onClick={handleViewAll}
            >
              <div className="flex items-start gap-2">
                {email.unread && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className={`text-sm font-medium truncate ${email.unread ? 'text-primary' : 'text-secondary'}`}>
                      {email.sender}
                    </h5>
                    <span className="text-xs text-secondary whitespace-nowrap">{email.time}</span>
                  </div>
                  <p className={`text-sm truncate ${email.unread ? 'text-primary font-medium' : 'text-secondary'}`}>
                    {email.subject}
                  </p>
                  <p className="text-xs text-secondary truncate mt-0.5">{email.preview}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}