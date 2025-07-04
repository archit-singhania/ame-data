export interface User {
  id?: number;
  name: string;
  rank: string;
  regt_id: string;
  identity: string;
  password: string;
  role: 'admin' | 'doctor' | 'personnel';
  created_at?: string;
  created_by?: number;
}
