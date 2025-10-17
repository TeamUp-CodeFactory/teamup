"use client";

import { useState, useCallback, useMemo } from 'react';
import type { Student, Team, AssignmentWarning, MinStudentMode } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { parseStudentExcel } from '@/lib/file_management/excelProcessor';
import { exportTeamsToExcel } from '@/lib/file_management/excelExporter';
import { allocateTeams } from '@/lib/teams/allocator';
import { getConfiguredSubjectMinimum } from '@/lib/teams/utils';

/**
 * Hook personalizado (`useTeamBuilder`)
 *
 * Este hook encapsula TODA la lógica y el estado para la herramienta de creación de equipos.
 * No renderiza ninguna UI, solo gestiona los datos y expone las funciones para manipularlos.
 * Así, tu componente principal (`page.tsx`) se mantiene limpio y solo se encarga de mostrar la UI.
 */
export const useTeamBuilder = () => {
  // =================================================================
  // 1. GESTIÓN DE ESTADO (STATE MANAGEMENT)
  // Aquí usamos `useState` para crear todas las variables que la aplicación
  // necesita recordar, como la lista de estudiantes, los equipos generados, etc.
  // =================================================================
  const [students, setStudents] = useState<Student[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [allSubjectsFromFile, setAllSubjectsFromFile] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [minStudentsPerSubject, setMinStudentsPerSubject] = useState<number>(1);
  const [numberOfTeams, setNumberOfTeams] = useState<number>(1);
  const [generatedTeams, setGeneratedTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<AssignmentWarning[]>([]);
  const [minMode, setMinMode] = useState<MinStudentMode>('global');
  const [individualMinStudents, setIndividualMinStudents] = useState<Record<string, number>>({});
  
  // Hook de un tercero para mostrar notificaciones (toasts)
  const { toast } = useToast();

  // =================================================================
  // 2. VALORES MEMOIZADOS (MEMOIZED VALUES)
  // `useMemo` recalcula un valor solo cuando una de sus dependencias cambia.
  // Es útil para optimizar cálculos que no necesitan correr en cada render.
  // =================================================================
  
  // Crea un Set con los IDs de estudiantes que ya están en un equipo.
  // Solo se recalcula si `generatedTeams` cambia.
  const assignedStudentIDsInTeams = useMemo(() => {
    return new Set(generatedTeams.flatMap(g => g.students.map(s => s.ID)));
  }, [generatedTeams]);

  // Crea una lista de estudiantes no asignados.
  // Solo se recalcula si `students` o `assignedStudentIDsInTeams` cambian.
  const unassignedStudents = useMemo(() => {
    return students.filter(s => !assignedStudentIDsInTeams.has(s.ID));
  }, [students, assignedStudentIDsInTeams]);
  
  // Banderas simples para facilitar el renderizado condicional en la UI.
  const hasStudents = students.length > 0;
  const hasTeams = generatedTeams.length > 0;


  // =================================================================
  // 3. MANEJADORES DE EVENTOS (EVENT HANDLERS)
  // `useCallback` "memoriza" la función para que no se recree en cada
  // renderizado. Esto optimiza el rendimiento.
  // =================================================================

  // Obtiene el mínimo de estudiantes para una materia según el modo ('global' o 'individual').
  const getDisplayMinimumForSubject = useCallback((subject: string): number => {
    return getConfiguredSubjectMinimum(subject, minMode, minStudentsPerSubject, individualMinStudents);
  }, [minMode, minStudentsPerSubject, individualMinStudents]);

  

  // Maneja la subida y el procesamiento del archivo Excel.
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Limpiar estados previos
    setFileName(file.name);
    setError(null);
    setWarnings([]);
    setStudents([]);
    setGeneratedTeams([]);
    setSelectedSubjects([]);
    setAllSubjectsFromFile([]);
    setIndividualMinStudents({});

    try {
      const buffer = await file.arrayBuffer();
      const { students: parsedStudents, uniqueSubjects } = parseStudentExcel(buffer);
      setStudents(parsedStudents);
      setAllSubjectsFromFile(uniqueSubjects);
      setSelectedSubjects(uniqueSubjects);
      const initialIndividualMins: Record<string, number> = {};
      uniqueSubjects.forEach(subj => {
        initialIndividualMins[subj] = 1;
      });
      setIndividualMinStudents(initialIndividualMins);
      toast({ title: "Éxito", description: "Archivo cargado y procesado correctamente." });
    } catch (err) {
      console.error("Error processing Excel file:", err);
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido.";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      setFileName(null);
    } finally {
      if (event.target) {
        event.target.value = ''; // Limpiar el input de archivo
      }
    }
  }, [toast]);

  // Lógica principal para generar los equipos.
  const handleAssignTeams = useCallback(() => {
    setError(null);
    setWarnings([]);
    setGeneratedTeams([]);

    // Validaciones previas
    /*
    if (students.length === 0 || selectedSubjects.length === 0 || numberOfTeams <= 0) {
      toast({ title: "Error", description: "Verifica la configuración: debes cargar estudiantes, seleccionar materias y definir un número de equipos mayor a 0.", variant: "destructive" });
      return;
    }*/

    if (students.length === 0) {
      setError("No hay estudiantes para asignar. Cargue un archivo de Excel.");
      toast({ title: "Error", description: "No hay estudiantes cargados.", variant: "destructive" });
      return;
    }

    if (selectedSubjects.length === 0) {
      setError("No hay materias seleccionadas para distribuir los estudiantes.");
      toast({ title: "Error", description: "Seleccione al menos una materia.", variant: "destructive" });
      return;
    }

    if (numberOfTeams <= 0) {
      setError("El número de equipos debe ser mayor que cero.");
      toast({ title: "Error", description: "El número de equipos debe ser positivo.", variant: "destructive" });
      return;
    }

    if (minMode === 'global' && minStudentsPerSubject <= 0) {
      setError("El número mínimo de estudiantes por materia debe ser mayor que cero.");
      toast({ title: "Error", description: "El mínimo global debe ser positivo.", variant: "destructive" });
      return;
    }

    if (minMode === 'individual' && selectedSubjects.some(subj => (individualMinStudents[subj] ?? 1) <= 0)) {
      setError("El número mínimo de estudiantes por materia debe ser mayor que cero.");
      toast({ title: "Error", description: "Los mínimos por materia deben ser positivos.", variant: "destructive" });
      return;
    }


    try {
      const { teams, warnings: assignmentWarnings } = allocateTeams(
        students,
        selectedSubjects,
        numberOfTeams,
        minMode,
        minStudentsPerSubject,
        individualMinStudents
      );
      setGeneratedTeams(teams);
      setWarnings(assignmentWarnings);
      
      if (assignmentWarnings.some(w => w.isCritical)) {
        toast({ title: "Equipos generados con errores", description: "Se detectaron problemas críticos. Revisa las advertencias.", variant: "destructive" });
      } else if (assignmentWarnings.length > 0) {
        toast({ title: "Equipos generados con advertencias", description: "Algunos requisitos pueden no haberse cumplido.", variant: "warning" });
      } else {
        toast({ title: "Éxito", description: "Equipos asignados correctamente." });
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : "Ocurrió un error desconocido al asignar equipos.";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }, [students, selectedSubjects, numberOfTeams, minMode, minStudentsPerSubject, individualMinStudents, toast]);

  // Cambia el número de equipos y resetea los resultados.
  const handleNumberOfTeamsChange = useCallback((value: number) => {
    setNumberOfTeams(Math.max(1, value || 1));
    setGeneratedTeams([]);
    setWarnings([]);
    setError(null);
  }, []);

  // Activa o desactiva la selección de una materia.
  const handleSubjectToggle = useCallback((subject: string) => {
    const isCurrentlySelected = selectedSubjects.includes(subject);
    setSelectedSubjects(prev =>
      isCurrentlySelected ? prev.filter(s => s !== subject) : [...prev, subject]
    );
    
    // Si se añade una nueva materia, inicializa su valor mínimo individual
    if (!isCurrentlySelected) {
      setIndividualMinStudents(prevMins => {
        if (!prevMins[subject]) {
          return { ...prevMins, [subject]: 1 };
        }
        return prevMins;
      });
    }
    
    setGeneratedTeams([]);
    setWarnings([]);
    setError(null);
  }, [selectedSubjects]);

  // Cambia el mínimo individual para una materia.
  const handleIndividualMinChange = useCallback((subject: string, value: number) => {
    setIndividualMinStudents(prev => ({
      ...prev,
      [subject]: Math.max(1, value || 1)
    }));
    setGeneratedTeams([]);
    setWarnings([]);
    setError(null);
  }, []);

  // Cambia el mínimo global de estudiantes.
  const handleGlobalMinChange = useCallback((value: number) => {
    setMinStudentsPerSubject(Math.max(1, value || 1));
    setGeneratedTeams([]);
    setWarnings([]);
    setError(null);
  }, []);

  // Limpia todos los datos y el estado de la aplicación.
  const handleClearData = useCallback(() => {
    setStudents([]);
    setFileName(null);
    setSelectedSubjects([]);
    setAllSubjectsFromFile([]);
    setMinStudentsPerSubject(1);
    setNumberOfTeams(1);
    setGeneratedTeams([]);
    setError(null);
    setWarnings([]);
    setMinMode('global');
    setIndividualMinStudents({});
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    toast({ title: "Datos eliminados", description: "Se ha limpiado la configuración y los datos." });
  }, [toast]);

  // Exporta los equipos a un archivo Excel.
  const handleExport = useCallback(async () => {
    if (generatedTeams.length === 0 && unassignedStudents.length === 0) {
      toast({ title: "Error", description: "No hay datos para exportar.", variant: "destructive" });
      return;
    }
    try {
      const blob = exportTeamsToExcel(
        generatedTeams,
        students,
        selectedSubjects,
        warnings,
        fileName,
        minMode,
        minStudentsPerSubject,
        individualMinStudents
      );
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = (fileName ? fileName.replace(/\.xlsx?$/, '') : 'equipos') + '_asignados.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast({ title: "Éxito", description: "Equipos exportados correctamente." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ocurrió un error al exportar.";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }, [generatedTeams, students, selectedSubjects, warnings, fileName, minMode, minStudentsPerSubject, individualMinStudents, unassignedStudents.length, toast]);

  // =================================================================
  // 4. VALORES DE RETORNO (RETURN VALUES)
  // El hook devuelve un objeto con todos los estados y funciones que
  // el componente de la UI necesita para leer datos y ejecutar acciones.
  // =================================================================
  return {
    // Estados y valores computados
    students,
    fileName,
    allSubjectsFromFile,
    selectedSubjects,
    minStudentsPerSubject,
    numberOfTeams,
    generatedTeams,
    error,
    warnings,
    minMode,
    individualMinStudents,
    unassignedStudents,
    hasStudents,
    hasTeams,

    // Funciones (setters y handlers)
    toast,
    setMinMode,
    setWarnings,
    setError,
    handleFileUpload,
    handleAssignTeams,
    setGeneratedTeams,
    handleClearData,
    handleNumberOfTeamsChange,
    handleSubjectToggle,
    handleIndividualMinChange,
    handleGlobalMinChange,
  handleExport,
  };
};