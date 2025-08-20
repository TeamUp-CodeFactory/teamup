
import type { Student, Team, MinStudentMode, SubjectGroup } from '@/types';

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
