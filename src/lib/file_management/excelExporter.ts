import * as XLSX from 'xlsx';
import type { Student, Team, AssignmentWarning, MinStudentMode, SubjectGroup, Role } from '@/types';
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
 * Counts the total number of students in a team who can fulfill a specific role.
 * @param team The team to check.
 * @param role The role to count.
 * @returns The total count of students who can fulfill that role.
 */
const countStudentsWithRole = (team: Team, role: Role): number => {
    return team.students.filter(s => 
        s.Materias.some(sg => role.subjects.includes(sg.subject))
    ).length;
};

/**
 * Gets all roles that a student can fulfill based on their enrolled subjects.
 * @param student The student to check.
 * @param roles The list of available roles.
 * @returns Array of role names the student can fulfill.
 */
const getStudentRoles = (student: Student, roles: Role[]): string[] => {
    return roles
        .filter(role => student.Materias.some(sg => role.subjects.includes(sg.subject)))
        .map(role => role.name);
};

/**
 * Gets the configured minimum students for a role based on the minimum mode.
 * @param role The role to check.
 * @param minMode The minimum student mode.
 * @param globalMin The global minimum value.
 * @param individualMins The individual minimums map.
 * @returns The configured minimum for this role.
 */
const getConfiguredRoleMinimum = (
    role: Role, 
    minMode: MinStudentMode, 
    globalMin: number, 
    individualMins: Record<string, number>
): number => {
    if (minMode === 'individual') {
        return individualMins[role.id] ?? role.minimumStudents;
    }
    return globalMin;
};

/**
 * Generates an Excel workbook (as a blob) containing team assignments and summaries.
 *
 * @param generatedTeams The list of generated teams with their assigned students.
 * @param allStudents The original list of all students (used to find unassigned ones).
 * @param selectedSubjects The list of subjects considered during assignment (empty when using roles).
 * @param warnings A list of warnings and errors generated during assignment.
 * @param originalFileName The name of the original uploaded file (optional, for naming the export).
 * @param minMode The minimum student mode used ('global' or 'individual').
 * @param globalMin The global minimum value used.
 * @param individualMins The map of individual minimums used.
 * @param selectedRoles Optional list of roles used in role-based assignment.
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
    individualMins: Record<string, number>,
    selectedRoles?: Role[]
): Blob {

    if (generatedTeams.length === 0 && allStudents.length === 0) {
        throw new Error("No hay datos de equipos o estudiantes para exportar.");
    }

    // Determine if we're using role-based or subject-based assignment
    const isRoleBased = selectedRoles && selectedRoles.length > 0;

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

                // If working with roles, also get the roles this student can fulfill
                let rolesStr = "";
                if (isRoleBased && selectedRoles) {
                    const studentRoles = getStudentRoles(student, selectedRoles);
                    rolesStr = studentRoles.join(", ");
                }

                const row = [
                    student.ID,
                    student['Nombre completo'],
                    student['Correo electrónico'],
                    allSubjectGroupsStr
                ];

                // Add role-specific or subject-specific columns
                if (isRoleBased) {
                    row.push(rolesStr || "-");
                } else {
                    row.push(relevantSubjectGroupsStr || "-");
                }

                row.push(`Equipo ${team.id}`);

                allAssignedStudentsData.push(row);
                assignedIDs.add(student.ID);
            });
        });

        // Add unassigned students if any
        const unassignedStudentsToExport = allStudents.filter(s => !assignedIDs.has(s.ID));
        unassignedStudentsToExport.forEach(student => {
            const allSubjectGroupsStr = student.Materias
                .map(sg => `${sg.subject} (${sg.group})`)
                .join(", ");

            const row = [
                student.ID,
                student['Nombre completo'],
                student['Correo electrónico'],
                allSubjectGroupsStr
            ];

            // Add role-specific or subject-specific columns for unassigned students
            if (isRoleBased && selectedRoles) {
                const studentRoles = getStudentRoles(student, selectedRoles);
                row.push(studentRoles.join(", ") || "-");
            } else {
                row.push("-");
            }

            row.push("Sin asignar");
            allAssignedStudentsData.push(row);
        });

        allAssignedStudentsData.sort((a, b) => String(a[1]).localeCompare(String(b[1])));

        // Create headers based on assignment type
        const headers = ["ID", "Nombre completo", "Correo electrónico", "Materias (Matriculadas)"];
        if (isRoleBased) {
            headers.push("Roles Asignables");
        } else {
            headers.push("Materias (Seleccionadas)");
        }
        headers.push("Equipo asignado");

        const wsAsignacionesData = [
            headers,
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

        // --- Sheet 2: Resumen por Equipo (Role-based or Subject-based) ---
        if (isRoleBased && selectedRoles) {
            // Role-based summary
            const sortedRoles = [...selectedRoles].sort((a, b) => a.name.localeCompare(b.name));

            const wsResumenData: any[] = [
                ["No. Equipo", "Total de Estudiantes", "Recuento por Rol", ...Array(sortedRoles.length - 1).fill(""), "Mínimo requerido por Rol", ...Array(sortedRoles.length - 1).fill("")],
                ["", "", ...sortedRoles.map(r => r.name), ...sortedRoles.map(r => r.name)],
            ];

            generatedTeams.sort((a, b) => a.id - b.id).forEach(team => {
                const rowData: any[] = [
                    `Equipo ${team.id}`,
                    team.students.length
                ];

                // Count students per role
                sortedRoles.forEach(role => {
                    rowData.push(countStudentsWithRole(team, role) || 0);
                });

                // Add minimum requirements per role
                sortedRoles.forEach(role => {
                    rowData.push(getConfiguredRoleMinimum(role, minMode, globalMin, individualMins));
                });

                wsResumenData.push(rowData);
            });

            const wsResumen = XLSX.utils.aoa_to_sheet(wsResumenData);

            if (sortedRoles.length > 0) {
                const merges = [];
                merges.push({ s: { r: 0, c: 2 }, e: { r: 0, c: 1 + sortedRoles.length } });
                merges.push({ s: { r: 0, c: 2 + sortedRoles.length }, e: { r: 0, c: 1 + sortedRoles.length + sortedRoles.length } });
                wsResumen['!merges'] = merges;

                const colWidths = [
                    { wch: 15 },
                    { wch: 15 },
                    ...sortedRoles.map(r => ({ wch: Math.max(15, r.name.length + 2) })),
                    ...sortedRoles.map(r => ({ wch: Math.max(15, r.name.length + 2) }))
                ];
                wsResumen['!cols'] = colWidths;
            } else {
                wsResumen['!cols'] = [{ wch: 15 }, { wch: 15 }];
            }

            XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen por Roles");
        } else {
            // Subject-based summary (original logic)
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
        }

        // --- Sheet 3: Advertencias ---
        if (warnings.length > 0) {
            // Check if any warning has role information
            const hasRoleInfo = warnings.some(w => w.role !== undefined);
            
            let headers: string[];
            if (hasRoleInfo) {
                headers = ["No. Equipo", "Materia", "Rol", "Grupo", "Tipo", "Advertencia"];
            } else {
                headers = ["No. Equipo", "Materia", "Grupo", "Tipo", "Advertencia"];
            }

            const warningsData = [
                headers,
                ...warnings.map(w => {
                    const baseData = [
                        w.team ?? "N/A",
                        w.subject ?? "N/A"
                    ];

                    if (hasRoleInfo) {
                        baseData.push(w.role ?? "N/A");
                    }

                    baseData.push(
                        w.group ?? "N/A",
                        w.isCritical ? "CRÍTICO" : "Advertencia",
                        w.message
                    );

                    return baseData;
                })
            ];

            const wsWarnings = XLSX.utils.aoa_to_sheet(warningsData);
            
            let colWidths: any[];
            if (hasRoleInfo) {
                colWidths = [
                    { wch: 10 }, // No. Equipo
                    { wch: 20 }, // Materia
                    { wch: 20 }, // Rol
                    { wch: 10 }, // Grupo
                    { wch: 10 }, // Tipo
                    { wch: 100 } // Advertencia
                ];
            } else {
                colWidths = [
                    { wch: 10 }, // No. Equipo
                    { wch: 20 }, // Materia
                    { wch: 10 }, // Grupo
                    { wch: 10 }, // Tipo
                    { wch: 100 } // Advertencia
                ];
            }
            
            wsWarnings['!cols'] = colWidths;
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

/**
 * Convenience function for exporting teams generated using role-based allocation.
 * This is a wrapper around exportTeamsToExcel that specifically handles role-based exports.
 */
export function exportRoleBasedTeamsToExcel(
    generatedTeams: Team[],
    allStudents: Student[],
    selectedRoles: Role[],
    warnings: AssignmentWarning[],
    originalFileName: string | null,
    minMode: MinStudentMode,
    globalMin: number,
    individualMins: Record<string, number>
): Blob {
    return exportTeamsToExcel(
        generatedTeams,
        allStudents,
        [], // selectedSubjects is empty for role-based allocation
        warnings,
        originalFileName,
        minMode,
        globalMin,
        individualMins,
        selectedRoles // Pass roles as the optional parameter
    );
}
