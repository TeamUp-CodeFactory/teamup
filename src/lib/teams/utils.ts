
import type { Student, Team, MinStudentMode, SubjectGroup, Role } from '@/types';
import { 
    canStudentFulfillRole, 
    countStudentsWithRole, 
    getConfiguredRoleMinimum,
    getUpperLimitForRoleInTeam
} from './roleUtils';

/**
 * Represents a course as a combination of subject and group.
 */
export type Course = {
    subject: string;
    group: string;
};

/**
 * Creates a course identifier string from subject and group.
 * @param subject The subject name.
 * @param group The group name.
 * @returns A string identifier for the course.
 */
export const createCourseId = (subject: string, group: string): string => {
    return `${subject}-${group}`;
};

/**
 * Parses a course identifier string back to subject and group.
 * @param courseId The course identifier string.
 * @returns An object with subject and group.
 */
export const parseCourseId = (courseId: string): Course => {
    const lastDashIndex = courseId.lastIndexOf('-');
    if (lastDashIndex === -1) {
        throw new Error(`Invalid course ID format: ${courseId}`);
    }
    return {
        subject: courseId.substring(0, lastDashIndex),
        group: courseId.substring(lastDashIndex + 1)
    };
};

/**
 * Gets all unique courses (subject-group combinations) from a list of students.
 * @param students The list of students.
 * @returns An array of unique courses.
 */
export const getAllCoursesFromStudents = (students: Student[]): Course[] => {
    const courseSet = new Set<string>();
    
    students.forEach(student => {
        student.Materias.forEach(sg => {
            courseSet.add(createCourseId(sg.subject, sg.group));
        });
    });
    
    return Array.from(courseSet).map(parseCourseId);
};

/**
 * Groups students by course (subject-group combination).
 * @param students The list of students to group.
 * @returns A map where key is course ID and value is array of students in that course.
 */
export const groupStudentsByCourse = (students: Student[]): Map<string, Student[]> => {
    const courseGroups = new Map<string, Student[]>();
    
    students.forEach(student => {
        student.Materias.forEach(sg => {
            const courseId = createCourseId(sg.subject, sg.group);
            if (!courseGroups.has(courseId)) {
                courseGroups.set(courseId, []);
            }
            if (!courseGroups.get(courseId)!.some(s => s.ID === student.ID)) {
                courseGroups.get(courseId)!.push(student);
            }
        });
    });
    
    return courseGroups;
};

/**
 * Gets all courses that a student belongs to.
 * @param student The student.
 * @returns An array of courses the student belongs to.
 */
export const getStudentCourses = (student: Student): Course[] => {
    return student.Materias.map(sg => ({
        subject: sg.subject,
        group: sg.group
    }));
};

/**
 * Checks if a student belongs to a specific course.
 * @param student The student to check.
 * @param course The course to check for.
 * @returns True if the student belongs to the course.
 */
export const studentBelongsToCourse = (student: Student, course: Course): boolean => {
    return student.Materias.some(sg => sg.subject === course.subject && sg.group === course.group);
};

/**
 * Gets all students that belong to a specific course.
 * @param students The list of students.
 * @param course The course to filter by.
 * @returns Students that belong to the course.
 */
export const getStudentsInCourse = (students: Student[], course: Course): Student[] => {
    return students.filter(student => studentBelongsToCourse(student, course));
};

/**
 * Gets all courses that exist in a team.
 * @param team The team to analyze.
 * @returns An array of unique courses in the team.
 */
export const getTeamCourses = (team: Team): Course[] => {
    const courseSet = new Set<string>();
    
    team.students.forEach(student => {
        student.Materias.forEach(sg => {
            courseSet.add(createCourseId(sg.subject, sg.group));
        });
    });
    
    return Array.from(courseSet).map(parseCourseId);
};

/**
 * Checks if adding a student to a team would create course conflicts.
 * A conflict occurs when students from different groups of the same subject are in the same team.
 * @param team The team to check.
 * @param student The student to potentially add.
 * @returns True if adding the student would create conflicts, false otherwise.
 */
export const wouldCreateCourseConflict = (team: Team, student: Student): boolean => {
    const teamCourses = getTeamCourses(team);
    const studentCourses = getStudentCourses(student);
    
    // Check if any of the student's subjects conflict with existing team courses
    for (const studentCourse of studentCourses) {
        for (const teamCourse of teamCourses) {
            // Same subject but different group = conflict
            if (studentCourse.subject === teamCourse.subject && studentCourse.group !== teamCourse.group) {
                return true;
            }
        }
    }
    
    return false;
};

/**
 * Gets the courses that would conflict if a student were added to a team.
 * @param team The team to check.
 * @param student The student to potentially add.
 * @returns An array of course conflicts (student course vs team course).
 */
export const getCourseConflicts = (team: Team, student: Student): Array<{studentCourse: Course, teamCourse: Course}> => {
    const teamCourses = getTeamCourses(team);
    const studentCourses = getStudentCourses(student);
    const conflicts: Array<{studentCourse: Course, teamCourse: Course}> = [];
    
    for (const studentCourse of studentCourses) {
        for (const teamCourse of teamCourses) {
            if (studentCourse.subject === teamCourse.subject && studentCourse.group !== teamCourse.group) {
                conflicts.push({ studentCourse, teamCourse });
            }
        }
    }
    
    return conflicts;
};

/**
 * Filters students that can be safely added to a team without creating course conflicts.
 * @param team The team to check compatibility with.
 * @param students The list of students to filter.
 * @returns Students that can be added without conflicts.
 */
export const getCompatibleStudentsForTeam = (team: Team, students: Student[]): Student[] => {
    return students.filter(student => !wouldCreateCourseConflict(team, student));
};

/**
 * Counts the number of students in a team who are part of a specific subject-group.
 * @param team The team to check.
 * @param subject The subject to filter by.
 * @param group The group within the subject to filter by.
 * @returns The number of students in the team for that subject-group.
 */
export const countGroupStudents = (team: Team, subject: string, group: string): number => {
    return team.students.filter(s => s.Materias.some(sg => sg.subject === subject && sg.group === group)).length;
};

/**
 * Counts the number of students in a team who have a specific subject (any group).
 * @param team The team to check.
 * @param subject The subject to count students for.
 * @returns The number of students in the team with that subject.
 */
export const countStudentsWithSubject = (team: Team, subject: string): number => {
    return team.students.filter(s => s.Materias.some(sg => sg.subject === subject)).length;
};


/**
 * Gets the configured minimum number of students for a subject based on the current mode.
 * This is the primary function to consult for defined minimums.
 * @param subject The subject in question.
 * @param minMode The current minimum student mode ('global' or 'individual').
 * @param globalMinStudents The global minimum if mode is 'global'.
 * @param individualMinStudents The map of individual minimums if mode is 'individual'.
 * @returns The configured minimum number of students for the subject (defaults to 1 if not specified).
 */
export const getConfiguredSubjectMinimum = (
    subject: string,
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>
): number => {
    if (minMode === 'individual') {
        return Math.max(1, individualMinStudents[subject] ?? 1);
    }
    return Math.max(1, globalMinStudents); // Ensure global minimum is at least 1
};

/**
 * Gets the upper limit for the number of students for a subject in a team.
 * This is typically the configured minimum + 1.
 * @param subject The subject in question.
 * @param minMode The current minimum student mode.
 * @param globalMinStudents The global minimum.
 * @param individualMinStudents The map of individual minimums.
 * @returns The upper limit for students for the subject in a team.
 */
export const getUpperLimitForSubjectInTeam = (
    subject: string,
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>
): number => {
    return getConfiguredSubjectMinimum(subject, minMode, globalMinStudents, individualMinStudents) + 1;
};


/**
 * Calculates a score for a potential move of a student between teams.
 * A lower (more negative) score indicates a better move.
 * Considers team balance, fulfillment of subject minimums, and adherence to upper limits.
 * @param student The student to move.
 * @param sourceTeam The student's current team.
 * @param targetTeam The team the student would move to.
 * @param selectedSubjects List of subjects considered for allocation.
 * @param minMode Mode for minimum student requirements.
 * @param globalMinStudents Global minimum.
 * @param individualMinStudents Individual subject minimums.
 * @param averageTeamSize Ideal average team size.
 * @returns A score indicating the desirability of the move.
 */
export const calculateMoveScore = (
    student: Student,
    sourceTeam: Team,
    targetTeam: Team,
    selectedSubjects: string[],
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>,
    averageTeamSize: number
): number => {
    let scoreChange = 0;

    // 1. Team Size Balance
    const sourceSizeBefore = sourceTeam.students.length;
    const targetSizeBefore = targetTeam.students.length;
    const sourceSizeAfter = sourceSizeBefore - 1;
    const targetSizeAfter = targetSizeBefore + 1;

    const penaltyBefore = Math.abs(sourceSizeBefore - averageTeamSize) + Math.abs(targetSizeBefore - averageTeamSize);
    const penaltyAfter = Math.abs(sourceSizeAfter - averageTeamSize) + Math.abs(targetSizeAfter - averageTeamSize);
    scoreChange += (penaltyAfter - penaltyBefore);

    // 2. Subject Minimums and Upper Limits Fulfillment
    student.Materias.forEach(sg => {
        if (selectedSubjects.includes(sg.subject)) {
            const subject = sg.subject;
            const configuredMin = getConfiguredSubjectMinimum(subject, minMode, globalMinStudents, individualMinStudents);
            const upperLimit = getUpperLimitForSubjectInTeam(subject, minMode, globalMinStudents, individualMinStudents);

            // Simulate counts after move for this specific subject
            const sourceCountSubjectBefore = countStudentsWithSubject(sourceTeam, subject);
            const targetCountSubjectBefore = countStudentsWithSubject(targetTeam, subject);
            const sourceCountSubjectAfter = sourceCountSubjectBefore - (student.Materias.some(s_g => s_g.subject === subject) ? 1 : 0);
            const targetCountSubjectAfter = targetCountSubjectBefore + (student.Materias.some(s_g => s_g.subject === subject) ? 1 : 0);


            // Penalize if source drops below minimum
            if (sourceCountSubjectBefore >= configuredMin && sourceCountSubjectAfter < configuredMin) {
                scoreChange += 10; // High penalty for dropping below minimum
            }
            // Reward if source moves from above upperLimit towards/below it
            if (sourceCountSubjectBefore > upperLimit && sourceCountSubjectAfter <= upperLimit) {
                scoreChange -= 3;
            }


            // Reward if target meets minimum
            if (targetCountSubjectBefore < configuredMin && targetCountSubjectAfter >= configuredMin) {
                scoreChange -= 10; // High reward for meeting minimum
            }
            // Penalize if target exceeds upper limit (and wasn't already below min)
            if (targetCountSubjectBefore >= configuredMin && targetCountSubjectAfter > upperLimit) {
                scoreChange += 7; // Significant penalty for exceeding upper limit
            }
             // Reward if target was below upper limit and stays below or at it (but met min)
            else if (targetCountSubjectBefore < upperLimit && targetCountSubjectAfter <= upperLimit && targetCountSubjectAfter >= configuredMin) {
                // scoreChange -=1; // Slight reward
            }
        }
    });

    return scoreChange;
};


/**
 * Checks if a team has a committed group for a given subject.
 * @param teamId The ID of the team.
 * @param subject The subject to check.
 * @param teamSubjectGroupCommitment Map of team commitments.
 * @returns The committed group string, or undefined if no commitment.
 */
export const checkSubjectGroupCommitment = (
    teamId: number,
    subject: string,
    teamSubjectGroupCommitment: Map<number, Map<string, string>>
): string | undefined => {
    return teamSubjectGroupCommitment.get(teamId)?.get(subject);
};

/**
 * Gets the list of students available for a specific subject from a list of all students.
 * @param subjectName The name of the subject.
 * @param allStudents The list of all students.
 * @returns An array of students enrolled in the specified subject.
 */
export const getStudentsForSubject = (subjectName: string, allStudents: Student[]): Student[] => {
    return allStudents.filter(student => student.Materias.some(m => m.subject === subjectName));
};











// =====================
// Funciones auxiliares
// =====================

/**
 * Get critical warning message for a subject based on student enrollment and configured minimum.
 */
export function getCriticalSubjectWarning(
    subject: string,
    studentsInSubject: number,
    configuredMin: number
): string | null {
    if (studentsInSubject === 0 && configuredMin > 0) {
        return `No hay estudiantes matriculados en la materia '${subject}', la cual tiene un mínimo requerido de ${configuredMin}. Imposible formar equipos.`;
    }
    if (studentsInSubject < configuredMin && studentsInSubject > 0) {
        return `No hay suficientes estudiantes (${studentsInSubject}) en la materia '${subject}' para cumplir el mínimo requerido de ${configuredMin} para formar al menos un equipo.`;
    }
    return null;
}

/**
 * Get the maximum number of teams that can be formed for a subject based on student count and configured minimum.
 */
export function getMaxTeams(
    studentsInSubject: number,
    configuredMin: number,
    userRequestedNumberOfTeams: number
): number {
    if (configuredMin === 0) return userRequestedNumberOfTeams;
    return Math.floor(studentsInSubject / configuredMin);
}

/**
 * Get sorted list of subjects based on student enrollment.
 */
export function getSortedSubjects(
    selectedSubjects: string[],
    allStudents: Student[]
): string[] {
    const subjectCounts = selectedSubjects.map(subject => ({
        name: subject,
        count: getStudentsForSubject(subject, allStudents).length,
    }));
    subjectCounts.sort((a, b) => a.count - b.count);
    return subjectCounts.map(s => s.name);
}

// =====================
// Role-based functions
// =====================

/**
 * Calculates a score for a potential move of a student between teams based on roles.
 * A lower (more negative) score indicates a better move.
 * @param student The student to move.
 * @param sourceTeam The student's current team.
 * @param targetTeam The team the student would move to.
 * @param selectedRoles List of roles considered for allocation.
 * @param minMode Mode for minimum student requirements.
 * @param globalMinStudents Global minimum.
 * @param individualMinStudents Individual role minimums.
 * @param averageTeamSize Ideal average team size.
 * @returns A score indicating the desirability of the move.
 */
export const calculateRoleMoveScore = (
    student: Student,
    sourceTeam: Team,
    targetTeam: Team,
    selectedRoles: Role[],
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>,
    averageTeamSize: number
): number => {
    let scoreChange = 0;

    // 1. Team Size Balance
    const sourceSizeBefore = sourceTeam.students.length;
    const targetSizeBefore = targetTeam.students.length;
    const sourceSizeAfter = sourceSizeBefore - 1;
    const targetSizeAfter = targetSizeBefore + 1;

    const penaltyBefore = Math.abs(sourceSizeBefore - averageTeamSize) + Math.abs(targetSizeBefore - averageTeamSize);
    const penaltyAfter = Math.abs(sourceSizeAfter - averageTeamSize) + Math.abs(targetSizeAfter - averageTeamSize);
    scoreChange += (penaltyAfter - penaltyBefore);

    // 2. Role Fulfillment Impact
    selectedRoles.forEach(role => {
        if (canStudentFulfillRole(student, role)) {
            const configuredMin = getConfiguredRoleMinimum(role, minMode, globalMinStudents, individualMinStudents);
            const upperLimit = getUpperLimitForRoleInTeam(role, minMode, globalMinStudents, individualMinStudents);

            const sourceCountRoleBefore = countStudentsWithRole(sourceTeam, role);
            const targetCountRoleBefore = countStudentsWithRole(targetTeam, role);
            const sourceCountRoleAfter = sourceCountRoleBefore - 1;
            const targetCountRoleAfter = targetCountRoleBefore + 1;

            // Penalize if source drops below minimum
            if (sourceCountRoleBefore >= configuredMin && sourceCountRoleAfter < configuredMin) {
                scoreChange += 10; // High penalty for dropping below minimum
            }
            // Reward if source moves from above upperLimit towards/below it
            if (sourceCountRoleBefore > upperLimit && sourceCountRoleAfter <= upperLimit) {
                scoreChange -= 3;
            }

            // Reward if target meets minimum
            if (targetCountRoleBefore < configuredMin && targetCountRoleAfter >= configuredMin) {
                scoreChange -= 10; // High reward for meeting minimum
            }
            // Penalize if target exceeds upper limit (and wasn't already below min)
            if (targetCountRoleBefore >= configuredMin && targetCountRoleAfter > upperLimit) {
                scoreChange += 7; // Significant penalty for exceeding upper limit
            }
        }
    });

    return scoreChange;
};

/**
 * Gets the list of students available for a specific role from a list of all students.
 * @param role The role to check.
 * @param allStudents The list of all students.
 * @returns An array of students who can fulfill the specified role.
 */
export const getStudentsForRole = (role: Role, allStudents: Student[]): Student[] => {
    return allStudents.filter(student => canStudentFulfillRole(student, role));
};

/**
 * Get critical warning message for a role based on student enrollment and configured minimum.
 */
export function getCriticalRoleWarning(
    role: Role,
    studentsInRole: number,
    configuredMin: number
): string | null {
    if (studentsInRole === 0 && configuredMin > 0) {
        return `No hay estudiantes que puedan cumplir el rol '${role.name}', el cual tiene un mínimo requerido de ${configuredMin}. Imposible formar equipos.`;
    }
    if (studentsInRole < configuredMin && studentsInRole > 0) {
        return `No hay suficientes estudiantes (${studentsInRole}) que puedan cumplir el rol '${role.name}' para cumplir el mínimo requerido de ${configuredMin} para formar al menos un equipo.`;
    }
    return null;
}

/**
 * Get the maximum number of teams that can be formed for a role based on student count and configured minimum.
 */
export function getMaxTeamsForRole(
    studentsInRole: number,
    configuredMin: number,
    userRequestedNumberOfTeams: number
): number {
    if (configuredMin === 0) return userRequestedNumberOfTeams;
    return Math.floor(studentsInRole / configuredMin);
}

/**
 * Get sorted list of roles based on student availability.
 */
export function getSortedRoles(
    selectedRoles: Role[],
    allStudents: Student[]
): Role[] {
    const roleCounts = selectedRoles.map(role => ({
        role: role,
        count: getStudentsForRole(role, allStudents).length,
    }));
    roleCounts.sort((a, b) => a.count - b.count);
    return roleCounts.map(r => r.role);
}
