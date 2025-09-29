/**
 * Represents a subject and its associated group for a student.
 */
export type SubjectGroup = {
  subject: string;
  group: string;
};

/**
 * Represents a role that can be fulfilled by students from specific subjects.
 */
export type Role = {
  id: string;
  name: string;
  description?: string;
  subjects: string[]; // List of subjects that can cover this role
  minimumStudents: number; // Minimum students required for this role per team
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
  role?: string; // Added role for context in role-based warnings
  group?: string; // Added group for context
  message: string;
  isCritical?: boolean; // Flag for critical failures
};

/**
 * Defines the mode for setting the minimum number of students per role.
 * 'global': A single minimum applies to all selected roles.
 * 'individual': Each selected role can have its own minimum.
 */
export type MinStudentMode = 'global' | 'individual';
