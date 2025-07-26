// Asana Design System Constants
// Shared between Calendar and Tasks pages

export const asanaTypography = {
  fontFamily: "var(--font-sans)",
  h1: {
    fontSize: '24px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
    color: '#151B26'
  },
  h2: {
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '0',
    lineHeight: 1.4,
    color: '#151B26'
  },
  h3: {
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '0',
    lineHeight: 1.5,
    color: '#151B26'
  },
  body: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.6,
    letterSpacing: '0',
    color: '#6B6F76'
  },
  small: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0',
    color: '#9CA6AF'
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#6B6F76'
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
  medium: { 
    bgColor: '#FFF6E6',
    textColor: '#E68900',
    label: 'Medium'
  },
  normal: {
    bgColor: '#F3F4F6',
    textColor: '#6B6F76',
    label: 'Normal'
  },
  low: { 
    bgColor: '#E8F5F3',
    textColor: '#14A085',
    label: 'Low'
  }
};

export const columnColors = ['#E362F8', '#F8DF72', '#7DA7F9', '#4ECBC4', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];