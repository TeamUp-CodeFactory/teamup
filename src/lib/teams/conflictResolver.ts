
import type { Student, Team, SubjectGroup, MinStudentMode } from '@/types';
import { assignStudent, removeStudent } from './manager';
import { countGroupStudents, getConfiguredSubjectMinimum } from './utils';

/**
 * Checks if assigning a student to a team would violate group consistency for any subject.
 * @param student - The student being considered for assignment.
 * @param team - The team to which the student might be assigned.
 * @param teamSubjectGroupCommitment - A map tracking the subject group commitments for each team.
 * @returns - The conflicting SubjectGroup { subject, group: committedGroupInTeam } if a conflict exists, otherwise null.
 */
export const findGroupConflict = (
    student: Student,
    team: Team,
    teamSubjectGroupCommitment: Map<number, Map<string, string>>
): SubjectGroup | null => {
    // Get the subject group commitments for the current team.
    const teamCommitments = teamSubjectGroupCommitment.get(team.id);

    for (const sg of student.Materias) {
        // Check against established team commitment.
        const committedGroup = teamCommitments?.get(sg.subject);

        if (committedGroup && committedGroup !== sg.group) {
            // Conflict: Student's group doesn't match the team's established group for this subject.
            return { subject: sg.subject, group: committedGroup }; // Return the conflicting subject and the group committed in the team.
        }

        // Check against other students already in the team for group consistency.
        for (const existingStudent of team.students) {
            // Find the existing student's SubjectGroup for the same subject.
            const existingSg = existingStudent.Materias.find(esg => esg.subject === sg.subject);

            // If found and the groups don't match, there's a conflict.
            if (existingSg && existingSg.group !== sg.group) {
                return { subject: sg.subject, group: existingSg.group }; // Return the conflicting subject and the group present in the team.
            }
        }
    }
    return null; // No conflicts found.
};

/**
 * Attempts to resolve a conflict by moving a conflicting student to another team.
 * @param studentToAssign - The student causing the conflict check.
 * @param targetTeam - The team to which the student is being assigned.
 * @param conflictingSubject - The subject causing the conflict.
 * @param conflictingGroupInTeam - The group established/present in the target team for the conflicting subject.
 * @param teams - All teams available for assignment.
 * @param teamSubjectGroupCommitment - A map tracking the subject group commitments for each team.
 * @param selectedSubjects - The subjects selected for assignment.
 * @param minMode - The minimum mode for students in a group.
 * @param globalMinStudents - The global minimum number of students required.
 * @param individualMinStudents - Individual minimum students required per subject.
 * @returns - True if a conflict was resolved, false otherwise.
 */
export const tryResolveConflict = (
    studentToAssign: Student,
    targetTeam: Team,
    conflictingSubject: string,
    conflictingGroupInTeam: string,
    teams: Team[],
    teamSubjectGroupCommitment: Map<number, Map<string, string>>,
    selectedSubjects: string[],
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>
): boolean => {
    // Find students in the targetTeam that belong to the conflictingGroupInTeam for the conflictingSubject.
    const conflictingStudentsInTarget = targetTeam.students.filter(s =>
        s.Materias.some(sg => sg.subject === conflictingSubject && sg.group === conflictingGroupInTeam)
    );

    // If there are no students in that group for the specified subject, then we can not resolve the conflict.
    if (conflictingStudentsInTarget.length === 0) {
        console.warn(`Conflict resolution called for team ${targetTeam.id}, subject ${conflictingSubject}, group ${conflictingGroupInTeam}, but no students found with that group.`);
        return false;
        // This should not happen, because we previously checked for conflicts with findGroupConflict function.
    }

    // Check if removing one of these conflicting students is feasible.
    const requiredMin = getConfiguredSubjectMinimum(conflictingSubject, minMode, globalMinStudents, individualMinStudents);
    const currentCountInTargetForConflictGroup = countGroupStudents(targetTeam, conflictingSubject, conflictingGroupInTeam);

    // Try moving each conflicting student to another team.
    for (const conflictingStudent of conflictingStudentsInTarget) {
        // Shuffle teams to try different destinations first.
        const potentialDestinations = teams
            .filter(t => t.id !== targetTeam.id)
            .sort(() => Math.random() - 0.5);

        for (const alternativeTeam of potentialDestinations) {
            // Check if the alternative team is compatible with the conflicting student.
            const alternativeTeamConflict = findGroupConflict(conflictingStudent, alternativeTeam, teamSubjectGroupCommitment);

            // If the alternative team has no conflicts then move the student.
            if (!alternativeTeamConflict) {
                // Move the conflicting student.
                // console.log(`Resolving conflict: Moving ${conflictingStudent['Nombre completo']} (Subject: ${conflictingSubject}, Group: ${conflictingGroupInTeam}) from Team ${targetTeam.id} to Team ${alternativeTeam.id}`);
                removeStudent(conflictingStudent, targetTeam, teamSubjectGroupCommitment, selectedSubjects);
                assignStudent(conflictingStudent, alternativeTeam, teamSubjectGroupCommitment, selectedSubjects);
                return true; // Conflict resolved by moving a conflicting student.
            }
        }
    }
    return false; // Conflict could not be resolved by moving existing students.
};
