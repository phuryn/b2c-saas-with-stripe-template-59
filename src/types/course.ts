
export interface Course {
  id: string;
  name: string;
  description: string | null;
  criteria: string | null;
  skills: string[] | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}
