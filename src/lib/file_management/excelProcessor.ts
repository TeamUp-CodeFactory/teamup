import * as XLSX from 'xlsx';
import type { Student, SubjectGroup } from '@/types';

/**
 * Parses an Excel file containing student data and returns a structured object.
 * @param {ArrayBuffer} fileBuffer - The ArrayBuffer of the Excel file.
 * @returns {Object} An object containing an array of students and a list of unique subjects.
 * @throws Will throw an error if the file is empty, has invalid headers, or contains invalid data.
 */
export function parseStudentExcel(fileBuffer: ArrayBuffer): { students: Student[]; uniqueSubjects: string[] } {
    try {
        const data = new Uint8Array(fileBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (!jsonData || jsonData.length < 2) {
            throw new Error("El archivo está vacío o no tiene encabezados.");
        }

        const headers = jsonData[0].map(h => String(h).trim());
        const idIndex = headers.indexOf("ID");
        const nameIndex = headers.indexOf("Nombre completo");
        const emailIndex = headers.indexOf("Correo electrónico");
        const subjectsIndex = headers.indexOf("Materias");
        const groupsIndex = headers.indexOf("Grupos");

        if (idIndex === -1 || nameIndex === -1 || emailIndex === -1 || subjectsIndex === -1 || groupsIndex === -1) {
            throw new Error("El archivo debe contener las columnas: ID, Nombre completo, Correo electrónico, Materias y Grupos.");
        }

        const studentMap = new Map<string | number, Student>();
        const uniqueSubjectsSet = new Set<string>(); // Track all unique subjects encountered.

        jsonData.slice(1).forEach((row, index) => {
            if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
                return; // Skip empty rows.
            }
            const id = row[idIndex];
            const nombre = row[nameIndex];
            const correo = row[emailIndex];
            const materiasStr = row[subjectsIndex];
            const gruposStr = row[groupsIndex];

            // Check for missing essential data including email and groups.
            if (id === null || id === undefined || String(id).trim() === '' ||
                nombre === null || nombre === undefined || String(nombre).trim() === '' ||
                correo === null || correo === undefined || String(correo).trim() === '' ||
                materiasStr === null || materiasStr === undefined || String(materiasStr).trim() === '' ||
                gruposStr === null || gruposStr === undefined || String(gruposStr).trim() === '') {
                console.warn(`Skipping row ${index + 2} due to missing essential data (ID, Nombre, Correo, Materias, Grupos).`);
                return;
            }

            const currentMateriasList = String(materiasStr)
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);

            const currentGruposList = String(gruposStr)
                .split(',')
                .map((g) => g.trim())
                .filter(Boolean);

            // Validate matching number of subjects and groups.
            if (currentMateriasList.length === 0) {
                console.warn(`Skipping row ${index + 2} (${nombre}) because 'Materias' column is empty or invalid.`);
                return;
            }
            if (currentMateriasList.length !== currentGruposList.length) {
                console.warn(`Skipping row ${index + 2} (${nombre}) because the number of items in 'Materias' (${currentMateriasList.length}) does not match 'Grupos' (${currentGruposList.length}).`);
                return;
            }

            // Basic email validation.
            if (!String(correo).includes('@')) {
                console.warn(`Skipping row ${index + 2} (${nombre}) due to invalid email format.`);
                return;
            }

            // Create SubjectGroup pairs.
            const currentSubjectGroups: SubjectGroup[] = [];
            for (let i = 0; i < currentMateriasList.length; i++) {
                const subject = currentMateriasList[i];
                const group = currentGruposList[i];
                currentSubjectGroups.push({ subject, group });
                uniqueSubjectsSet.add(subject); // Add subject to the unique set.
            }

            // Use string key for consistency.
            const studentIdKey = String(id);

            if (studentMap.has(studentIdKey)) {
                // Duplicate ID found, merge subject-group pairs.
                const existingStudent = studentMap.get(studentIdKey)!;
                // Use a Map to ensure uniqueness based on subject and group.
                const combinedSubjectGroupsMap = new Map<string, SubjectGroup>();
                existingStudent.Materias.forEach(sg => combinedSubjectGroupsMap.set(`${sg.subject}-${sg.group}`, sg));
                currentSubjectGroups.forEach(sg => combinedSubjectGroupsMap.set(`${sg.subject}-${sg.group}`, sg));

                existingStudent.Materias = Array.from(combinedSubjectGroupsMap.values());
                // Keep the name and email from the first occurrence.
                console.info(`Duplicate ID found for student ${nombre} (ID: ${id}) in row ${index + 2}. Merging subject-group pairs.`);
            } else {
                // New student ID, add to map.
                studentMap.set(studentIdKey, {
                    ID: id,
                    'Nombre completo': String(nombre),
                    'Correo electrónico': String(correo),
                    Materias: currentSubjectGroups
                });
            }
        });

        const parsedStudents = Array.from(studentMap.values());

        if (parsedStudents.length === 0) {
            throw new Error("No se encontraron estudiantes válidos en el archivo.");
        }

        // Sort students alphabetically by "Nombre completo".
        parsedStudents.sort((a, b) => a['Nombre completo'].localeCompare(b['Nombre completo']));
        const uniqueSubjectsFromFile = Array.from(uniqueSubjectsSet).sort();
        return { students: parsedStudents, uniqueSubjects: uniqueSubjectsFromFile };

    } catch (err) {
        // Re-throw the error to be caught by the calling component.
        if (err instanceof Error) {
            throw err;
        } else {
            throw new Error("Ocurrió un error desconocido al procesar el archivo.");
        }
    }
}
