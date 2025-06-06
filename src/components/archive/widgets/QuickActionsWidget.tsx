import { MessageSquare, FilePlus2, FolderPlus, LayoutTemplate } from 'lucide-react';

export function QuickActionsWidget() {
  return (
    <div className="widget">
      <div className="widget-header">
        <h3 className="widget-title">Quick actions</h3>
      </div>
      <div className="quick-actions-grid">
        <button className="btn btn-primary">
          <MessageSquare className="lucide" />
          Start chat
        </button>
        <button className="btn btn-secondary">
          <FilePlus2 className="lucide" />
          New note
        </button>
        <button className="btn btn-secondary">
          <FolderPlus className="lucide" />
          Create project
        </button>
        <button className="btn btn-secondary">
          <LayoutTemplate className="lucide" />
          Open canvas
        </button>
      </div>
    </div>
  );
}