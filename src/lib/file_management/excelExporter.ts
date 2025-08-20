import * as XLSX from 'xlsx';
import type { Student, Team, AssignmentWarning, MinStudentMode, SubjectGroup } from '@/types';
import { getConfiguredSubjectMinimum } from '../teams/utils'; // Import helpers

/**
 * Counts the total number of students in a team who have a specific subject, regardless of the group.
 * @param team The team to check.
 * @param subject The subject to count.
 * @returns The total count of students with that subject.
 */
const countStudentsWithSubject = (team: Team, subject: string): number => {
    // Count students in the team who have the specified subject in their Materias list
    return team.students.filter(s => s.Materias.some(sg => sg.subject === subject)).length;
};

/**
 * Generates an Excel workbook (as a blob) containing team assignments and summaries.
 *
 * @param generatedTeams The list of generated teams with their assigned students.
 * @param allStudents The original list of all students (used to find unassigned ones).
 * @param selectedSubjects The list of subjects considered during assignment.
 * @param warnings A list of warnings and errors generated during assignment.
 * @param originalFileName The name of the original uploaded file (optional, for naming the export).
 * @param minMode The minimum student mode used ('global' or 'individual').
 * @param globalMin The global minimum value used.
 * @param individualMins The map of individual minimums used.
 * @returns A Blob representing the generated Excel file.
 * @throws Error if there are no teams to export or an error occurs during generation.
 */
export function exportTeamsToExcel(
    generatedTeams: Team[],
    allStudents: Student[],
    selectedSubjects: string[],
    warnings: AssignmentWarning[],
    originalFileName: string | null,
    minMode: MinStudentMode,
    globalMin: number,
    individualMins: Record<string, number>
): Blob {

    if (generatedTeams.length === 0 && allStudents.length === 0) {
        throw new Error("No hay datos de equipos o estudiantes para exportar.");
    }

    try {
        const wb = XLSX.utils.book_new();

        // --- Sheet 1: Asignaciones ---
        const allAssignedStudentsData: any[] = [];
        const assignedIDs = new Set<string | number>();

        generatedTeams.forEach(team => {
            team.students.forEach(student => {
                const allSubjectGroupsStr = student.Materias
                    .map(sg => `${sg.subject} (${sg.group})`)
                    .join(", ");
                const relevantSubjectGroupsStr = student.Materias
                    .filter(sg => selectedSubjects.includes(sg.subject))
                    .map(sg => `${sg.subject} (${sg.group})`)
                    .join(", ");

                allAssignedStudentsData.push([
                    student.ID,
                    student['Nombre completo'],
                    student['Correo electrónico'],
                    allSubjectGroupsStr,
                    relevantSubjectGroupsStr || "-",
                    `Equipo ${team.id}`
                ]);
                assignedIDs.add(student.ID);
            });
        });

        // Add unassigned students if any
        const unassignedStudentsToExport = allStudents.filter(s => !assignedIDs.has(s.ID));
        unassignedStudentsToExport.forEach(student => {
            const allSubjectGroupsStr = student.Materias
                .map(sg => `${sg.subject} (${sg.group})`)
                .join(", ");
            allAssignedStudentsData.push([
                student.ID,
                student['Nombre completo'],
                student['Correo electrónico'],
                allSubjectGroupsStr,
                "-",
                "Sin asignar"
            ]);
        });

        allAssignedStudentsData.sort((a, b) => String(a[1]).localeCompare(String(b[1])));

        const wsAsignacionesData = [
            ["ID", "Nombre completo", "Correo electrónico", "Materias (Matriculadas)", "Materias (Seleccionadas)", "Equipo asignado"],
            ...allAssignedStudentsData
        ];
        const wsAsignaciones = XLSX.utils.aoa_to_sheet(wsAsignacionesData);
        wsAsignaciones['!cols'] = [
            { wch: 10 }, // ID
            { wch: 30 }, // Nombre completo
            { wch: 30 }, // Correo electrónico
            { wch: 50 }, // Materias (Matriculadas)
            { wch: 50 }, // Materias (Seleccionadas)
            { wch: 15 }  // Equipo Asignado
        ];
        XLSX.utils.book_append_sheet(wb, wsAsignaciones, "Asignaciones");

        // --- Sheet 2: Resumen por Equipo ---
        const sortedSubjects = [...selectedSubjects].sort();

        const wsResumenData: any[] = [
            ["No. Equipo", "Total de Estudiantes", "Recuento por Materia", ...Array(sortedSubjects.length - 1).fill(""), "Mínimo requerido por Materia", ...Array(sortedSubjects.length - 1).fill("")],
            ["", "", ...sortedSubjects, ...sortedSubjects],
        ];

        generatedTeams.sort((a, b) => a.id - b.id).forEach(team => {
            const rowData: any[] = [
                `Equipo ${team.id}`,
                team.students.length
            ];

            sortedSubjects.forEach(subject => {
                rowData.push(countStudentsWithSubject(team, subject) || 0);
            });

            sortedSubjects.forEach(subj => {
                rowData.push(getConfiguredSubjectMinimum(subj, minMode, globalMin, individualMins));
            });

            wsResumenData.push(rowData);
        });
        const wsResumen = XLSX.utils.aoa_to_sheet(wsResumenData);

        if (sortedSubjects.length > 0) {
            const merges = [];
            if (sortedSubjects.length > 0) {
                merges.push({ s: { r: 0, c: 2 }, e: { r: 0, c: 1 + sortedSubjects.length } });
                merges.push({ s: { r: 0, c: 2 + sortedSubjects.length }, e: { r: 0, c: 1 + sortedSubjects.length + sortedSubjects.length } });
            }
            wsResumen['!merges'] = merges;

            const colWidths = [
                { wch: 15 },
                { wch: 15 },
                ...sortedSubjects.map(h => ({ wch: Math.max(15, h.length + 2) })),
                ...sortedSubjects.map(h => ({ wch: Math.max(15, h.length + 2) }))
            ];
            wsResumen['!cols'] = colWidths;
        } else {
            wsResumen['!cols'] = [{ wch: 15 }, { wch: 15 }];
        }

        XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen por Equipo");

        // --- Sheet 3: Advertencias ---
        if (warnings.length > 0) {
            const warningsData = [
                ["No. Equipo", "Materia", "Grupo", "Tipo", "Advertencia"],
                ...warnings.map(w => [
                    w.team ?? "N/A",
                    w.subject ?? "N/A",
                    w.group ?? "N/A",
                    w.isCritical ? "CRÍTICO" : "Advertencia",
                    w.message
                ])
            ];
            const wsWarnings = XLSX.utils.aoa_to_sheet(warningsData);
            wsWarnings['!cols'] = [
                { wch: 10 },
                { wch: 20 },
                { wch: 10 },
                { wch: 10 },
                { wch: 100 }
            ];
            XLSX.utils.book_append_sheet(wb, wsWarnings, "Advertencias");
        }

        // --- Generate Blob ---
        const baseFileName = originalFileName ? originalFileName.replace(/\.xlsx?$/, '') : 'equipos';
        const outputFileName = `${baseFileName}_asignados.xlsx`;

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    } catch (err) {
        console.error("Error generating Excel export:", err);
        if (err instanceof Error) {
            throw new Error(`Error al generar el archivo Excel: ${err.message}`);
        } else {
            throw new Error("Ocurrió un error desconocido al generar el archivo Excel.");
        }
    }
}
