import type { Team, MinStudentMode, Role } from '@/types';
import { assignStudent, removeStudent } from './manager';
import { findGroupConflict } from './conflictResolver';
import { getConfiguredSubjectMinimum, getUpperLimitForSubjectInTeam, countStudentsWithSubject, calculateRoleMoveScore } from './utils';
import { 
    canStudentFulfillRole, 
    countStudentsWithRole, 
    getConfiguredRoleMinimum,
    getUpperLimitForRoleInTeam,
    wouldCreateRoleGroupConflict
} from './roleUtils';

/**
 * Performs a final balancing pass to try and move students.
 * 1. Moves students from teams exceeding configured minimums for a subject to teams that are below that minimum.
 * 2. Moves students from teams exceeding the upper limit (min+1) for a subject to other valid teams.
 */
export function finalBalancing(
    teams: Team[],
    teamSubjectGroupCommitment: Map<number, Map<string, string>>,
    selectedSubjects: string[],
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>
) {
    let moved, passCount = 0;
    const MAX_PASSES = teams.length * selectedSubjects.length * 3;

    do {
        moved = moveStudentsToMeetMinimums(teams, teamSubjectGroupCommitment, selectedSubjects, minMode, globalMinStudents, individualMinStudents);
        passCount++;
    } while (moved && passCount < MAX_PASSES);

    let movedUpper, upperPassCount = 0;
    const MAX_UPPER_PASSES = teams.length * selectedSubjects.length;
    do {
        movedUpper = moveStudentsToRespectUpperLimits(teams, teamSubjectGroupCommitment, selectedSubjects, minMode, globalMinStudents, individualMinStudents);
        upperPassCount++;
    } while (movedUpper && upperPassCount < MAX_UPPER_PASSES);

    if (passCount >= MAX_PASSES || upperPassCount >= MAX_UPPER_PASSES) {
        console.warn(`Final balancing may have hit MAX_PASSES (P1: ${passCount}, P2: ${upperPassCount}). Further optimization might be possible.`);
    }
}

/**
 * Performs a final balancing pass for role-based allocation.
 * Similar to finalBalancing but works with roles instead of subjects.
 */
export function finalBalancingForRoles(
    teams: Team[],
    teamRoleGroupCommitment: Map<number, Map<string, string>>,
    selectedRoles: Role[],
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinRoles: Record<string, number>
) {
    let moved, passCount = 0;
    const MAX_PASSES = teams.length * selectedRoles.length * 3;

    do {
        moved = moveStudentsToMeetRoleMinimums(teams, teamRoleGroupCommitment, selectedRoles, minMode, globalMinStudents, individualMinRoles);
        passCount++;
    } while (moved && passCount < MAX_PASSES);

    let movedUpper, upperPassCount = 0;
    const MAX_UPPER_PASSES = teams.length * selectedRoles.length;
    do {
        movedUpper = moveStudentsToRespectRoleUpperLimits(teams, teamRoleGroupCommitment, selectedRoles, minMode, globalMinStudents, individualMinRoles);
        upperPassCount++;
    } while (movedUpper && upperPassCount < MAX_UPPER_PASSES);

    if (passCount >= MAX_PASSES || upperPassCount >= MAX_UPPER_PASSES) {
        console.warn(`Final role balancing may have hit MAX_PASSES (P1: ${passCount}, P2: ${upperPassCount}). Further optimization might be possible.`);
    }
}

function canMoveWithoutBreakingOtherMinimums(
    student: any,
    team: Team,
    selectedSubjects: string[],
    subject: string,
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>
): boolean {
    for (const otherSubj of selectedSubjects) {
        if (otherSubj === subject) continue;
        if (student.Materias.some((ssg: any) => ssg.subject === otherSubj)) {
            const otherSubjMin = getConfiguredSubjectMinimum(otherSubj, minMode, globalMinStudents, individualMinStudents);
            const countOtherInSourceAfterMove = team.students.filter(st => st.ID !== student.ID && st.Materias.some((ssg_1: any) => ssg_1.subject === otherSubj)).length;
            if (countOtherInSourceAfterMove < otherSubjMin) {
                return false;
            }
        }
    }
    return true;
}

function canMoveWithoutBreakingThisOrOtherMinimums(
    student: any,
    team: Team,
    selectedSubjects: string[],
    subject: string,
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>,
    countInSource: number
): boolean {
    if ((countInSource - 1) < getConfiguredSubjectMinimum(subject, minMode, globalMinStudents, individualMinStudents)) {
        return false;
    }
    return canMoveWithoutBreakingOtherMinimums(student, team, selectedSubjects, subject, minMode, globalMinStudents, individualMinStudents);
}

function canPlaceInTargetForOtherSubjects(
    student: any,
    targetTeam: Team,
    selectedSubjects: string[],
    subject: string,
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>
): boolean {
    for (const sg_student of student.Materias) {
        if (selectedSubjects.includes(sg_student.subject) && sg_student.subject !== subject) {
            const targetCountOther = countStudentsWithSubject(targetTeam, sg_student.subject);
            const minOther = getConfiguredSubjectMinimum(sg_student.subject, minMode, globalMinStudents, individualMinStudents);
            const upperLimitOther = getUpperLimitForSubjectInTeam(sg_student.subject, minMode, globalMinStudents, individualMinStudents);
            if (targetCountOther >= minOther && (targetCountOther + 1) > upperLimitOther) {
                return false;
            }
        }
    }
    return true;
}

function moveStudentsToMeetMinimums(
    teams: Team[],
    teamSubjectGroupCommitment: Map<number, Map<string, string>>,
    selectedSubjects: string[],
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>
): boolean {
    let moved = false;
    for (const subject of selectedSubjects) {
        const configuredMin = getConfiguredSubjectMinimum(subject, minMode, globalMinStudents, individualMinStudents);
        for (const sourceTeam of teams) {
            let studentsInSourceForSubject = sourceTeam.students.filter(s =>
                s.Materias.some(sg => sg.subject === subject)
            );
            let countInSource = studentsInSourceForSubject.length;

            while (countInSource > configuredMin) {
                const studentToMove = studentsInSourceForSubject
                    .sort((a, b) => a.Materias.length - b.Materias.length)
                    .find(s => canMoveWithoutBreakingOtherMinimums(s, sourceTeam, selectedSubjects, subject, minMode, globalMinStudents, individualMinStudents));
                if (!studentToMove) break;

                const potentialTargetTeams = teams
                    .filter(t => t.id !== sourceTeam.id)
                    .sort((a, b) => countStudentsWithSubject(a, subject) - countStudentsWithSubject(b, subject));

                let foundTarget = false;
                for (const targetTeam of potentialTargetTeams) {
                    const countInTarget = countStudentsWithSubject(targetTeam, subject);
                    const upperLimitTarget = getUpperLimitForSubjectInTeam(subject, minMode, globalMinStudents, individualMinStudents);

                    if (countInTarget < configuredMin || (countInTarget === configuredMin && countInTarget < upperLimitTarget)) {
                        const conflict = findGroupConflict(studentToMove, targetTeam, teamSubjectGroupCommitment);
                        if (!conflict && canPlaceInTargetForOtherSubjects(studentToMove, targetTeam, selectedSubjects, subject, minMode, globalMinStudents, individualMinStudents)) {
                            removeStudent(studentToMove, sourceTeam, teamSubjectGroupCommitment, selectedSubjects);
                            assignStudent(studentToMove, targetTeam, teamSubjectGroupCommitment, selectedSubjects);
                            moved = true;
                            foundTarget = true;
                            studentsInSourceForSubject = sourceTeam.students.filter(s => s.Materias.some(sg => sg.subject === subject));
                            countInSource = studentsInSourceForSubject.length;
                            break;
                        }
                    }
                }
                if (!foundTarget) break;
            }
        }
    }
    return moved;
}

function moveStudentsToRespectUpperLimits(
    teams: Team[],
    teamSubjectGroupCommitment: Map<number, Map<string, string>>,
    selectedSubjects: string[],
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>
): boolean {
    let moved = false;
    for (const subject of selectedSubjects) {
        const upperLimit = getUpperLimitForSubjectInTeam(subject, minMode, globalMinStudents, individualMinStudents);
        for (const sourceTeam of teams) {
            let countInSource = countStudentsWithSubject(sourceTeam, subject);

            while (countInSource > upperLimit) {
                const studentToMove = sourceTeam.students
                    .filter(s => s.Materias.some(sg => sg.subject === subject))
                    .find(s => canMoveWithoutBreakingThisOrOtherMinimums(s, sourceTeam, selectedSubjects, subject, minMode, globalMinStudents, individualMinStudents, countInSource));
                if (!studentToMove) break;

                const potentialDestinations = teams
                    .filter(t => t.id !== sourceTeam.id && countStudentsWithSubject(t, subject) < upperLimit)
                    .sort((a, b) => countStudentsWithSubject(a, subject) - countStudentsWithSubject(b, subject));

                let movedThisStudent = false;
                for (const destTeam of potentialDestinations) {
                    const conflict = findGroupConflict(studentToMove, destTeam, teamSubjectGroupCommitment);
                    if (!conflict && canPlaceInTargetForOtherSubjects(studentToMove, destTeam, selectedSubjects, subject, minMode, globalMinStudents, individualMinStudents)) {
                        removeStudent(studentToMove, sourceTeam, teamSubjectGroupCommitment, selectedSubjects);
                        assignStudent(studentToMove, destTeam, teamSubjectGroupCommitment, selectedSubjects);
                        moved = true;
                        movedThisStudent = true;
                        countInSource = countStudentsWithSubject(sourceTeam, subject);
                        break;
                    }
                }
                if (!movedThisStudent) break;
            }
        }
    }
    return moved;
}

// =====================
// Role-based balancing
// =====================

/**
 * Performs a final balancing pass for role-based assignments.
 * 1. Moves students from teams exceeding configured minimums for a role to teams that are below that minimum.
 * 2. Moves students from teams exceeding the upper limit (min+1) for a role to other valid teams.
 */
export function finalRoleBalancing(
    teams: Team[],
    teamRoleGroupCommitment: Map<number, Map<string, string>>,
    selectedRoles: Role[],
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>
) {
    let moved, passCount = 0;
    const MAX_PASSES = teams.length * selectedRoles.length * 3;

    do {
        moved = moveStudentsToMeetRoleMinimums(teams, teamRoleGroupCommitment, selectedRoles, minMode, globalMinStudents, individualMinStudents);
        passCount++;
    } while (moved && passCount < MAX_PASSES);

    let movedUpper, upperPassCount = 0;
    const MAX_UPPER_PASSES = teams.length * selectedRoles.length;
    do {
        movedUpper = moveStudentsToRespectRoleUpperLimits(teams, teamRoleGroupCommitment, selectedRoles, minMode, globalMinStudents, individualMinStudents);
        upperPassCount++;
    } while (movedUpper && upperPassCount < MAX_UPPER_PASSES);

    if (passCount >= MAX_PASSES || upperPassCount >= MAX_UPPER_PASSES) {
        console.warn(`Final role balancing may have hit MAX_PASSES (P1: ${passCount}, P2: ${upperPassCount}). Further optimization might be possible.`);
    }
}

function canMoveWithoutBreakingOtherRoleMinimums(
    student: any,
    team: Team,
    selectedRoles: Role[],
    excludeRole: Role,
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>
): boolean {
    for (const otherRole of selectedRoles) {
        if (otherRole.id === excludeRole.id) continue;
        if (canStudentFulfillRole(student, otherRole)) {
            const currentCount = countStudentsWithRole(team, otherRole);
            const configuredMin = getConfiguredRoleMinimum(otherRole, minMode, globalMinStudents, individualMinStudents);
            if (currentCount - 1 < configuredMin) {
                return false;
            }
        }
    }
    return true;
}

function moveStudentsToMeetRoleMinimums(
    teams: Team[],
    teamRoleGroupCommitment: Map<number, Map<string, string>>,
    selectedRoles: Role[],
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>
): boolean {
    let moved = false;

    for (const role of selectedRoles) {
        const configuredMin = getConfiguredRoleMinimum(role, minMode, globalMinStudents, individualMinStudents);

        const teamsNeedingMore = teams.filter(team => countStudentsWithRole(team, role) < configuredMin);
        const teamsWithSurplus = teams.filter(team => countStudentsWithRole(team, role) > configuredMin);

        for (const needyTeam of teamsNeedingMore) {
            const neededCount = configuredMin - countStudentsWithRole(needyTeam, role);

            for (const surplusTeam of teamsWithSurplus) {
                const availableStudents = surplusTeam.students.filter(student =>
                    canStudentFulfillRole(student, role) &&
                    canMoveWithoutBreakingOtherRoleMinimums(student, surplusTeam, selectedRoles, role, minMode, globalMinStudents, individualMinStudents)
                );

                let movedFromThisTeam = 0;
                for (const studentToMove of availableStudents) {
                    if (movedFromThisTeam >= neededCount) break;

                    if (!wouldCreateRoleGroupConflict(studentToMove, needyTeam, role)) {
                        removeStudentFromRole(studentToMove, surplusTeam, role, teamRoleGroupCommitment);
                        assignStudentToRole(studentToMove, needyTeam, role, teamRoleGroupCommitment);
                        moved = true;
                        movedFromThisTeam++;
                    }
                }

                if (movedFromThisTeam >= neededCount) break;
            }
        }
    }

    return moved;
}

function moveStudentsToRespectRoleUpperLimits(
    teams: Team[],
    teamRoleGroupCommitment: Map<number, Map<string, string>>,
    selectedRoles: Role[],
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>
): boolean {
    let moved = false;

    for (const role of selectedRoles) {
        const upperLimit = getUpperLimitForRoleInTeam(role, minMode, globalMinStudents, individualMinStudents);

        for (const sourceTeam of teams) {
            let countInSource = countStudentsWithRole(sourceTeam, role);

            while (countInSource > upperLimit) {
                const studentsForRole = sourceTeam.students.filter(student =>
                    canStudentFulfillRole(student, role) &&
                    canMoveWithoutBreakingOtherRoleMinimums(student, sourceTeam, selectedRoles, role, minMode, globalMinStudents, individualMinStudents)
                );

                if (studentsForRole.length === 0) break;

                const studentToMove = studentsForRole[0];
                const potentialDestinations = teams
                    .filter(team => team.id !== sourceTeam.id && countStudentsWithRole(team, role) < upperLimit)
                    .sort((a, b) => countStudentsWithRole(a, role) - countStudentsWithRole(b, role));

                let movedThisStudent = false;
                for (const destTeam of potentialDestinations) {
                    if (!wouldCreateRoleGroupConflict(studentToMove, destTeam, role)) {
                        removeStudentFromRole(studentToMove, sourceTeam, role, teamRoleGroupCommitment);
                        assignStudentToRole(studentToMove, destTeam, role, teamRoleGroupCommitment);
                        moved = true;
                        movedThisStudent = true;
                        countInSource = countStudentsWithRole(sourceTeam, role);
                        break;
                    }
                }
                if (!movedThisStudent) break;
            }
        }
    }
    return moved;
}

function removeStudentFromRole(
    student: any,
    team: Team,
    role: Role,
    teamRoleGroupCommitment: Map<number, Map<string, string>>
) {
    const index = team.students.findIndex(s => s.ID === student.ID);
    if (index !== -1) {
        team.students.splice(index, 1);
        // Update role commitment if no other students fulfill this role
        if (countStudentsWithRole(team, role) === 0) {
            const roleCommitments = teamRoleGroupCommitment.get(team.id);
            if (roleCommitments) {
                roleCommitments.delete(role.id);
            }
        }
    }
}

function assignStudentToRole(
    student: any,
    team: Team,
    role: Role,
    teamRoleGroupCommitment: Map<number, Map<string, string>>
) {
    team.students.push(student);
    
    // Get the subject-group that covers this role for the student
    const studentSubjectGroup = student.Materias.find((sg: any) => role.subjects.includes(sg.subject));
    if (studentSubjectGroup) {
        if (!teamRoleGroupCommitment.has(team.id)) {
            teamRoleGroupCommitment.set(team.id, new Map());
        }
        const roleCommitments = teamRoleGroupCommitment.get(team.id)!;
        roleCommitments.set(role.id, studentSubjectGroup.group);
    }
}
