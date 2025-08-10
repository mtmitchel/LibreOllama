export function formatRelativeCompact(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diffMs < min) return 'now';
  if (diffMs < hr) return `${Math.floor(diffMs / min)}m`;
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (d >= startToday) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const startYesterday = new Date(startToday.getTime() - day);
  if (d >= startYesterday) return 'yesterday';
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelativeVerbose(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60 * 1000) return 'Just now';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} minutes ago`;
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (d >= startToday) return `Today at ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  const startYesterday = new Date(startToday.getTime() - 24 * 60 * 60 * 1000);
  if (d >= startYesterday) return `Yesterday at ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}


