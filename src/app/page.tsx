"use client";

import type React from "react";
import type { Student, Team, AssignmentWarning, MinStudentMode } from '@/types';
import { useState, useCallback, useEffect, useMemo } from "react";
import { File, FileUp, FileDown, Download, Users, Settings, Trash2, AlertTriangle, Mail, Shuffle, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { generateExcelTemplate } from '@/lib/file_management/excelTemplate';
import { parseStudentExcel } from '@/lib/file_management/excelProcessor';
import { exportTeamsToExcel } from '@/lib/file_management/excelExporter';
import { allocateTeams } from '@/lib/teams/allocator';
import { getConfiguredSubjectMinimum } from '@/lib/teams/utils'; // Corrected import
import { cn } from "@/lib/utils";

// Helper: Count students with specific subject in a team.
const countStudentsWithSubject = (team: Team, subject: string): number => {
  return team.students.filter(s => s.Materias.some(sg => sg.subject === subject)).length;
};

/**
 * The main page component for the TeamUp application.
 *
 * This component provides the full workflow for uploading a student Excel file,
 * configuring team assignment parameters, generating teams according to subject/group constraints,
 * displaying warnings/errors, and exporting results.
 *
 * ## Main Features
 * - Uploads and parses an Excel file with student data.
 * - Allows configuration of:
 *   - Number of teams.
 *   - Subjects to consider for team assignment.
 *   - Minimum number of students per subject (global or per subject).
 * - Generates teams based on the selected configuration, ensuring subject/group requirements.
 * - Displays errors and warnings if team assignment cannot fully meet the requirements.
 * - Shows a preview of students, generated teams, and unassigned students.
 * - Exports the teams and warnings to an Excel file.
 * - Provides UI feedback via toast notifications.
 *
 * ## State Variables
 * - `students`: List of all loaded students.
 * - `fileName`: Name of the uploaded Excel file.
 * - `allSubjectsFromFile`: All unique subjects found in the file.
 * - `selectedSubjects`: Subjects selected for team assignment.
 * - `minStudentsPerSubject`: Global minimum students per subject.
 * - `numberOfTeams`: Number of teams to generate.
 * - `generatedTeams`: The generated teams after assignment.
 * - `error`: Error message for critical issues.
 * - `warnings`: List of assignment warnings (critical and non-critical).
 * - `minMode`: Mode for minimum students ('global' or 'individual').
 * - `individualMinStudents`: Minimum students per subject (for individual mode).
 *
 * ## Main Handlers
 * - `handleTemplate`: Downloads an Excel template for user guidance.
 * - `handleFileUpload`: Handles Excel file upload and parsing.
 * - `handleAssignTeams`: Generates teams based on the current configuration.
 * - `handleNumberOfTeamsChange`: Updates the number of teams.
 * - `handleSubjectToggle`: Toggles subject selection for team assignment.
 * - `handleIndividualMinChange`: Updates minimum students for a specific subject.
 * - `handleGlobalMinChange`: Updates the global minimum students per subject.
 * - `handleClearData`: Clears all loaded data and resets the app state.
 * - `handleExport`: Exports generated teams and warnings to an Excel file.
 *
 * ## UI Layout
 * - Initial card for file upload and template download.
 * - Main layout with configuration panel and results display when students are loaded.
 * - Error and warning alerts, students preview, and generated teams table.
 *
 * @component
 * @returns {JSX.Element} The rendered TeamUp main page.
 */
export default function Home() {
  // Main application states.
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
  const { toast } = useToast();
  const hasStudents = students.length > 0;

  // Downloads the Excel template.
  const handleTemplate = useCallback(() => {
    const templateBlob = generateExcelTemplate();
    const url = window.URL.createObjectURL(templateBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'listado_estudiantes.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    toast({ title: "Éxito", description: "La plantilla de se ha descargado correctamente." });
  }, [
    toast
  ]);

  // IDs of students already assigned to teams.
  const assignedStudentIDsInTeams = useMemo(() => {
    return new Set(generatedTeams.flatMap(g => g.students.map(s => s.ID)));
  }, [generatedTeams]);

  // List of unassigned students.
  const unassignedStudents = useMemo(() => {
    return students.filter(s => !assignedStudentIDsInTeams.has(s.ID));
  }, [students, assignedStudentIDsInTeams]);

  // Gets the minimum to display for a subject (according to mode).
  const getDisplayMinimumForSubject = useCallback((subject: string): number => {
    return getConfiguredSubjectMinimum(subject, minMode, minStudentsPerSubject, individualMinStudents); // Corrected function call
  }, [minMode, minStudentsPerSubject, individualMinStudents]);

  // Handles Excel file upload and processing of students/subjects.
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Clear previous states.
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
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido al procesar el archivo.";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      setFileName(null);
      setStudents([]);
      setSelectedSubjects([]);
      setAllSubjectsFromFile([]);
      setIndividualMinStudents({});
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [toast]);

  // Generates teams according to the current configuration.
  const handleAssignTeams = useCallback(() => {
    setError(null);
    setWarnings([]);
    setGeneratedTeams([]);

    // Pre-validations.
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

      const criticalFailures = assignmentWarnings.filter(w => w.isCritical);

      if (criticalFailures.length > 0) {
        toast({ title: "Equipos generados con errores", description: `${criticalFailures.length} problema(s) críticos detectados. Revise las advertencias.`, variant: "destructive", duration: 9000 });
      } else if (assignmentWarnings.length > 0) {
        toast({ title: "Equipos generados con advertencias", description: "Algunos requisitos pueden no haberse cumplido. Revise las advertencias.", variant: "warning", duration: 7000 });
      } else if (teams.length > 0) {
        toast({ title: "Éxito", description: "Equipos asignados correctamente." });
      } else {
        if (!assignmentWarnings.some(w => w.isCritical)) {
          setError("No se pudieron generar equipos con la configuración actual (posiblemente no hay estudiantes con las materias seleccionadas).");
          toast({ title: "Error", description: "No se generaron equipos. Verifique la selección de materias.", variant: "destructive" });
        }
      }
    } catch (err) {
      console.error("Error during team allocation:", err);
      const message = err instanceof Error ? err.message : "Ocurrió un error desconocido al asignar equipos.";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }, [
    students,
    selectedSubjects,
    numberOfTeams,
    minMode,
    minStudentsPerSubject,
    individualMinStudents,
    toast
  ]);

  // Changes the number of teams and clears previous results.
  const handleNumberOfTeamsChange = useCallback((value: number) => {
    setNumberOfTeams(Math.max(1, value || 1));
    setGeneratedTeams([]);
    setWarnings([]);
    setError(null);
  }, []);

  // Toggles the selection of a subject and updates individual minimums.
  const handleSubjectToggle = useCallback((subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
    setIndividualMinStudents(prevMins => {
      const newMins = { ...prevMins };
      if (!selectedSubjects.includes(subject) && !(subject in newMins)) {
        newMins[subject] = 1;
      }
      return newMins;
    });
    setGeneratedTeams([]);
    setWarnings([]);
    setError(null);
  }, [selectedSubjects]);

  // Changes the individual minimum for a subject.
  const handleIndividualMinChange = useCallback((subject: string, value: number) => {
    setIndividualMinStudents(prev => ({
      ...prev,
      [subject]: Math.max(1, value || 1)
    }));
    setGeneratedTeams([]);
    setWarnings([]);
    setError(null);
  }, []);

  // Changes the global minimum for all subjects.
  const handleGlobalMinChange = useCallback((value: number) => {
    setMinStudentsPerSubject(Math.max(1, value || 1));
    setGeneratedTeams([]);
    setWarnings([]);
    setError(null);
  }, []);

  // Clears all data and application states.
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
    if (fileInput) {
      fileInput.value = '';
    }
    toast({ title: "Datos eliminados", description: "Se han limpiado los datos cargados y la configuración." });
  }, [toast]);

  // Exports the generated teams and unassigned students to an Excel file.
  const handleExport = useCallback(async () => {
    if (generatedTeams.length === 0 && unassignedStudents.length === 0) {
      toast({ title: "Error", description: "No hay equipos generados ni estudiantes sin asignar.", variant: "destructive" });
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
      const exportFileName = (fileName ? fileName.replace(/\.xlsx?$/, '') : 'equipos') + '_asignados.xlsx';
      link.download = exportFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast({ title: "Éxito", description: "Equipos exportados correctamente." });
    } catch (err) {
      console.error("Error exporting to Excel:", err);
      const message = err instanceof Error ? err.message : "Ocurrió un error desconocido al exportar los equipos.";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }, [
    generatedTeams,
    students,
    selectedSubjects,
    warnings,
    fileName,
    minMode,
    minStudentsPerSubject,
    individualMinStudents,
    unassignedStudents.length,
    toast
  ]);

  // Rendering
  return (
    <>
      {/* Sidebar fija visible en todas las pantallas */}
      <Sidebar onDownloadTemplate={handleTemplate}/>
      {/* Contenido principal */}
      <div className="ml-[305px] container mx-auto flex flex-col p-4 md:p-8 min-h-screen bg-secondary">
        <Toaster />
        {/* Initial screen with full width file upload card */}
        { !hasStudents && (
        <main className="flex-1 flex justify-center items-center bg-secondary">
        <Card className="shadow-sm  w-full md:w-2/3 mx-auto shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center justify-center gap-2 text-center">
              Bienvenid@ ¡Comencemos!
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground text-center">
              Para empezar debes cargar un archivo de Excel con el listado de estudiantes. Asegúrate que contenga las siguientes columnas: ID, Nombre completo, Correo electrónico, Materias y Grupos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="file-upload" className={cn(
                "flex items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-border border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none",
                fileName && "border-primary bg-primary/10"
              )}>
                <span className="flex items-center space-x-2 text-center">
                  <FileUp className="h-6 w-6 " />
                  <span className="font-medium text-foreground">
                    {fileName ? `${fileName}` : 'Haz clic o arrastra para subir un archivo'}
                  </span>
                </span>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </Label>
              <p className="text-xs text-center text-muted-foreground mt-1">
                Solo se permiten archivos .xlsx
              </p>
            </div>
          </CardContent>
        </Card>
        </main>
      )}

      {/* Main layout when students are loaded */}
      {hasStudents && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Configuration Column */}
          <div className="md:col-span-1 space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <File className="text-accent" />
                  Cargar archivo
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Selecciona un archivo de Excel con el listado de estudiantes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="file-upload" className={cn(
                    "flex items-center justify-center w-full h-20 px-4 transition bg-background border-2 border-border border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none",
                    fileName && "border-primary bg-primary/10"
                  )}>
                    <span className="flex items-center space-x-2 text-center">
                      <FileUp className="h-5 w-5 text-primary" />
                      <span className="font-medium text-foreground text-sm">
                        {fileName ? `${fileName}` : 'Haz clic o arrastra para subir un archivo'}
                      </span>
                    </span>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".xlsx"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </Label>
                  <p className="text-xs text-end text-muted-foreground mt-1">
                    Solo se permiten archivos .xlsx
                  </p>
                  <Button variant="outline" size="sm" onClick={handleClearData} className="w-full flex items-center gap-1 hover:bg-primary/10 hover:text-primary">
                    <Trash2 className="w-4 h-4" /> Limpiar datos
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* Configuration Section only if students loaded */}
            <div className="md:sticky md:top-0 md:self-start h-screen scroll no-scrollbar">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2"><Settings className="text-primary" /> Configurar equipos</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">Define cómo se conformarán los equipos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 no-scrollbar">
                  {/* Number of Teams */}
                  <div className="space-y-2">
                    <Label htmlFor="num-teams" className="font-semibold block mb-2">Cantidad máxima de equipos</Label>
                    <Input
                      id="num-teams"
                      type="number"
                      min="1"
                      value={numberOfTeams}
                      onChange={(e) => handleNumberOfTeamsChange(parseInt(e.target.value))}
                      placeholder="Ej: 5"
                      className="form-input"
                    />
                  </div>
                  {/* Subjects to Consider */}
                  <div className="space-y-2">
                    <Label className="font-semibold block mb-2">Materias a considerar</Label>
                    <div className="space-y-1 rounded-md border p-2 bg-background">
                      {allSubjectsFromFile.length > 0 ? allSubjectsFromFile.map((subject) => (
                        <div key={subject} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`subject-${subject}`}
                            checked={selectedSubjects.includes(subject)}
                            onChange={() => handleSubjectToggle(subject)}
                            className="form-checkbox h-4 w-4 text-primary border-muted-foreground rounded focus:ring-primary cursor-pointer"
                          />
                          <Label htmlFor={`subject-${subject}`} className="text-sm font-normal cursor-pointer">
                            {subject}
                          </Label>
                        </div>
                      )) : (
                        <p className="text-sm text-muted-foreground">No hay materias detectadas en el archivo.</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Marca las materias que deben estar presentes en cada equipo.</p>
                  </div>
                  {/* Minimum Students Configuration */}
                  <div className="space-y-3">
                    <Label className="font-semibold block mb-2">Mínimo de estudiantes por materia</Label>
                    <RadioGroup value={minMode} onValueChange={(value) => {
                      setMinMode(value as MinStudentMode);
                      setGeneratedTeams([]);
                      setWarnings([]);
                      setError(null);
                    }} className="mb-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="global" id="min-global" />
                        <Label htmlFor="min-global" className="font-normal">Valor global</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="min-individual" />
                        <Label htmlFor="min-individual" className="font-normal">Valor por materia</Label>
                      </div>
                    </RadioGroup>
                    {minMode === 'global' && (
                      <div className="space-y-2 mt-1">
                        <p className="text-xs text-muted-foreground mb-2">Define el mínimo para todas las materias seleccionadas:</p>
                        <Input
                          id="min-students-global"
                          type="number"
                          min="1"
                          value={minStudentsPerSubject}
                          onChange={(e) => handleGlobalMinChange(parseInt(e.target.value))}
                          placeholder="Ej: 1"
                          className="form-input"
                        />
                        <p className="text-xs text-muted-foreground">Cada equipo intentará incluir mínimo este número de estudiantes para cada materia considerando su grupo.</p>
                      </div>
                    )}
                    {minMode === 'individual' && (
                      <div className="space-y-2 mt-1">
                        <p className="text-xs text-muted-foreground mb-2">Define el mínimo para cada materia seleccionada:</p>
                        <div className="w-full rounded-md border p-2 bg-background space-y-2">
                          {selectedSubjects.length > 0 ? selectedSubjects.map(subject => (
                            <div key={subject} className="flex items-center justify-between space-x-2">
                              <Label htmlFor={`min-${subject}`} className="text-sm flex-1 truncate">{subject}</Label>
                              <Input
                                id={`min-${subject}`}
                                type="number"
                                min="1"
                                value={individualMinStudents[subject] ?? 1}
                                onChange={(e) => handleIndividualMinChange(subject, parseInt(e.target.value))}
                                className="form-input w-20 h-8 text-sm"
                                placeholder="1"
                              />
                            </div>
                          )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Selecciona materias primero.</p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Cada equipo intentará incluir mínimo este número de estudiantes para cada materia considerando su grupo.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleAssignTeams} disabled={students.length === 0 || selectedSubjects.length === 0} className="flex items-center gap-2 w-full">
                    <Shuffle className="h-4 w-4" /> Generar equipos
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* Results Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Global Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertTitle>Error en la aplicación</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {/* Warnings & Errors (shown when teams generated and warnings exist) */}
            {warnings.length > 0 && generatedTeams.length > 0 && (
              <Card className="shadow-sm">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="warnings" className="border-none">
                    <CardHeader className={cn("p-4 rounded-t-lg", warnings.some(w => w.isCritical) ? "bg-destructive/10" : "bg-yellow-50 dark:bg-yellow-900/30")}>
                      <AccordionTrigger className="p-0 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                        <div className="flex items-center flex-1">
                          <AlertTriangle className={cn("h-5 w-5", warnings.some(w => w.isCritical) ? "text-destructive" : "text-yellow-600 dark:text-yellow-400")} />
                          <CardTitle className={cn("text-lg pl-2 mb-0", warnings.some(w => w.isCritical) ? "text-destructive" : "text-yellow-800 dark:text-yellow-300")}>
                            Advertencias y errores ({warnings.length})
                            {warnings.some(w => w.isCritical) && " - ¡CRÍTICO!"}
                          </CardTitle>
                        </div>
                      </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent className="border border-t-0 rounded-b-lg p-4">
                      <AlertDescription className="pl-0">
                        Revisa los siguientes problemas{warnings.some(w => w.isCritical) && ". Algunos son críticos y requieren ajustes"}:
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                          {warnings.map((warning, index) => (
                            <li key={index} className={cn(
                              "text-sm",
                              warning.isCritical && "font-semibold text-destructive dark:text-red-300"
                            )}>
                              {warning.isCritical && <Badge variant="destructive" className="mr-1.5 text-xs px-1 py-0 align-middle">CRÍTICO</Badge>}
                              {warning.message}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-xs text-muted-foreground">Estos detalles también se incluirán al exportar los datos.</p>
                      </AlertDescription>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            )}
            {/* Students preview (shown only if students loaded and no teams generated yet) */}
            {students.length > 0 && generatedTeams.length === 0 && (
              <Card className="bg-background/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl"><Users className="text-muted-foreground" /> Listado de estudiantes ({students.length})</CardTitle>
                  <CardDescription className="mt-1.5">Estudiantes cargados desde '{fileName}'. Verifica las materias seleccionadas (<Badge variant="default" className="text-xs px-1.5 py-0.5 align-middle bg-primary text-primary-foreground">color verde</Badge>).</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table className="border">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Estudiante</TableHead>
                        <TableHead>Materias y grupos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, index) => (
                        <TableRow key={`${student.ID}-${index}`} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs">{student.ID}</TableCell>
                          <TableCell>
                            <div className="font-medium">{student['Nombre completo']}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {student['Correo electrónico']}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {student.Materias.map((sg) => (
                                <Badge key={`${sg.subject}-${sg.group}`} variant={selectedSubjects.includes(sg.subject) ? "default" : "secondary"} className={cn("text-xs", selectedSubjects.includes(sg.subject) && "bg-primary text-primary-foreground")}>
                                  {sg.subject} ({sg.group})
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
            {/* Generated Teams Display */}
            {generatedTeams.length > 0 && (
              <Card className="bg-background/80 shadow-sm">
                <CardHeader className="flex flex-row justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl"><Users className="text-muted-foreground" /> Equipos generados ({generatedTeams.length})</CardTitle>
                    <CardDescription className="mt-1.5">Revisa la conformación de los equipos y la información de los estudiantes.</CardDescription>
                  </div>
                  <Button onClick={handleExport} variant="outline" size="sm" className="flex items-center gap-1 ml-2 hover:bg-primary/10 hover:text-primary">
                    <Download className="h-4 w-4" /> Exportar
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  {/* Display Unassigned Students Warning if any */}
                  {/*unassignedStudents.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <AlertTitle>Estudiantes sin asignar ({unassignedStudents.length})</AlertTitle>
                      <AlertDescription>
                        <ScrollArea className="max-h-20 mt-1">
                          <ul className="list-disc pl-5 text-xs space-y-0.5">
                            {unassignedStudents.map(s => (
                              <li key={s.ID}>{s['Nombre completo']} (ID: {s.ID}) - Materias: {s.Materias.map(sg => `${sg.subject} (${sg.group})`).join(', ')}</li>
                            ))}
                          </ul>
                        </ScrollArea>
                        <span className="text-xs block mt-1">Estos estudiantes no pudieron ser asignados. Esto es un problema crítico, para más detalles revise las advertencias. Verifique las configuraciones y los datos del archivo original.</span>
                      </AlertDescription>
                    </Alert>
                  )*/}
                  <div className="space-y-6">
                    {generatedTeams.map((team) => (
                      <div key={team.id} className="border p-4 rounded-lg bg-background/60">
                        <h3 className="text-lg font-semibold mb-3 text-primary">
                          Equipo {team.id} ({team.students.length} Estudiante{team.students.length !== 1 ? 's' : ''})
                        </h3>
                        {/* Subject/Group Counts and Minimums Display */}
                        {selectedSubjects.length > 0 && (
                          <div className="mb-3 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                            {selectedSubjects.map(subj => {
                              const count = countStudentsWithSubject(team, subj);
                              const requiredMin = getDisplayMinimumForSubject(subj);
                              const isMet = count >= requiredMin;
                              const isPresent = count > 0;
                              const isCriticallyMissing = requiredMin > 0 && count === 0;
                              return (
                                <span key={`${subj}-count`} className={cn(
                                  "font-medium px-1.5 py-0.5 rounded",
                                  isCriticallyMissing ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                                    : isMet ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                      : isPresent ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                                        : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                                )}>
                                  {subj}: {count} / {requiredMin}
                                  {isCriticallyMissing && " (¡CRÍTICO!)"}
                                  {!isMet && !isCriticallyMissing && isPresent && ` (Faltan ${requiredMin - count})`}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <Table className="border">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">ID</TableHead>
                              <TableHead>Estudiante</TableHead>
                              <TableHead>Materias y grupos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {team.students.sort((a, b) => String(a['Nombre completo']).localeCompare(String(b['Nombre completo']))).map((student, index) => {
                              const relevantSelectedSubjectGroups = student.Materias.filter(sg => selectedSubjects.includes(sg.subject));
                              return (
                                <TableRow key={`${student.ID}-${index}`} className="text-sm">
                                  <TableCell className="font-mono text-xs">{student.ID}</TableCell>
                                  <TableCell>
                                    <div className="font-medium">{student['Nombre completo']}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {student['Correo electrónico']}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {student.Materias.length > 0 ? student.Materias.map((sg) => {
                                        const isSelected = relevantSelectedSubjectGroups.some(selected => selected.subject === sg.subject && selected.group === sg.group);
                                        return (
                                          <Badge
                                            key={`${sg.subject}-${sg.group}`}
                                            variant={isSelected ? "default" : "secondary"}
                                            className="text-xs"
                                          >
                                            {sg.subject} ({sg.group})
                                          </Badge>
                                        );
                                      }) : (
                                        <Badge variant="secondary" className="text-xs">Sin materias</Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
      <footer className="py-6 text-center text-sm text-muted-foreground mt-8">
    Copyright © 2025 Julian Vanegas López
  </footer>
    </div>
    </>
  );
}
