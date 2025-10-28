"use client";
import { useState, useCallback } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import LandingPage from "./landingpage";
import { TeamConfigurator } from "./team-configurator";
import { StudentsPage } from "./students-page";
import { TeamsPage } from "./teams-page";
import { WarningsPage } from "./warnings-page";
import { DashboardPage } from "./dashboard-page";
import InfoPage from "./info-page";
import { useTeamBuilder } from '@/hooks/use-team-builder';
import { generateExcelTemplate } from '@/lib/file_management/excelTemplate';

export default function AppLayout() {
  const [currentPage, setCurrentPage] = useState("inicio");
  
  // Mover el hook useTeamBuilder aquí para que persista entre navegaciones
  const teamBuilderState = useTeamBuilder();
  const { hasStudents, hasTeams, toast, handleExport } = teamBuilderState;

  const handleDownloadTemplate = useCallback(() => {
    const templateBlob = generateExcelTemplate();
    const url = window.URL.createObjectURL(templateBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'listado_estudiantes.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    toast({ title: "Éxito", description: "La plantilla se ha descargado correctamente." });
  }, [toast]);

  const handleExportTeams = useCallback(() => {
    handleExport();
  }, [handleExport]);

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      {/* Sidebar fija visible en todas las pantallas */}
      <div className="fixed left-0 top-0 h-screen z-50">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          hasStudents={hasStudents}
          hasTeams={hasTeams}
          onDownloadTemplate={handleDownloadTemplate}
          onExportTeams={handleExportTeams}
        />
      </div>
      
      {/* Main con margen para la sidebar */}
      <main className="flex-1 ml-[280px]">
        {/* Si no hay estudiantes, mostrar landing con hero */}
        {currentPage === "inicio" && !hasStudents && (
          <LandingPage teamBuilderState={teamBuilderState} />
        )}
        
        {/* Si hay estudiantes, mostrar configurador */}
        {currentPage === "inicio" && hasStudents && (
          <TeamConfigurator teamBuilderState={teamBuilderState} />
        )}
        {currentPage === "estudiantes" && hasStudents && (
          <StudentsPage teamBuilderState={teamBuilderState} />
        )}
        {currentPage === "dashboard" && (
          <DashboardPage teamBuilderState={teamBuilderState} />
        )}
        {currentPage === "equipos" && hasTeams && (
          <TeamsPage teamBuilderState={teamBuilderState} />
        )}
        {currentPage === "advertencias" && hasTeams && (
          <WarningsPage teamBuilderState={teamBuilderState} />
        )}
        {currentPage === "informacion" && (
          <InfoPage />
        )}
      </main>
    </div>
  );
}
