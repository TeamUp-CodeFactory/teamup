"use client";

import type React from "react";
import type {Team} from '@/types';
import {useCallback,} from "react";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/ui/sidebar";
import { StudentUploader } from "@/app/Views/student-uploader";
import { generateExcelTemplate } from '@/lib/file_management/excelTemplate';
import { useTeamBuilder } from '@/hooks/use-team-builder';
import { StudentsMainLayout } from "./students-layout";



export default function Landingpage() {
  // Main application states.
  const {
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
    toast,
    setError,
    handleFileUpload,
    setGeneratedTeams,
    setWarnings,
    handleAssignTeams,
    handleClearData,
    handleNumberOfTeamsChange,
    handleSubjectToggle,
    handleIndividualMinChange,
    handleGlobalMinChange,
    handleExport,
    setMinMode,
  // getDisplayMinimumForSubject, // No longer needed as prop
  } = useTeamBuilder();


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

  // Rendering
  return (
    <>
      {/* Sidebar fija visible en todas las pantallas */}
      <Sidebar key={`${hasStudents}-${hasTeams}`} // Fuerza re-renderizado al cambiar hasStudents
        onDownloadTemplate={handleTemplate} // Fun para descargar plantilla
        hasStudents={hasStudents} // Indica si hay estudiantes cargados
        hasTeams={hasTeams}
        /> 
      {/* Contenido principal */}
      <div className="ml-[305px] container mx-auto flex flex-col p-4 md:p-8 min-h-screen bg-secondary">
        <Toaster />
        {/* Initial screen with full width file upload card */}
        {!hasStudents && (
          <main className="flex-1 flex justify-center items-center bg-secondary">
            <StudentUploader fileName={fileName} handleFileUpload={handleFileUpload}/>
          </main>
        )}

        {/* Main layout when students are loaded */}
        {hasStudents && (
          <StudentsMainLayout
            fileName={fileName}
            error={error}
            handleFileUpload={handleFileUpload}
            students={students}
            numberOfTeams={numberOfTeams}
            handleNumberOfTeamsChange={handleNumberOfTeamsChange}
            handleClearData={handleClearData}
            handleSubjectToggle={handleSubjectToggle}
            generatedTeams={generatedTeams}
            allSubjectsFromFile={allSubjectsFromFile}
            selectedSubjects={selectedSubjects}
            minMode={minMode}
            setMinMode={setMinMode}
            handleExport={handleExport}
            minStudentsPerSubject={minStudentsPerSubject}
            individualMinStudents={individualMinStudents}
            handleGlobalMinChange={handleGlobalMinChange}
            handleIndividualMinChange={handleIndividualMinChange}
            setGeneratedTeams={setGeneratedTeams}
            setWarnings={setWarnings}
            setError={setError}
            handleAssignTeams={handleAssignTeams}
            warnings={warnings}
            // getDisplayMinimumForSubject and countStudentsWithSubject removed from props
            unassignedStudents={unassignedStudents}
          />
        )}
        <footer className="py-6 text-center text-sm text-muted-foreground mt-8">
          Copyright © 2025 Julian Vanegas López
        </footer>
      </div>
    </>
  );
}
