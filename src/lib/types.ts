export interface SubjectGroup {
    subject: string;
    group: string;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    subjects: string[]; // List of subjects that can cover this role
    minimumStudents: number; // Minimum students required for this role per team
}

export interface Student {
    ID: number | string;
    "Nombre completo": string;
    Materias: SubjectGroup[];
}

export interface Team {
    id: number;
    students: Student[];
}

export interface AssignmentWarning {
    message: string;
    isCritical: boolean;
    team?: number;
    subject?: string;
    role?: string;
}

export type MinStudentMode = 'global' | 'individual';
