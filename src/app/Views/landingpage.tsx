"use client";

import type React from "react";
import {useCallback,useEffect,} from "react";
import { Toaster } from "@/components/ui/toaster";
import { StudentUploader } from "@/app/Views/student-uploader";
import { generateExcelTemplate } from '@/lib/file_management/excelTemplate';
import { useTeamBuilder } from '@/hooks/use-team-builder';

interface LandingPageProps {
  teamBuilderState: ReturnType<typeof useTeamBuilder>;
}

export default function Landingpage({ teamBuilderState }: LandingPageProps) {
  // Usar el estado que viene del padre
  const {
    fileName,
    hasStudents,
    toast,
    handleFileUpload,
  } = teamBuilderState;

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      {/* Contenido principal: background full-viewport */}
      <main className="min-h-screen flex-1 bg-figma-surface flex items-center justify-center overflow-x-hidden">
        {/* content area to the right of the sidebar; center its children. */}
        <div className="w-full max-w-4xl px-4 md:px-8 text-figma-text">
            <Toaster />
        {/* Initial screen with hero section + file upload card */}
        {!hasStudents && (
          <div className="flex flex-col items-center justify-center space-y-8 py-12">
            {/* Hero section */}
            <div className="text-center space-y-4 max-w-2xl">
              <h1 className="text-hero-title font-bold tracking-tight text-figma-primary">
                ¡Bienvenido!
              </h1>
              <p className="text-hero-subtitle tracking-tight text-figma-muted-text">
                Comienza a crear equipos
              </p>
              <p className="text-hero-description text-muted-foreground px-4">
                El primer paso es subir un archivo de Excel (.xlsx) con la información de los estudiantes. Verifica que el listado contenga obligatoriamente las siguientes columnas: <span className="font-semibold">ID</span>, <span className="font-semibold">Nombre completo</span>, <span className="font-semibold">Correo electrónico</span>, <span className="font-semibold">Materias</span>, <span className="font-semibold">Grupos</span>. Para facilitar este proceso, puedes descargar la plantilla y lista para llenar.
              </p>
            </div>
            
            {/* File upload card */}
            <StudentUploader fileName={fileName} handleFileUpload={handleFileUpload}/>
          </div>
        )}
        <footer className="py-6 text-center text-sm text-muted-foreground mt-8">
          Copyright © 2025 Julian Vanegas López
        </footer>
      </div>
      </main>
    </div>
  );
}
