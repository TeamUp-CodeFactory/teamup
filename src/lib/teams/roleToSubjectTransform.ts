import type { Student, Role, MinStudentMode, Team, AssignmentWarning } from '@/types';

/**
 * Information for mapping between roles and virtual subjects
 */
export interface RoleTransformMapping {
    // Map from virtual subject name to original role
    virtualSubjectToRole: Map<string, Role>;
    // Map from virtual subject name to original subject-group combination
    virtualSubjectToOriginalSubjectGroup: Map<string, { subject: string; group: string }>;
    // Map from role id to virtual subjects that represent it
    roleToVirtualSubjects: Map<string, string[]>;
}

/**
 * Represents a student with virtual subjects derived from roles
 */
export interface VirtualStudent {
    ID: string | number;
    'Nombre completo': string;
    'Correo electrónico': string;
    Materias: Array<{ subject: string; group: string }>; // Virtual subjects
}

/**
 * Transforms roles into virtual subjects and converts students accordingly.
 * Each role becomes ONE virtual subject, and each (original subject, group) combination
 * that can fulfill a role becomes a GROUP of that virtual subject.
 * 
 * Example: Role "Analista" covered by "Matematicas A", "Matematicas B", "Fisica A", "Fisica B"
 * → Virtual subject: "Analista" with groups: "Matematicas A", "Matematicas B", "Fisica A", "Fisica B"
 */
export function transformRolesToVirtualSubjects(
    students: Student[],
    roles: Role[]
): {
    virtualStudents: VirtualStudent[];
    mapping: RoleTransformMapping;
} {
    const virtualSubjectToRole = new Map<string, Role>();
    const virtualSubjectToOriginalSubjectGroup = new Map<string, { subject: string; group: string }>();
    const roleToVirtualSubjects = new Map<string, string[]>();
    
    // Build the mapping for each role
    roles.forEach(role => {
        // Each role becomes exactly ONE virtual subject
        const virtualSubjectName = role.id; // Use role ID as virtual subject name
        
        virtualSubjectToRole.set(virtualSubjectName, role);
        roleToVirtualSubjects.set(role.id, [virtualSubjectName]);
        
        // Find all unique subject-group combinations that can fulfill this role
        const subjectGroupCombinations = new Set<string>();
        
        students.forEach(student => {
            student.Materias.forEach(subjectGroup => {
                if (role.subjects.includes(subjectGroup.subject)) {
                    const groupKey = `${subjectGroup.subject} ${subjectGroup.group}`;
                    subjectGroupCombinations.add(groupKey);
                }
            });
        });
        
        // Store the mapping from virtual subject to all possible original subject-group combinations
        // This is used for reverse mapping during result transformation
        subjectGroupCombinations.forEach(combination => {
            const [subject, group] = combination.split(' ');
            const key = `${virtualSubjectName}_${combination}`;
            virtualSubjectToOriginalSubjectGroup.set(key, { subject, group });
        });
    });
    
    // Transform students to use virtual subjects
    const virtualStudents: VirtualStudent[] = students
        .map(student => {
            const virtualMaterias: Array<{ subject: string; group: string }> = [];
            
            // For each role, check if student can fulfill it
            roles.forEach(role => {
                const virtualSubjectName = role.id;
                
                // Find which subject-group combinations this student has that can fulfill this role
                student.Materias.forEach(subjectGroup => {
                    if (role.subjects.includes(subjectGroup.subject)) {
                        // Add virtual subject with the original "subject group" as the group
                        const virtualGroup = `${subjectGroup.subject} ${subjectGroup.group}`;
                        
                        virtualMaterias.push({
                            subject: virtualSubjectName, // Role ID as virtual subject
                            group: virtualGroup // "Matematicas A", "Fisica B", etc.
                        });
                    }
                });
            });
            
            return {
                ID: student.ID,
                'Nombre completo': student['Nombre completo'],
                'Correo electrónico': student['Correo electrónico'],
                Materias: virtualMaterias
            };
        })
        .filter(virtualStudent => virtualStudent.Materias.length > 0); // Filter out students who cannot fulfill any role
    
    const mapping: RoleTransformMapping = {
        virtualSubjectToRole,
        virtualSubjectToOriginalSubjectGroup,
        roleToVirtualSubjects
    };
    
    return { virtualStudents, mapping };
}

/**
 * Converts role minimums to virtual subject minimums
 */
export function transformRoleMinimums(
    minMode: MinStudentMode,
    globalMinStudents: number,
    individualMinRoles: Record<string, number>,
    mapping: RoleTransformMapping
): {
    virtualMinMode: MinStudentMode;
    virtualGlobalMin: number;
    virtualIndividualMin: Record<string, number>;
} {
    const virtualIndividualMin: Record<string, number> = {};
    
    // For each role, set the minimum for its virtual subject (which is the role ID)
    mapping.roleToVirtualSubjects.forEach((virtualSubjects, roleId) => {
        let roleMin: number;
        
        if (minMode === 'individual' && individualMinRoles[roleId] !== undefined) {
            roleMin = individualMinRoles[roleId];
        } else {
            roleMin = globalMinStudents;
        }
        
        // Each role has exactly one virtual subject now (the role ID)
        virtualSubjects.forEach(virtualSubject => {
            virtualIndividualMin[virtualSubject] = roleMin;
        });
    });
    
    return {
        virtualMinMode: 'individual', // Always use individual mode for virtual subjects
        virtualGlobalMin: globalMinStudents,
        virtualIndividualMin
    };
}

/**
 * Transforms the result back from virtual subjects to roles
 */
export function transformResultBackToRoles(
    teams: Team[],
    warnings: AssignmentWarning[],
    mapping: RoleTransformMapping,
    originalStudents: Student[]
): {
    teams: Team[];
    warnings: AssignmentWarning[];
} {
    // Create a map from student ID to original student data
    const studentMap = new Map<string | number, Student>();
    originalStudents.forEach(student => {
        studentMap.set(student.ID, student);
    });
    
    // Transform teams back to use original student data
    const transformedTeams: Team[] = teams.map(team => ({
        ...team,
        students: team.students.map(virtualStudent => {
            const originalStudent = studentMap.get(virtualStudent.ID);
            if (!originalStudent) {
                throw new Error(`Original student not found for ID: ${virtualStudent.ID}`);
            }
            return originalStudent;
        })
    }));
    
    // Transform warnings back to use role information
    const transformedWarnings: AssignmentWarning[] = warnings.map(warning => {
        if (warning.subject) {
            // Since virtual subjects are now role IDs, find the role directly
            const role = mapping.virtualSubjectToRole.get(warning.subject);
            if (role) {
                // Replace subject name with role name in the message
                const updatedMessage = warning.message.replace(warning.subject, `'${role.name}'`);
                
                return {
                    ...warning,
                    role: role.id,
                    message: updatedMessage,
                    subject: undefined // Remove virtual subject reference
                };
            }
        }
        return warning;
    });
    
    return {
        teams: transformedTeams,
        warnings: transformedWarnings
    };
}

/**
 * Gets the list of virtual subjects from the mapping
 */
export function getVirtualSubjectsFromMapping(mapping: RoleTransformMapping): string[] {
    return Array.from(mapping.virtualSubjectToRole.keys());
}