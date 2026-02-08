
export interface LessonPlanRequest {
  curriculumTopic: string;
  studentInterests: string[];
  targetGrade: string;
  institutionType: 'Sekolah' | 'Madrasah';
}

export interface GeneratedPlan {
  id?: string;
  title: string;
  content: string;
  timestamp: string;
  topic?: string;
}

export interface ClassProfile {
  id: string;
  name: string;
  interests: string[];
  studentCount: number;
}

export interface TeacherSettings {
  name: string;
  school: string;
  nip: string;
  city: string;
  headmasterName: string;
  headmasterNip: string;
}

export type AppView = 'dashboard' | 'library' | 'students' | 'settings';
