// TypeScript types for LibreOllama

export interface User {
  id: string;
  name: string;
  email?: string;
}

export interface AppConfig {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
}

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
