import type { Student, MinStudentMode } from '@/types';
import { getConfiguredSubjectMinimum, getStudentsForSubject, getCriticalSubjectWarning, getMaxTeams, getSortedSubjects } from './utils';

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

