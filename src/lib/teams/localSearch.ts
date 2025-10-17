
import type { Team, MinStudentMode, Role } from '@/types';
import { assignStudent, removeStudent } from './manager';
import { findGroupConflict } from './conflictResolver';
import { calculateMoveScore, countStudentsWithSubject, getConfiguredSubjectMinimum, getUpperLimitForSubjectInTeam, calculateRoleMoveScore } from './utils';
import { 
    canStudentFulfillRole, 
    countStudentsWithRole, 
    getConfiguredRoleMinimum,
    getUpperLimitForRoleInTeam,
    wouldCreateRoleGroupConflict
} from './roleUtils';

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

/**
 * Performs a role-based local search to optimize team assignments.
 * The function iteratively swaps students between teams to minimize conflicts and meet role requirements.
 */
export const roleBasedLocalSearch = (
    teams: Team[],
    teamRoleGroupCommitment: Map<number, Map<string, string>>,
    selectedRoles: Role[],
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
                    // Check if studentA can move to teamB without role group conflicts
                    let canMoveAtoB = true;
                    for (const role of selectedRoles) {
                        if (canStudentFulfillRole(studentA, role) && wouldCreateRoleGroupConflict(studentA, teamB, role)) {
                            canMoveAtoB = false;
                            break;
                        }
                    }

                    // Check upper limits for roles in teamB
                    if (canMoveAtoB) {
                        for (const role of selectedRoles) {
                            if (canStudentFulfillRole(studentA, role)) {
                                const currentCount = countStudentsWithRole(teamB, role);
                                const upperLimit = getUpperLimitForRoleInTeam(role, minMode, globalMinStudents, individualMinStudents);
                                if (currentCount >= upperLimit) {
                                    canMoveAtoB = false;
                                    break;
                                }
                            }
                        }
                    }

                    if (canMoveAtoB) {
                        for (const studentB of [...teamB.students]) {
                            // Check if studentB can move to teamA without role group conflicts
                            let canMoveBtoA = true;
                            for (const role of selectedRoles) {
                                if (canStudentFulfillRole(studentB, role) && wouldCreateRoleGroupConflict(studentB, teamA, role)) {
                                    canMoveBtoA = false;
                                    break;
                                }
                            }

                            // Check upper limits for roles in teamA
                            if (canMoveBtoA) {
                                for (const role of selectedRoles) {
                                    if (canStudentFulfillRole(studentB, role)) {
                                        const currentCount = countStudentsWithRole(teamA, role);
                                        const upperLimit = getUpperLimitForRoleInTeam(role, minMode, globalMinStudents, individualMinStudents);
                                        if (currentCount >= upperLimit) {
                                            canMoveBtoA = false;
                                            break;
                                        }
                                    }
                                }
                            }

                            if (canMoveBtoA) {
                                // Create temporary teams to calculate scores
                                const tempTeamA = { ...teamA, students: teamA.students.filter(s => s.ID !== studentA.ID) };
                                const tempTeamB = { ...teamB, students: teamB.students.filter(s => s.ID !== studentB.ID) };

                                const scoreStudentAMoving = calculateRoleMoveScore(studentA, teamA, tempTeamB, selectedRoles, minMode, globalMinStudents, individualMinStudents, averageTeamSize);
                                const scoreStudentBMoving = calculateRoleMoveScore(studentB, teamB, tempTeamA, selectedRoles, minMode, globalMinStudents, individualMinStudents, averageTeamSize);

                                if ((scoreStudentAMoving + scoreStudentBMoving) < -0.1) { // Small negative threshold for improvement
                                    // Perform the actual swap
                                    removeStudentFromRoleTeam(studentA, teamA, selectedRoles, teamRoleGroupCommitment);
                                    removeStudentFromRoleTeam(studentB, teamB, selectedRoles, teamRoleGroupCommitment);
                                    assignStudentToRoleTeam(studentA, teamB, selectedRoles, teamRoleGroupCommitment);
                                    assignStudentToRoleTeam(studentB, teamA, selectedRoles, teamRoleGroupCommitment);

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
    return overallImproved;
};

function removeStudentFromRoleTeam(
    student: any,
    team: Team,
    selectedRoles: Role[],
    teamRoleGroupCommitment: Map<number, Map<string, string>>
) {
    const index = team.students.findIndex(s => s.ID === student.ID);
    if (index !== -1) {
        team.students.splice(index, 1);
        
        // Update role commitments if no other students fulfill any of the roles
        const roleCommitments = teamRoleGroupCommitment.get(team.id);
        if (roleCommitments) {
            for (const role of selectedRoles) {
                if (canStudentFulfillRole(student, role) && countStudentsWithRole(team, role) === 0) {
                    roleCommitments.delete(role.id);
                }
            }
        }
    }
}

function assignStudentToRoleTeam(
    student: any,
    team: Team,
    selectedRoles: Role[],
    teamRoleGroupCommitment: Map<number, Map<string, string>>
) {
    team.students.push(student);
    
    // Update role commitments for each role the student can fulfill
    for (const role of selectedRoles) {
        if (canStudentFulfillRole(student, role)) {
            const studentSubjectGroup = student.Materias.find((sg: any) => role.subjects.includes(sg.subject));
            if (studentSubjectGroup) {
                if (!teamRoleGroupCommitment.has(team.id)) {
                    teamRoleGroupCommitment.set(team.id, new Map());
                }
                const roleCommitments = teamRoleGroupCommitment.get(team.id)!;
                roleCommitments.set(role.id, studentSubjectGroup.group);
            }
        }
    }
}
