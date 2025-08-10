export const asanaTypography = {
  fontFamily: "var(--font-sans)",
  h1: {
    fontSize: '24px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
    color: 'var(--asana-text-primary)'
  },
  h2: {
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '0',
    lineHeight: 1.4,
    color: 'var(--asana-text-primary)'
  },
  body: {
    fontSize: '14px',
    fontWeight: 400,
    letterSpacing: '0',
    lineHeight: 1.5,
    color: 'var(--asana-text-secondary)'
  },
  small: {
    fontSize: '12px',
    fontWeight: 400,
    letterSpacing: '0',
    lineHeight: 1.5,
    color: 'var(--asana-text-tertiary)'
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '0',
    lineHeight: 1.5,
    color: 'var(--asana-text-secondary)',
    textTransform: 'uppercase' as const
  }
};

export const priorityConfig = {
  urgent: {
    bgColor: '#FFE5E5',
    textColor: '#D32F2F',
    label: 'Urgent'
  },
  high: { 
    bgColor: '#FFEEF0',
    textColor: '#E85D75',
    label: 'High'
  },
  normal: {
    bgColor: '#F3F4F6',
    textColor: '#6B6F76',
    label: 'Normal'
  },
  low: {
    bgColor: '#E6F5FF',
    textColor: '#0052CC',
    label: 'Low'
  }
};

export const calendarColors = {
  green: '#00BFA5',
  blue: '#007BFF',
  red: '#F44336',
  purple: '#796EFF',
  orange: '#FF9800',
  pink: '#E91E63',
  indigo: '#3F51B5',
  teal: '#009688'
};