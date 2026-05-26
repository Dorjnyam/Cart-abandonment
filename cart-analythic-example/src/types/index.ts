export type Theme = 'light' | 'dark';
export type Language = 'EN' | 'MN';

export type PageId = 
  | 'login' 
  | 'signup' 
  | 'overview' 
  | 'analytics' 
  | 'sessions' 
  | 'session-detail' 
  | 'diagnosis' 
  | 'recommendations' 
  | 'pipeline' 
  | 'installation' 
  | 'settings' 
  | 'profile' 
  | 'admin'
  | 'forgot-password'
  | 'ablation';

export interface User {
  name: string;
  email: string;
  role: 'Owner' | 'Developer' | 'Member';
}
