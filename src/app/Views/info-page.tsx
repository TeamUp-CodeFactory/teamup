"use client";

import React from "react";
import {
  Info,
  CheckCircle,
  Upload,
  Settings,
  Zap,
  Download,
  FileSpreadsheet,
  Code,
  Github,
  BookOpen,
  Mail,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function InfoPage() {
  const features = [
    {
      icon: <Upload className="w-6 h-6" />,
      title: "Carga de archivos Excel",
      description:
        "Importa fácilmente la información de tus estudiantes desde archivos Excel con formato estructurado.",
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: "Configuración flexible",
      description:
        "Define el número máximo de equipos y establece criterios mínimos globales o por rol/materia.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Asignación automática",
      description:
        "Algoritmo inteligente que genera equipos balanceados considerando las materias de cada estudiante.",
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: "Exportación completa",
      description:
        "Exporta los equipos generados a Excel con resúmenes detallados, advertencias y métricas.",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Cargar estudiantes",
      description:
        "Sube un archivo Excel con la información de los estudiantes (ID, nombre, correo, materias y grupos).",
    },
    {
      number: "2",
      title: "Configurar parámetros",
      description:
        "Establece el número máximo de equipos y los requisitos mínimos de estudiantes por materia o rol.",
    },
    {
      number: "3",
      title: "Generar equipos",
      description:
        "El sistema creará automáticamente equipos balanceados basándose en tu configuración.",
    },
    {
      number: "4",
      title: "Exportar resultados",
      description:
        "Descarga un archivo Excel con los equipos formados, métricas de asignación y advertencias.",
    },
  ];

  const excelColumns = [
    { name: "ID", description: "Identificador único del estudiante" },
    { name: "Nombre completo", description: "Nombre del estudiante" },
    { name: "Correo electrónico", description: "Email institucional" },
    {
      name: "Materias",
      description: "Materias cursadas separadas por comas",
    },
    { name: "Grupos", description: "Grupos correspondientes a cada materia" },
  ];

  const technologies = [
    { name: "Next.js 14", category: "Framework" },
    { name: "React 18", category: "UI Library" },
    { name: "TypeScript", category: "Language" },
    { name: "Tailwind CSS", category: "Styling" },
    { name: "shadcn/ui", category: "Components" },
    { name: "Radix UI", category: "Primitives" },
    { name: "XLSX", category: "Excel Processing" },
    { name: "Lucide React", category: "Icons" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section - Full Width */}
        <Card className="p-8 bg-white shadow-lg rounded-2xl border-none">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[hsl(var(--figma-primary))] to-teal-600 rounded-2xl flex items-center justify-center">
              <Info className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">TeamUp</h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Herramienta inteligente para la formación automática de equipos de
              estudiantes basada en criterios académicos y distribución
              equilibrada.
            </p>
            <Badge
              variant="secondary"
              className="bg-[hsl(var(--figma-primary))]/10 text-[hsl(var(--figma-primary))] hover:bg-[hsl(var(--figma-primary))]/20"
            >
              Versión 1.0.0
            </Badge>
          </div>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* What is TeamUp */}
            <Card className="p-8 bg-white shadow-lg rounded-2xl border-none h-fit">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-[hsl(var(--figma-primary))]" />
                ¿Qué es TeamUp?
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                TeamUp es una aplicación web diseñada para automatizar y optimizar
                el proceso de formación de equipos de trabajo en entornos
                académicos. La herramienta considera múltiples factores como las
                materias que cursa cada estudiante, los grupos asignados y los
                requisitos mínimos establecidos por el instructor.
              </p>
              <p className="text-gray-700 leading-relaxed">
                El sistema utiliza algoritmos inteligentes para crear equipos
                balanceados que maximizan la diversidad de conocimientos y
                minimizan conflictos de horarios, todo mientras respeta las
                restricciones configuradas por el usuario.
              </p>
            </Card>

            {/* How to Use */}
            <Card className="p-8 bg-white shadow-lg rounded-2xl border-none h-fit">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                ¿Cómo usar TeamUp?
              </h2>
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[hsl(var(--figma-primary))] to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {step.number}
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Technologies Used */}
            <Card className="p-8 bg-white shadow-lg rounded-2xl border-none h-fit">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Code className="w-6 h-6 text-[hsl(var(--figma-primary))]" />
                Tecnologías utilizadas
              </h2>
              <div className="flex flex-wrap gap-3">
                {technologies.map((tech, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full hover:border-[hsl(var(--figma-primary))] transition-colors"
                  >
                    <span className="font-semibold text-gray-900">{tech.name}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      · {tech.category}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Useful Links */}
            <Card className="p-8 bg-white shadow-lg rounded-2xl border-none h-fit">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Enlaces útiles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 hover:border-[hsl(var(--figma-primary))] hover:text-[hsl(var(--figma-primary))]"
                  onClick={() =>
                    window.open(
                      "https://github.com/TeamUp-CodeFactory/teamup",
                      "_blank"
                    )
                  }
                >
                  <Github className="w-6 h-6" />
                  <span className="font-semibold">Repositorio GitHub</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 hover:border-[hsl(var(--figma-primary))] hover:text-[hsl(var(--figma-primary))]"
                  onClick={() =>
                    window.open(
                      "https://github.com/TeamUp-CodeFactory/teamup/blob/main/README.md",
                      "_blank"
                    )
                  }
                >
                  <BookOpen className="w-6 h-6" />
                  <span className="font-semibold">Documentación</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Main Features */}
            <Card className="p-8 bg-white shadow-lg rounded-2xl border-none h-fit">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Características principales
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-[hsl(var(--figma-primary))] transition-colors"
                  >
                    <div className="w-12 h-12 bg-[hsl(var(--figma-primary))]/10 rounded-lg flex items-center justify-center mb-4 text-[hsl(var(--figma-primary))]">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Excel Requirements */}
            <Card className="p-8 bg-white shadow-lg rounded-2xl border-none h-fit">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-[hsl(var(--figma-primary))]" />
                Requisitos del archivo Excel
              </h2>
              <p className="text-gray-700 mb-6">
                El archivo Excel debe contener las siguientes columnas en este orden:
              </p>
              <div className="space-y-3 mb-6">
                {excelColumns.map((column, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-[hsl(var(--figma-primary))]/10 rounded-full flex items-center justify-center text-[hsl(var(--figma-primary))] font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{column.name}</p>
                      <p className="text-sm text-gray-600">{column.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Ejemplo:</strong> Las materias y grupos deben estar
                  separados por comas. Por ejemplo: "Matemáticas, Física" y "Grupo
                  1, Grupo 2".
                </p>
              </div>
            </Card>

            {/* Credits and Copyright */}
            <Card className="p-8 bg-white shadow-lg rounded-2xl border-none h-fit">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Créditos y Copyright
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-700 font-semibold mb-1">Desarrollado por:</p>
                  <p className="text-gray-600">Julian Vanegas López</p>
                  <p className="text-gray-600">Miguel Angel Gallego</p>
                  <p className="text-gray-600">Katherine Rodriguez Mejia</p>
                </div>
                <div>
                  <p className="text-gray-700 font-semibold mb-1">Institución:</p>
                  <p className="text-gray-600">Universidad de Antioquia</p>
                </div>
                <div>
                  <p className="text-gray-700 font-semibold mb-1">Proyecto:</p>
                  <p className="text-gray-600">Proyecto Integrador 2025</p>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    © 2025 Julian Vanegas López. Todos los derechos reservados.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
