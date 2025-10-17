import type { Student, MinStudentMode, Role } from '@/types';
import { getConfiguredSubjectMinimum, getStudentsForSubject, getCriticalSubjectWarning, getMaxTeams, getSortedSubjects } from './utils';
import { getConfiguredRoleMinimum } from './roleUtils';

/**
 * Calculates the effective number of teams that can be formed and the order of subjects for assignment.
 */
export const determineOrderAllocation = (
    allStudents: Student[],
    selectedSubjects: string[],
    userRequestedNumberOfTeams: number,
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinStudents: Record<string, number>
): { effectiveNumberOfTeams: number; sortedSubjectList: string[]; criticalWarning?: string } | null => {
    if (selectedSubjects.length === 0) return { effectiveNumberOfTeams: 0, sortedSubjectList: [] };

    let maxSystemPossibleTeams = userRequestedNumberOfTeams;
    let bottleneckSubject = "";

    for (const subject of selectedSubjects) {
        const studentsInSubject = getStudentsForSubject(subject, allStudents).length;
        const configuredMin = getConfiguredSubjectMinimum(subject, minMode, globalMinStudents, individualMinStudents);

        const warning = getCriticalSubjectWarning(subject, studentsInSubject, configuredMin);
        if (warning) {
            return {
                effectiveNumberOfTeams: 0,
                sortedSubjectList: selectedSubjects,
                criticalWarning: warning
            };
        }

        const maxTeamsForThisSubject = getMaxTeams(studentsInSubject, configuredMin, userRequestedNumberOfTeams);

        if (maxTeamsForThisSubject < maxSystemPossibleTeams) {
            maxSystemPossibleTeams = maxTeamsForThisSubject;
            bottleneckSubject = subject;
        }
    }

    if (maxSystemPossibleTeams < 1 && selectedSubjects.length > 0) {
         return {
            effectiveNumberOfTeams: 0,
            sortedSubjectList: selectedSubjects,
            criticalWarning: `Con los estudiantes disponibles, el número máximo de equipos que pueden cumplir los mínimos es ${maxSystemPossibleTeams} (limitado por la materia '${bottleneckSubject}'). No es posible formar equipos bajo la configuración actual.`
        };
    }
    if (maxSystemPossibleTeams === Infinity) maxSystemPossibleTeams = userRequestedNumberOfTeams;

    const effectiveNumberOfTeams = Math.max(0, Math.min(userRequestedNumberOfTeams, maxSystemPossibleTeams));

    if (effectiveNumberOfTeams <= 0 && selectedSubjects.length > 0) {
        return {
            effectiveNumberOfTeams: 0,
            sortedSubjectList: selectedSubjects,
            criticalWarning: `No es posible formar ningún equipo que cumpla todos los mínimos de materias seleccionadas con los estudiantes disponibles. La materia '${bottleneckSubject}' limita la formación a ${maxSystemPossibleTeams} equipos.`
        };
    }

    const sortedSubjectList = getSortedSubjects(selectedSubjects, allStudents);

    return { effectiveNumberOfTeams, sortedSubjectList };
};

// ===== ROLE-BASED EQUIVALENTS =====

/**
 * Determines the effective number of teams that can be formed based on role requirements
 * and student availability, similar to determineOrderAllocation but for roles.
 */
export const determineOrderAllocationForRoles = (
    allStudents: any[],
    selectedRoles: Role[],
    userRequestedNumberOfTeams: number,
    minMode: any,
    globalMinStudents: number,
    individualMinRoles: Record<string, number>
): { 
    effectiveNumberOfTeams: number; 
    sortedRoleList: Role[]; 
    criticalWarning?: string;
    warnings?: string[];
} => {
    if (!selectedRoles || selectedRoles.length === 0) {
        return { effectiveNumberOfTeams: userRequestedNumberOfTeams, sortedRoleList: [] };
    }

    // Calculate maximum possible teams based on role constraints
    let maxSystemPossibleTeams = Infinity;
    let bottleneckRole: Role | null = null;

    for (const role of selectedRoles) {
        const studentsForRole = getStudentsForRole(role.id, allStudents, selectedRoles);
        const configuredMin = getConfiguredRoleMinimumForOrder(role.id, minMode, globalMinStudents, individualMinRoles);
        
        if (configuredMin > 0) {
            const possibleTeamsForThisRole = Math.floor(studentsForRole.length / configuredMin);
            if (possibleTeamsForThisRole < maxSystemPossibleTeams) {
                maxSystemPossibleTeams = possibleTeamsForThisRole;
                bottleneckRole = role;
            }
        }
    }

    const effectiveNumberOfTeams = Math.max(0, Math.min(userRequestedNumberOfTeams, maxSystemPossibleTeams));

    if (effectiveNumberOfTeams <= 0 && selectedRoles.length > 0) {
        return {
            effectiveNumberOfTeams: 0,
            sortedRoleList: selectedRoles,
            criticalWarning: `No es posible formar ningún equipo que cumpla todos los mínimos de roles seleccionados con los estudiantes disponibles. El rol '${bottleneckRole?.name}' limita la formación a ${maxSystemPossibleTeams} equipos.`
        };
    }

    const sortedRoleList = getSortedRoles(selectedRoles, allStudents);

    return { effectiveNumberOfTeams, sortedRoleList };
};

/**
 * Gets students that can fulfill a specific role
 */
export const getStudentsForRole = (roleId: string, allStudents: any[], allRoles: Role[]): any[] => {
    const role = allRoles.find(r => r.id === roleId);
    if (!role) return [];
    
    return allStudents.filter(student => 
        student.Materias && student.Materias.some((subjectGroup: any) => 
            role.subjects.includes(subjectGroup.subject)
        )
    );
};

/**
 * Gets the configured minimum for a role for order allocation purposes
 */
export const getConfiguredRoleMinimumForOrder = (
    roleId: string,
    minMode: any,
    globalMinStudents: number,
    individualMinRoles: Record<string, number>
): number => {
    if (minMode === 'individual' && individualMinRoles[roleId] !== undefined) {
        return individualMinRoles[roleId];
    }
    return globalMinStudents;
};

/**
 * Sorts roles by student availability (ascending) to prioritize constrained roles
 */
export const getSortedRoles = (selectedRoles: Role[], allStudents: any[]): Role[] => {
    return [...selectedRoles].sort((a, b) => {
        const studentsA = getStudentsForRole(a.id, allStudents, selectedRoles).length;
        const studentsB = getStudentsForRole(b.id, allStudents, selectedRoles).length;
        return studentsA - studentsB;
    });
};

