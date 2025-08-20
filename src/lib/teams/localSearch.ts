
import type { Team, MinStudentMode } from '@/types';
import { assignStudent, removeStudent } from './manager';
import { findGroupConflict } from './conflictResolver';
import { calculateMoveScore, countStudentsWithSubject, getConfiguredSubjectMinimum, getUpperLimitForSubjectInTeam } from './utils';

/**
 * Performs a local search to optimize team assignments based on group commitments and student preferences.
 * The function iteratively swaps students between teams to minimize conflicts and meet subject requirements.
 * @param teams - Array of teams to be optimized.
 * @param teamSubjectGroupCommitment - Map of team IDs to their subject commitments.
 * @param selectedSubjects - Array of selected subjects for the assignment.
 * @param minMode - Minimum student mode (e.g., strict, relaxed).
 * @param globalMinStudents - Global minimum number of students required in each team.
 * @param individualMinStudents - Object mapping subjects to their individual minimum student requirements.
 * @param averageTeamSize - Average size of the teams.
 * @param maxIterations - Maximum number of iterations for the local search (default is 50).
 * @returns A boolean indicating whether any improvements were made during the search.
 */
export const localSearch = (
    teams: Team[],
    teamSubjectGroupCommitment: Map<number, Map<string, string>>,
    selectedSubjects: string[],
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>,
    averageTeamSize: number,
    maxIterations: number = 50
): boolean => {
    let overallImproved = false;
    let iterations = 0;

    // Continue iterating until maxIterations is reached or no improvements are made in an iteration.
    while (iterations < maxIterations) {
        let swappedInIteration = false;
        iterations++;

        const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

        for (let i = 0; i < shuffledTeams.length; i++) {
            for (let j = i + 1; j < shuffledTeams.length; j++) {
                const teamA = shuffledTeams[i];
                const teamB = shuffledTeams[j];

                if (teamA.students.length === 0 || teamB.students.length === 0) continue;

                for (const studentA of [...teamA.students]) { // Iterate over a copy in case of modification
                    // Check if studentA can move to teamB without group conflict and without violating upper limits in B
                    const conflictB = findGroupConflict(studentA, teamB, teamSubjectGroupCommitment);
                    let canMoveAtoB = !conflictB;
                    if (canMoveAtoB) {
                        for (const sg of studentA.Materias) {
                            if (selectedSubjects.includes(sg.subject)) {
                                const countInB = countStudentsWithSubject(teamB, sg.subject);
                                const minInB = getConfiguredSubjectMinimum(sg.subject, minMode, globalMinStudents, individualMinStudents);
                                const upperLimitInB = getUpperLimitForSubjectInTeam(sg.subject, minMode, globalMinStudents, individualMinStudents);
                                if (countInB >= minInB && (countInB + 1) > upperLimitInB) {
                                    canMoveAtoB = false;
                                    break;
                                }
                            }
                        }
                    }


                    if (canMoveAtoB) {
                        for (const studentB of [...teamB.students]) { // Iterate over a copy
                            // Check if studentB can move to teamA without group conflict and without violating upper limits in A
                            const conflictA = findGroupConflict(studentB, teamA, teamSubjectGroupCommitment);
                            let canMoveBtoA = !conflictA;
                            if (canMoveBtoA) {
                                for (const sg of studentB.Materias) {
                                    if (selectedSubjects.includes(sg.subject)) {
                                        const countInA = countStudentsWithSubject(teamA, sg.subject);
                                        const minInA = getConfiguredSubjectMinimum(sg.subject, minMode, globalMinStudents, individualMinStudents);
                                        const upperLimitInA = getUpperLimitForSubjectInTeam(sg.subject, minMode, globalMinStudents, individualMinStudents);
                                        if (countInA >= minInA && (countInA + 1) > upperLimitInA) {
                                            canMoveBtoA = false;
                                            break;
                                        }
                                    }
                                }
                            }

                            if (canMoveBtoA) {
                                // Simulate removing studentA from teamA and studentB from teamB for score calculation
                                const tempTeamA = { ...teamA, students: teamA.students.filter(s => s.ID !== studentA.ID) };
                                const tempTeamB = { ...teamB, students: teamB.students.filter(s => s.ID !== studentB.ID) };

                                // Score for studentA moving to (original teamB students + studentA)
                                // Score for studentB moving to (original teamA students + studentB)
                                const scoreStudentAMoving = calculateMoveScore(studentA, tempTeamA, teamB, selectedSubjects, minMode, globalMinStudents, individualMinStudents, averageTeamSize);
                                const scoreStudentBMoving = calculateMoveScore(studentB, tempTeamB, teamA, selectedSubjects, minMode, globalMinStudents, individualMinStudents, averageTeamSize);

                                if ((scoreStudentAMoving + scoreStudentBMoving) < -0.1) { // Small negative threshold for improvement
                                    // Perform the actual swap
                                    removeStudent(studentA, teamA, teamSubjectGroupCommitment, selectedSubjects);
                                    removeStudent(studentB, teamB, teamSubjectGroupCommitment, selectedSubjects);
                                    assignStudent(studentA, teamB, teamSubjectGroupCommitment, selectedSubjects);
                                    assignStudent(studentB, teamA, teamSubjectGroupCommitment, selectedSubjects);

                                    overallImproved = true;
                                    swappedInIteration = true;
                                    break; // studentB loop
                                }
                            }
                        }
                    }
                    if (swappedInIteration) break; // studentA loop
                }
                if (swappedInIteration) break; // team j loop
            }
            if (swappedInIteration) break; // team i loop
        }
        if (!swappedInIteration) {
            break; // No improvement in this full iteration
        }
    }
    // console.log(`Local search completed after ${iterations} iterations. Improved: ${overallImproved}`);
    return overallImproved;
};
