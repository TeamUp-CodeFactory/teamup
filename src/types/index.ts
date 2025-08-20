/**
 * Represents a subject and its associated group for a student.
 */
export type SubjectGroup = {
  subject: string;
  group: string;
};

/**
 * Represents a student with their details and enrolled subjects/groups.
 */
export type Student = {
  ID: string | number;
  'Nombre completo': string;
  'Correo electrónico': string;
  Materias: SubjectGroup[]; // Changed from string[] to SubjectGroup[]
};

/**
 * Represents a team with its ID and assigned students.
 */
export type Team = {
  id: number;
  students: Student[];
};

/**
 * Represents a warning or critical error generated during the team assignment process.
 */
export type AssignmentWarning = {
  team?: number;
  subject?: string;
  group?: string; // Added group for context
  message: string;
  isCritical?: boolean; // Flag for critical failures
};

/**
 * Defines the mode for setting the minimum number of students per subject.
 * 'global': A single minimum applies to all selected subjects.
 * 'individual': Each selected subject can have its own minimum.
 */
export type MinStudentMode = 'global' | 'individual';
