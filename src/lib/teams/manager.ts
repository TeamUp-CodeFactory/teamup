import type { Student, Team } from '@/types';

/**
 * Assigns a student to a team and updates the team's subject group commitments.
 * @param student - The student being assigned.
 * @param team - The team the student is being assigned to.
 * @param teamSubjectGroupCommitment - A map tracking the subject group commitments for each team.
 * @param selectedSubjects - The subjects relevant to the allocation, used to determine if a commitment should be made.
 */
export const assignStudent = (
    student: Student,
    team: Team,
    teamSubjectGroupCommitment: Map<number, Map<string, string>>,
    selectedSubjects: string[] // Pass selectedSubjects
) => {
    // Ensure the student isn't already in the team (safety check).
    if (team.students.some(s => s.ID === student.ID)) {
        console.warn(`Attempted to assign student ${student.ID} to team ${team.id} multiple times.`);
        return;
    }
    // Add the student to the team.
    team.students.push(student);

    // Update team commitments.
    // If the team has no commitment map yet, create one.
    if (!teamSubjectGroupCommitment.has(team.id)) {
        teamSubjectGroupCommitment.set(team.id, new Map());
    }

    const teamCommitments = teamSubjectGroupCommitment.get(team.id)!;

    student.Materias.forEach(sg => {
        // Only commit if the subject is selected y no commitment exists yet.
        if (selectedSubjects.includes(sg.subject) && !teamCommitments.has(sg.subject)) {
            // Double-check no conflicting student exists before committing.
            const hasExistingConflict = team.students.some(s =>
                s.ID !== student.ID &&
                s.Materias.some(esg => esg.subject === sg.subject && esg.group !== sg.group)
            );

            if (!hasExistingConflict) {
                teamCommitments.set(sg.subject, sg.group);
            } else {
                console.warn(`Assigning ${student['Nombre completo']} to Team ${team.id} but conflict for ${sg.subject} already exists. Commitment not set for this subject.`);
            }
        }
    });
};

/**
 * Removes a student from a team and updates the team's subject group commitments accordingly.
 * @param student - The student being removed.
 * @param team - The team the student is being removed from.
 * @param teamSubjectGroupCommitment - A map tracking the subject group commitments for each team.
 * @param selectedSubjects - The subjects relevant to the allocation.
 */
export const removeStudent = (
    student: Student,
    team: Team,
    teamSubjectGroupCommitment: Map<number, Map<string, string>>,
    selectedSubjects: string[] // Pass selectedSubjects
) => {
    // Store the initial number of students in the team.
    const initialLength = team.students.length;
    // Remove the student from the team.
    team.students = team.students.filter(s => s.ID !== student.ID);

    // If the team's length did not change, it means the student wasn't in the team.
    if (team.students.length === initialLength) {
        return;
    }

    // Re-evaluate team commitments if the removed student was potentially defining one.
    // Get the commitment map for the current team.
    const teamCommitments = teamSubjectGroupCommitment.get(team.id);
    if (teamCommitments) {
        student.Materias.forEach(sg => {
            // Only check selected subjects that the student had.
            if (selectedSubjects.includes(sg.subject) && teamCommitments.get(sg.subject) === sg.group) {
                // Check if any remaining student in the team shares the same subject and group.
                const commitmentStillHeld = team.students.some(s =>
                    s.Materias.some(rsg => rsg.subject === sg.subject && rsg.group === sg.group) // Check if the subject and group match with any other student in the team.
                );

                // No one else in the team has the same subject and group. Remove this commitment.
                if (!commitmentStillHeld) {
                    teamCommitments.delete(sg.subject);

                    // Check if another group for the same subject now becomes the de facto commitment.
                    const otherGroups = new Set<string>();
                    team.students.forEach(s => {
                        s.Materias.forEach(otherSg => {
                            if (otherSg.subject === sg.subject) {
                                otherGroups.add(otherSg.group);
                            }
                        });
                    });

                    // If only one group exists, then add this group as the commitment for the team.
                    if (otherGroups.size === 1) {
                        const newCommitmentGroup = Array.from(otherGroups)[0];
                        teamCommitments.set(sg.subject, newCommitmentGroup); // Set the group as the new commitment for this subject.
                    }
                }
            }
        });

        // Clean up empty commitment map for the team
        if (teamCommitments.size === 0) {
            teamSubjectGroupCommitment.delete(team.id);
        }
    }
};
