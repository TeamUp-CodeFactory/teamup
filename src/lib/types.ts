export interface SubjectGroup {
    subject: string;
    group: string;
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
}

export type MinStudentMode = 'global' | 'individual';
