import React from 'react';
import { Mail, Inbox, Send, Star } from 'lucide-react';
import { Button } from '../../../components/ui/design-system/Button';
import { WidgetHeader, ListItem } from '../../../components/ui/design-system';
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
    <div className="asana-card asana-card-padded">
      <WidgetHeader
        title={(<span className="asana-text-primary">Mail</span>)}
        actions={(
          <Button variant="ghost" size="sm" onClick={handleViewAll} className="text-[11px]">
            View all
          </Button>
        )}
      />

      <div className="asana-list-item asana-list-item--dense" aria-hidden>
        <div className="asana-text-sm asana-text-muted" style={{ display: 'flex', gap: 16 }}>
          <span><Inbox size={12} className="inline" /> <strong>{mailStats.unread}</strong> unread</span>
          <span><Star size={12} className="inline" /> <strong>{mailStats.starred}</strong> starred</span>
          <span><Send size={12} className="inline" /> <strong>{mailStats.drafts}</strong> drafts</span>
        </div>
      </div>

      <div>
        <div className="asana-text-sm asana-text-muted" style={{ margin: '4px 0 8px' }}>Recent</div>
        <div className="asana-flex asana-flex-col asana-gap-sm">
          {recentEmails.map((email) => (
            <ListItem
              key={email.id}
              leading={email.unread ? <span className="asana-list-dot" aria-hidden style={{ width: 8, height: 8, borderRadius: 8, background: 'var(--asana-info)' }} /> : null}
              primary={(<span className={email.unread ? 'asana-font-medium asana-text-primary' : 'asana-text-secondary'}>{email.sender}</span>)}
              secondary={(<>
                <span className={email.unread ? 'asana-font-medium asana-text-primary' : 'asana-text-secondary'}>{email.subject}</span>
                <span className="asana-text-muted"> — {email.preview}</span>
              </>)}
              meta={<span className="asana-text-muted asana-text-sm">{email.time}</span>}
              onActivate={handleViewAll}
            />
          ))}
        </div>
      </div>
    </div>
  );
}