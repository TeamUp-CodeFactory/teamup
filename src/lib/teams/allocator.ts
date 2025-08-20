import type { Student, Team, AssignmentWarning, MinStudentMode } from '@/types';
import { assignStudent } from './manager';
import { localSearch } from './localSearch';
import { findGroupConflict, tryResolveConflict } from './conflictResolver';
import { determineOrderAllocation } from './orderAllocation';
import { finalBalancing } from './balanceTeams';
import { getConfiguredSubjectMinimum, getUpperLimitForSubjectInTeam, countStudentsWithSubject } from './utils';

export function allocateTeams(
    allStudents: Student[],
    selectedSubjects: string[],
    userRequestedNumberOfTeams: number,
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>
): { teams: Team[]; warnings: AssignmentWarning[] } {
    const assignmentWarnings: AssignmentWarning[] = [];

    const effectiveTeamCalc = determineOrderAllocation(
        allStudents, selectedSubjects, userRequestedNumberOfTeams, minMode, globalMinStudents, individualMinStudents
    );

    if (!effectiveTeamCalc || effectiveTeamCalc.effectiveNumberOfTeams <= 0) {
        assignmentWarnings.push({
            message: effectiveTeamCalc?.criticalWarning || "No es posible formar equipos con los estudiantes y materias seleccionadas para cumplir los mínimos requeridos. Considere ajustar el número de equipos, la selección de materias, los mínimos por materia, o verifique que hay suficientes estudiantes para cada materia seleccionada.",
            isCritical: true,
        });
        return { teams: [], warnings: assignmentWarnings };
    }

    const { effectiveNumberOfTeams, sortedSubjectList } = effectiveTeamCalc;

    let teams: Team[] = Array.from({ length: effectiveNumberOfTeams }, (_, i) => ({
        id: i + 1,
        students: [],
    }));
    const assignedStudentIDs = new Set<string | number>();
    const teamSubjectGroupCommitment = new Map<number, Map<string, string>>();

    // Fase 1: Asignar mínimos obligatorios por materia (más escasas primero)
    const studentsSortedByConstraint = [...allStudents].sort((a, b) => a.Materias.length - b.Materias.length);

    assignMinimumsBySubject(
        teams,
        studentsSortedByConstraint,
        sortedSubjectList,
        assignedStudentIDs,
        teamSubjectGroupCommitment,
        selectedSubjects,
        minMode,
        globalMinStudents,
        individualMinStudents
    );

    // Fase 2: Asignar estudiantes restantes
    assignRemainingStudents(
        teams,
        studentsSortedByConstraint,
        assignedStudentIDs,
        teamSubjectGroupCommitment,
        selectedSubjects,
        minMode,
        globalMinStudents,
        individualMinStudents
    );

    // Fase 3: Optimización post-asignación
    const averageTeamSize = allStudents.filter(s => assignedStudentIDs.has(s.ID)).length / effectiveNumberOfTeams;
    if (effectiveNumberOfTeams > 0) {
       localSearch(teams, teamSubjectGroupCommitment, selectedSubjects, minMode, globalMinStudents, individualMinStudents, averageTeamSize);
       finalBalancing(teams, teamSubjectGroupCommitment, selectedSubjects, minMode, globalMinStudents, individualMinStudents);
    }

    // Fase 4: Advertencias y limpieza final
    teams = teams.filter(team => team.students.length > 0);

    if (teams.length === 0 && effectiveNumberOfTeams > 0 && selectedSubjects.length > 0 && !assignmentWarnings.some(w => w.isCritical)) {
         assignmentWarnings.push({
            message: `No se pudieron formar equipos. Esto puede deberse a conflictos irresolubles de grupos o a que no hay suficientes estudiantes para las materias seleccionadas y los mínimos definidos.`,
            isCritical: true,
        });
    } else if (teams.length < effectiveNumberOfTeams && effectiveNumberOfTeams > 0 && selectedSubjects.length > 0) {
         assignmentWarnings.push({
            message: `Se crearon ${teams.length} equipos en lugar de los ${effectiveNumberOfTeams} solicitados. Esto puede deberse a la imposibilidad de cumplir los mínimos de materias en todos los equipos con los estudiantes disponibles.`,
            isCritical: false,
        });
    }

    const finalUnassignedStudents = allStudents.filter(s => !assignedStudentIDs.has(s.ID));
    if (finalUnassignedStudents.length > 0) {
        assignmentWarnings.push({
            message: `Hay ${finalUnassignedStudents.length} estudiante(s) sin asignar: ${finalUnassignedStudents.map(s => `(${s.ID}) ${s['Nombre completo']}`).join(', ')}.`,
            isCritical: true,
        });
    }

    teams.forEach(team => {
        selectedSubjects.forEach(subject => {
            const count = countStudentsWithSubject(team, subject);
            const configuredMin = getConfiguredSubjectMinimum(subject, minMode, globalMinStudents, individualMinStudents);
            const upperLimit = getUpperLimitForSubjectInTeam(subject, minMode, globalMinStudents, individualMinStudents);

            if (count === 0 && configuredMin > 0) {
                assignmentWarnings.push({
                    team: team.id,
                    subject: subject,
                    message: `Equipo ${team.id}: No tiene estudiantes para la materia '${subject}'. Mínimo requerido: ${configuredMin}.`,
                    isCritical: true,
                });
            } else if (count < configuredMin) {
                 assignmentWarnings.push({
                    team: team.id,
                    subject: subject,
                    message: `Equipo ${team.id}: Tiene ${count}/${configuredMin} estudiantes para la materia '${subject}'.`,
                    isCritical: false,
                });
            } /*else if (count > upperLimit) {
                assignmentWarnings.push({
                    team: team.id,
                    subject: subject,
                    message: `Equipo ${team.id}: Supera el límite superior (${upperLimit}) para la materia '${subject}' con ${count} estudiantes. Mínimo requerido: ${configuredMin}.`,
                    isCritical: false,
                });
            }*/

            const groupsInTeamForSubject = new Set<string>();
            team.students.forEach(s => {
                s.Materias.forEach(sg => {
                    if (sg.subject === subject) {
                        groupsInTeamForSubject.add(sg.group);
                    }
                });
            });
            if (groupsInTeamForSubject.size > 1) {
                assignmentWarnings.push({
                    team: team.id,
                    subject: subject,
                    message: `Equipo ${team.id}: Tienes conflicto con los grupos ${Array.from(groupsInTeamForSubject).join(', ')} para la materia '${subject}'.`,
                    isCritical: true,
                });
            }
        });
    });

    assignmentWarnings.sort((a, b) => {
        if (a.isCritical !== b.isCritical) return a.isCritical ? -1 : 1;
        if ((a.team ?? -1) !== (b.team ?? -1)) return (a.team ?? Infinity) - (b.team ?? Infinity);
        return (a.subject ?? "").localeCompare(b.subject ?? "");
    });

    return { teams, warnings: assignmentWarnings };
}


/**
 * Assigns students to teams to satisfy minimum requirements for each subject, prioritizing subjects with stricter constraints.
 */
function assignMinimumsBySubject(
    teams: Team[],
    studentsSortedByConstraint: Student[],
    sortedSubjectList: string[],
    assignedStudentIDs: Set<string | number>,
    teamSubjectGroupCommitment: Map<number, Map<string, string>>,
    selectedSubjects: string[],
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>
) {
    for (const subject of sortedSubjectList) {
        const configuredMin = getConfiguredSubjectMinimum(subject, minMode, globalMinStudents, individualMinStudents);
        if (configuredMin === 0) continue;

        let availableStudentsForSubject = studentsSortedByConstraint
            .filter(s => !assignedStudentIDs.has(s.ID) && s.Materias.some(sg => sg.subject === subject));

        for (const team of teams) {
            let studentsInTeamForSubject = countStudentsWithSubject(team, subject);
            let needed = configuredMin - studentsInTeamForSubject;

            for (let i = 0; i < needed && availableStudentsForSubject.length > 0; ) {
                const studentToAttemptIndex = availableStudentsForSubject.findIndex(s => !assignedStudentIDs.has(s.ID));
                if (studentToAttemptIndex === -1) break;

                const studentToAttempt = availableStudentsForSubject.splice(studentToAttemptIndex, 1)[0];

                const conflict = findGroupConflict(studentToAttempt, team, teamSubjectGroupCommitment);
                if (!conflict) {
                    assignStudent(studentToAttempt, team, teamSubjectGroupCommitment, selectedSubjects);
                    assignedStudentIDs.add(studentToAttempt.ID);
                    i++;
                } else {
                    if (tryResolveConflict(studentToAttempt, team, conflict.subject, conflict.group, teams, teamSubjectGroupCommitment, selectedSubjects, minMode, globalMinStudents, individualMinStudents)) {
                        const recheckConflict = findGroupConflict(studentToAttempt, team, teamSubjectGroupCommitment);
                        if(!recheckConflict) {
                            assignStudent(studentToAttempt, team, teamSubjectGroupCommitment, selectedSubjects);
                            assignedStudentIDs.add(studentToAttempt.ID);
                            i++;
                        } else {
                            availableStudentsForSubject.push(studentToAttempt);
                        }
                    } else {
                        availableStudentsForSubject.push(studentToAttempt);
                    }
                }
            }
        }
    }
}

/**
 * Assigns remaining students after initial minimum assignments, trying to respect upper limits and resolve conflicts.
 */
function assignRemainingStudents(
    teams: Team[],
    studentsSortedByConstraint: Student[],
    assignedStudentIDs: Set<string | number>,
    teamSubjectGroupCommitment: Map<number, Map<string, string>>,
    selectedSubjects: string[],
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>
) {
    let remainingStudents = studentsSortedByConstraint
        .filter(s => !assignedStudentIDs.has(s.ID));

    for (const student of remainingStudents) {
        if (assignedStudentIDs.has(student.ID)) continue;

        teams.sort((a,b) => a.students.length - b.students.length);

        for (const team of teams) {
            const conflict = findGroupConflict(student, team, teamSubjectGroupCommitment);
            let canAssign = !conflict;

            if (conflict) {
                 if (tryResolveConflict(student, team, conflict.subject, conflict.group, teams, teamSubjectGroupCommitment, selectedSubjects, minMode, globalMinStudents, individualMinStudents)) {
                     const recheckConflict = findGroupConflict(student, team, teamSubjectGroupCommitment);
                     canAssign = !recheckConflict;
                 } else {
                    canAssign = false;
                 }
            }

            if (canAssign) {
                let violatesUpperLimit = false;
                for (const sg_student of student.Materias) {
                    if (selectedSubjects.includes(sg_student.subject)) {
                        const currentCountInTeam = countStudentsWithSubject(team, sg_student.subject);
                        const minForSubject = getConfiguredSubjectMinimum(sg_student.subject, minMode, globalMinStudents, individualMinStudents);
                        const upperLimitForSubject = getUpperLimitForSubjectInTeam(sg_student.subject, minMode, globalMinStudents, individualMinStudents);

                        if (currentCountInTeam >= minForSubject && (currentCountInTeam + 1) > upperLimitForSubject) {
                            violatesUpperLimit = true;
                            break;
                        }
                    }
                }

                if (!violatesUpperLimit) {
                    assignStudent(student, team, teamSubjectGroupCommitment, selectedSubjects);
                    assignedStudentIDs.add(student.ID);
                    break;
                }
            }
        }
    }
}
