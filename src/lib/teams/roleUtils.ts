import type { Student, Team, Role, SubjectGroup, MinStudentMode } from '@/types';

/**
 * Checks if a student can fulfill a specific role based on their subjects.
 * @param student The student to check.
 * @param role The role to check against.
 * @returns True if the student has at least one subject that covers the role.
 */
export const canStudentFulfillRole = (student: Student, role: Role): boolean => {
    return student.Materias.some(sg => role.subjects.includes(sg.subject));
};

/**
 * Gets the subject-group combination that allows a student to fulfill a role.
 * @param student The student to check.
 * @param role The role to check against.
 * @returns The SubjectGroup that covers the role, or undefined if none.
 */
export const getStudentSubjectForRole = (student: Student, role: Role): SubjectGroup | undefined => {
    return student.Materias.find(sg => role.subjects.includes(sg.subject));
};

/**
 * Counts the number of students in a team who can fulfill a specific role.
 * @param team The team to check.
 * @param role The role to count students for.
 * @returns The number of students in the team who can fulfill the role.
 */
export const countStudentsWithRole = (team: Team, role: Role): number => {
    return team.students.filter(student => canStudentFulfillRole(student, role)).length;
};

/**
 * Counts the number of students in a team who can fulfill a role and are from a specific group.
 * This ensures that students fulfilling the same role are from the same group.
 * @param team The team to check.
 * @param role The role to check.
 * @param subject The subject covering the role.
 * @param group The specific group within the subject.
 * @returns The number of students in the team for that role and group.
 */
export const countRoleStudentsInGroup = (team: Team, role: Role, subject: string, group: string): number => {
    return team.students.filter(student => {
        const studentSubjectGroup = getStudentSubjectForRole(student, role);
        return studentSubjectGroup && 
               studentSubjectGroup.subject === subject && 
               studentSubjectGroup.group === group;
    }).length;
};

/**
 * Gets the configured minimum number of students for a role based on the current mode.
 * @param role The role in question.
 * @param minMode The current minimum student mode ('global' or 'individual').
 * @param globalMinStudents The global minimum if mode is 'global'.
 * @param individualMinRoles The map of individual minimums if mode is 'individual'.
 * @returns The configured minimum number of students for the role.
 */
export const getConfiguredRoleMinimum = (
    role: Role,
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinRoles: Record<string, number>
): number => {
    if (minMode === 'individual') {
        return Math.max(1, individualMinRoles[role.id] ?? role.minimumStudents);
    }
    return Math.max(1, globalMinStudents);
};

/**
 * Gets the upper limit for the number of students for a role in a team.
 * This is typically the configured minimum + 1.
 * @param role The role in question.
 * @param minMode The current minimum student mode.
 * @param globalMinStudents The global minimum.
 * @param individualMinRoles The map of individual minimums.
 * @returns The upper limit for students for the role in a team.
 */
export const getUpperLimitForRoleInTeam = (
    role: Role,
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinRoles: Record<string, number>
): number => {
    return getConfiguredRoleMinimum(role, minMode, globalMinStudents, individualMinRoles) + 1;
};

/**
 * Gets all unique groups for a role within a team.
 * This helps identify group conflicts for role assignments.
 * @param team The team to check.
 * @param role The role to check.
 * @returns A set of unique groups covering the role in the team.
 */
export const getGroupsForRoleInTeam = (team: Team, role: Role): Set<string> => {
    const groups = new Set<string>();
    team.students.forEach(student => {
        const studentSubjectGroup = getStudentSubjectForRole(student, role);
        if (studentSubjectGroup) {
            groups.add(studentSubjectGroup.group);
        }
    });
    return groups;
};

/**
 * Checks if adding a student to a team would create a group conflict for a role.
 * @param student The student to potentially add.
 * @param team The team to check.
 * @param role The role being fulfilled.
 * @returns True if there would be a group conflict.
 */
export const wouldCreateRoleGroupConflict = (student: Student, team: Team, role: Role): boolean => {
    const studentSubjectGroup = getStudentSubjectForRole(student, role);
    if (!studentSubjectGroup) return false;
    
    const existingGroups = getGroupsForRoleInTeam(team, role);
    return existingGroups.size > 0 && !existingGroups.has(studentSubjectGroup.group);
};

/**
 * Finds the role that a given subject covers.
 * @param subject The subject to check.
 * @param roles Array of available roles.
 * @returns The role that includes this subject, or undefined if none.
 */
export const findRoleForSubject = (subject: string, roles: Role[]): Role | undefined => {
    return roles.find(role => role.subjects.includes(subject));
};

/**
 * Gets all roles that a student can fulfill based on their subjects.
 * @param student The student to check.
 * @param roles Array of available roles.
 * @returns Array of roles the student can fulfill.
 */
export const getRolesForStudent = (student: Student, roles: Role[]): Role[] => {
    return roles.filter(role => canStudentFulfillRole(student, role));
};