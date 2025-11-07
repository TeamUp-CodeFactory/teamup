"use client";

import { useMemo, useRef } from "react";
import { 
  Gauge, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  GraduationCap,
  FileDown,
  BookOpen,
  UsersRound,
  LayoutGrid,
  Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTeamBuilder } from "@/hooks/use-team-builder";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Treemap,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface DashboardPageProps {
  teamBuilderState: ReturnType<typeof useTeamBuilder>;
}

// Función auxiliar para contar estudiantes con una materia específica en un equipo
const countStudentsWithSubject = (team: any, subject: string): number => {
  return team.students.filter((s: any) => 
    s.Materias.some((m: any) => m.subject === subject)
  ).length;
};

// Paleta de colores basada en el tema de la aplicación
const CHART_COLORS = [
  "hsl(173, 85%, 33%)",  // figma-primary
  "hsl(172, 42%, 53%)",  // figma-primary-variant
  "hsl(173, 80%, 36%)",  // figma-success
  "hsl(207, 56.5%, 65.5%)", // accent variant
  "hsl(44.7, 100%, 50%)", // amber
  "hsl(180, 50%, 50%)",  // muted teal
  "hsl(157, 47%, 71%)",  // green light
  "hsl(116, 60%, 70%)",  // lighter green
  "hsl(200, 70%, 60%)",  // blue
  "hsl(280, 60%, 60%)",  // purple
];

// Componente personalizado para el TreeMap
const CustomTreemapContent = (props: any) => {
  const { root, depth, x, y, width, height, index, name, value, colors } = props;
  
  // Calcular el color basado en el índice del rol (depth 1)
  const colorIndex = depth < 2 
    ? Math.floor((index / (root?.children?.length || 1)) * colors.length) 
    : 0;
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={depth < 2 ? colors[colorIndex] : 'transparent'}
        stroke="#fff"
        strokeWidth={2 / (depth + 1e-10)}
        strokeOpacity={1 / (depth + 1e-10)}
      />
      {/* Etiqueta del rol (depth === 1) */}
      {depth === 1 && width > 80 && height > 60 && (
        <>
          <text 
            x={x + width / 2} 
            y={y + height / 2} 
            textAnchor="middle" 
            fill="#fff" 
            fontSize={14}
            fontWeight="bold"
          >
            {name}
          </text>
          <text 
            x={x + width / 2} 
            y={y + height / 2 + 18} 
            textAnchor="middle" 
            fill="#fff" 
            fontSize={11}
            fillOpacity={0.9}
          >
            ({value} estudiantes)
          </text>
        </>
      )}
      {/* Número del rol en la esquina superior izquierda */}
      {depth === 1 && width > 40 && height > 40 && (
        <text 
          x={x + 8} 
          y={y + 22} 
          fill="#fff" 
          fontSize={16} 
          fillOpacity={0.9}
          fontWeight="bold"
        >
          {index + 1}
        </text>
      )}
      {/* Etiqueta de la materia (depth === 2) */}
      {depth === 2 && width > 50 && height > 35 && (
        <>
          <text 
            x={x + width / 2} 
            y={y + height / 2 - 5} 
            textAnchor="middle" 
            fill="#fff" 
            fontSize={11}
            fontWeight="600"
          >
            {name}
          </text>
          <text 
            x={x + width / 2} 
            y={y + height / 2 + 10} 
            textAnchor="middle" 
            fill="#fff" 
            fontSize={10}
            fillOpacity={0.9}
          >
            {value}
          </text>
        </>
      )}
    </g>
  );
};


export function DashboardPage({ teamBuilderState }: DashboardPageProps) {
  const {
    students,
    generatedTeams,
    selectedSubjects,
    allSubjectsFromFile,
    warnings,
    unassignedStudents,
    minMode,
    minStudentsPerSubject,
    individualMinStudents,
    roles,
    activeTab,
  } = teamBuilderState;

  const dashboardRef = useRef<HTMLDivElement>(null);

  // Determinar si estamos en modo roles o materias
  const isRoleMode = activeTab === "roles";

  // ============ CÁLCULOS DE MÉTRICAS ============
  
  // Métricas generales
  const totalEnrollments = students.reduce((acc, student) => acc + student.Materias.length, 0);
  const uniqueStudentsCount = new Set(students.map(s => s.ID)).size;
  const totalStudents = students.length;
  const assignedStudents = totalStudents - unassignedStudents.length;
  const assignmentRate = totalStudents > 0 ? (assignedStudents / totalStudents) * 100 : 0;
  const totalTeams = generatedTeams.length;
  const selectedSubjectsCount = selectedSubjects.length;
  
  // Métricas específicas para modo roles
  const rolesCount = roles.length;
  const subjectsInRoles = useMemo(() => {
    const subjectsSet = new Set<string>();
    roles.forEach(role => {
      role.subjects.forEach(subject => subjectsSet.add(subject));
    });
    return subjectsSet.size;
  }, [roles]);
  
  // Tamaño promedio de equipos
  const avgTeamSize = totalTeams > 0 
    ? (assignedStudents / totalTeams).toFixed(1)
    : '0';
  
  // Advertencias
  const totalWarnings = warnings.length;
  const criticalWarnings = warnings.filter(w => w.isCritical).length;
  const normalWarnings = totalWarnings - criticalWarnings;

  // Equipos con advertencias
  const teamsWithWarnings = useMemo(() => {
    const teamIds = new Set(warnings.filter(w => w.team !== undefined).map(w => w.team));
    return teamIds.size;
  }, [warnings]);

  const teamsWithWarningsPercentage = totalTeams > 0 ? (teamsWithWarnings / totalTeams) * 100 : 0;

  // Distribución de materias para gráfico circular
  const subjectDistributionData = useMemo(() => {
    if (!allSubjectsFromFile.length) return [];
    
    return allSubjectsFromFile.map(subject => {
      const studentsInSubject = students.filter(s => 
        s.Materias.some(m => m.subject === subject)
      ).length;
      
      return {
        name: subject,
        value: studentsInSubject,
        isSelected: selectedSubjects.includes(subject)
      };
    }).filter(item => item.value > 0);
  }, [students, allSubjectsFromFile, selectedSubjects]);

  // Distribución por roles para gráfico circular (modo roles)
  const roleDistributionData = useMemo(() => {
    if (!roles.length || !generatedTeams.length) return [];
    
    return roles.map(role => {
      // Contar estudiantes que tienen al menos una materia del rol
      const studentsInRole = students.filter(student =>
        student.Materias.some(m => role.subjects.includes(m.subject))
      ).length;
      
      return {
        name: role.name,
        value: studentsInRole,
      };
    }).filter(item => item.value > 0);
  }, [roles, students, generatedTeams]);

  // Análisis de equipos por estado (para gráfico radial)
  const teamStatusData = useMemo(() => {
    if (!generatedTeams.length) return [];
    
    let perfect = 0;
    let withDeficiencies = 0;
    let critical = 0;

    if (isRoleMode && roles.length > 0) {
      // Modo roles
      generatedTeams.forEach(team => {
        let hasCritical = false;
        let hasDeficiency = false;

        roles.forEach(role => {
          const count = team.students.filter(s => 
            s.Materias.some(m => role.subjects.includes(m.subject))
          ).length;
          const required = role.minStudents || 1;
          
          if (count === 0) {
            hasCritical = true;
          } else if (count < required) {
            hasDeficiency = true;
          }
        });

        if (hasCritical) {
          critical++;
        } else if (hasDeficiency) {
          withDeficiencies++;
        } else {
          perfect++;
        }
      });
    } else if (selectedSubjects.length > 0) {
      // Modo materias
      generatedTeams.forEach(team => {
        let hasCritical = false;
        let hasDeficiency = false;

        selectedSubjects.forEach(subject => {
          const count = countStudentsWithSubject(team, subject);
          const required = minMode === 'global' 
            ? minStudentsPerSubject 
            : (individualMinStudents[subject] || 1);
          
          if (count === 0) {
            hasCritical = true;
          } else if (count < required) {
            hasDeficiency = true;
          }
        });

        if (hasCritical) {
          critical++;
        } else if (hasDeficiency) {
          withDeficiencies++;
        } else {
          perfect++;
        }
      });
    }

    return [
      { name: "Sin errores", value: perfect, fill: "hsl(173, 80%, 36%)" },
      { name: "Con deficiencias", value: withDeficiencies, fill: "hsl(44.7, 100%, 50%)" },
      { name: "Errores críticos", value: critical, fill: "hsl(358, 64%, 50%)" },
    ].filter(item => item.value > 0);
  }, [generatedTeams, selectedSubjects, minMode, minStudentsPerSubject, individualMinStudents, isRoleMode, roles]);

  // TreeMap Data - Roles y sus materias (solo modo roles)
  const treemapData = useMemo(() => {
    if (!isRoleMode || !roles.length) return [];
    
    const children = roles.map(role => {
      const subjectChildren = role.subjects.map(subject => {
        const count = students.filter(s => 
          s.Materias.some(m => m.subject === subject)
        ).length;
        
        return {
          name: subject,
          value: count,
        };
      }).filter(item => item.value > 0);

      const totalSize = subjectChildren.reduce((sum, child) => sum + child.value, 0);
      
      return {
        name: role.name,
        children: subjectChildren,
        value: totalSize,
      };
    }).filter(item => item.value > 0);

    // Retornar estructura con nodo raíz para TreeMap
    return [{
      name: 'Roles',
      children: children,
    }];
  }, [isRoleMode, roles, students]);

  // Tamaño de cada equipo para gráfico de barras
  const teamSizeData = useMemo(() => {
    return generatedTeams.map((team, index) => ({
      name: `Equipo ${team.id}`,
      size: team.students.length,
    }));
  }, [generatedTeams]);

  // HeatMap Data - matriz de equipos x materias
  const heatmapData = useMemo(() => {
    if (!generatedTeams.length || !selectedSubjects.length) return [];
    
    return generatedTeams.map(team => {
      const teamData: any = {
        teamId: team.id,
        teamName: `Equipo ${team.id}`,
      };

      selectedSubjects.forEach(subject => {
        const count = countStudentsWithSubject(team, subject);
        const required = minMode === 'global' 
          ? minStudentsPerSubject 
          : (individualMinStudents[subject] || 1);
        
        let status = 'critical';
        if (count >= required) {
          status = 'good';
        } else if (count > 0) {
          status = 'warning';
        }

        teamData[subject] = {
          count,
          required,
          status
        };
      });

      return teamData;
    });
  }, [generatedTeams, selectedSubjects, minMode, minStudentsPerSubject, individualMinStudents]);

  // Función para exportar a PDF
  const exportToPDF = async () => {
    if (!dashboardRef.current) return;

    try {
      const element = dashboardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Calcular el tamaño del PDF basado en las dimensiones del canvas
      // Convertir píxeles a mm (asumiendo 96 DPI: 1 inch = 25.4mm, 1 inch = 96px)
      const imgWidthMM = (canvas.width * 25.4) / 96 / 2; // Dividir por 2 debido al scale=2
      const imgHeightMM = (canvas.height * 25.4) / 96 / 2;
      
      // Añadir márgenes (20mm en cada lado)
      const marginMM = 20;
      const pdfWidth = imgWidthMM + (marginMM * 2);
      const pdfHeight = imgHeightMM + (marginMM * 2);

      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      });

      // Centrar la imagen en el PDF con márgenes
      pdf.addImage(imgData, 'PNG', marginMM, marginMM, imgWidthMM, imgHeightMM);
      pdf.save('dashboard-equipos.pdf');

      teamBuilderState.toast({ 
        title: "Éxito", 
        description: "Dashboard exportado a PDF correctamente." 
      });
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      teamBuilderState.toast({ 
        title: "Error", 
        description: "No se pudo exportar el dashboard.", 
        variant: "destructive" 
      });
    }
  };

  // Función para obtener color del heatmap
  const getHeatmapColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-figma-surface">
      <div className="p-8">
        {/* Header con botón de exportar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Gauge className="w-8 h-8 text-figma-primary" />
            <h1 className="text-3xl font-semibold text-figma-text">Dashboard</h1>
          </div>
          {totalStudents > 0 && (
            <Button 
              onClick={exportToPDF}
              className="bg-figma-primary hover:bg-figma-primary-variant text-white"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          )}
        </div>

        {/* Mensaje si no hay datos */}
        {totalStudents === 0 && (
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <CardContent className="p-8 text-center">
              <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-figma-text text-lg">No hay datos para mostrar</p>
              <p className="text-gray-500 text-sm mt-2">
                Carga un archivo de estudiantes para ver las estadísticas.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Content */}
        {totalStudents > 0 && (
          <div ref={dashboardRef} className="space-y-6">
            {/* SECCIÓN 1: TARJETAS DE MÉTRICAS - 3x3 GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1.1 Cantidad de matrículas */}
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Matrículas
                  </CardTitle>
                  <BookOpen className="w-4 h-4 text-figma-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-figma-text">{totalEnrollments}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Registros detectados
                  </p>
                </CardContent>
              </Card>

              {/* 1.2 Cantidad de estudiantes únicos */}
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Estudiantes Únicos
                  </CardTitle>
                  <Users className="w-4 h-4 text-figma-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-figma-text">{uniqueStudentsCount}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    IDs únicos detectados
                  </p>
                </CardContent>
              </Card>

              {/* 1.4 Cantidad de materias/roles */}
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {isRoleMode ? "Materias en Roles" : "Materias Seleccionadas"}
                  </CardTitle>
                  <LayoutGrid className="w-4 h-4 text-figma-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-figma-text">
                    {isRoleMode ? subjectsInRoles : selectedSubjectsCount}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isRoleMode 
                      ? `De ${allSubjectsFromFile.length} disponibles` 
                      : `De ${allSubjectsFromFile.length} disponibles`
                    }
                  </p>
                </CardContent>
              </Card>

              {/* Tarjeta de Roles (solo en modo roles) */}
              {isRoleMode && (
                <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Roles Creados
                    </CardTitle>
                    <Shield className="w-4 h-4 text-figma-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-figma-text">{rolesCount}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      Roles configurados
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 1.3 Número de equipos generados */}
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Equipos Generados
                  </CardTitle>
                  <UsersRound className="w-4 h-4 text-figma-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-figma-text">{totalTeams}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Equipos creados
                  </p>
                </CardContent>
              </Card>

              {/* 1.5 Estudiantes asignados vs total */}
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Estudiantes Asignados
                  </CardTitle>
                  <CheckCircle2 className="w-4 h-4 text-figma-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-figma-text">
                    {assignedStudents}/{totalStudents}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {assignmentRate.toFixed(1)}% tasa de asignación
                  </p>
                </CardContent>
              </Card>

              {/* 1.6 Promedio de estudiantes por equipo */}
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Promedio por Equipo
                  </CardTitle>
                  <TrendingUp className="w-4 h-4 text-figma-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-figma-text">{avgTeamSize}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Estudiantes promedio
                  </p>
                </CardContent>
              </Card>

              {/* 1.7 Cantidad de advertencias */}
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Advertencias Totales
                  </CardTitle>
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-figma-text">{totalWarnings}</div>
                  <div className="flex gap-2 mt-2">
                    {criticalWarnings > 0 && (
                      <Badge variant="destructive" className="bg-red-500 text-xs">
                        {criticalWarnings} Críticas
                      </Badge>
                    )}
                    {normalWarnings > 0 && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                        {normalWarnings} Normales
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 1.8 Porcentaje de equipos con advertencias */}
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Equipos con Advertencias
                  </CardTitle>
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-figma-text">
                    {teamsWithWarningsPercentage.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {teamsWithWarnings} de {totalTeams} equipos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* SECCIÓN 2: GRÁFICOS SIDE BY SIDE */}
            {generatedTeams.length > 0 && (
              <>
                {/* Modo Materias - 2 gráficos */}
                {!isRoleMode && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* 2.1 Gráfico Circular - Distribución por materia */}
                    {subjectDistributionData.length > 0 && (
                      <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-base font-semibold text-figma-text">
                            Distribución de Estudiantes por Materia
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={subjectDistributionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry: any) => `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {subjectDistributionData.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={CHART_COLORS[index % CHART_COLORS.length]} 
                                  />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}

                    {/* 2.2 Gráfico Radial - Estado de equipos (semicírculo) */}
                    {teamStatusData.length > 0 && (
                      <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-base font-semibold text-figma-text">
                            Estado de Equipos
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <RadialBarChart
                              cx="50%"
                              cy="75%"
                              innerRadius="20%"
                              outerRadius="100%"
                              barSize={30}
                              data={teamStatusData}
                              startAngle={180}
                              endAngle={0}
                            >
                              <RadialBar
                                label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
                                background
                                dataKey="value"
                              />
                              <Legend 
                                iconSize={10}
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                              />
                              <Tooltip />
                            </RadialBarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Modo Roles - Layout optimizado */}
                {isRoleMode && (
                  <>
                    {/* Primera fila: Dos gráficos circulares */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Gráfico Circular - Distribución por materia */}
                      {subjectDistributionData.length > 0 && (
                        <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                          <CardHeader>
                            <CardTitle className="text-base font-semibold text-figma-text">
                              Distribución de Estudiantes por Materia
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={subjectDistributionData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={(entry: any) => `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {subjectDistributionData.map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={CHART_COLORS[index % CHART_COLORS.length]} 
                                    />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      )}

                      {/* Gráfico Circular - Distribución por rol */}
                      {roleDistributionData.length > 0 && (
                        <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                          <CardHeader>
                            <CardTitle className="text-base font-semibold text-figma-text">
                              Distribución de Estudiantes por Rol
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={roleDistributionData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={(entry: any) => `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {roleDistributionData.map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={CHART_COLORS[index % CHART_COLORS.length]} 
                                    />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Segunda fila: Gráfico Radial - Estado de equipos (ancho completo) */}
                    {teamStatusData.length > 0 && (
                      <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-base font-semibold text-figma-text">
                            Estado de Equipos
                          </CardTitle>
                          <p className="text-sm text-gray-500">
                            Visualización del cumplimiento de requisitos en todos los equipos
                          </p>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={350}>
                            <RadialBarChart
                              cx="50%"
                              cy="75%"
                              innerRadius="20%"
                              outerRadius="100%"
                              barSize={40}
                              data={teamStatusData}
                              startAngle={180}
                              endAngle={0}
                            >
                              <RadialBar
                                label={{ position: 'insideStart', fill: '#fff', fontSize: 14, fontWeight: 'bold' }}
                                background
                                dataKey="value"
                              />
                              <Legend 
                                iconSize={12}
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                                wrapperStyle={{ paddingTop: '20px' }}
                              />
                              <Tooltip />
                            </RadialBarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}

                    {/* Tercera fila: TreeMap - Roles y Materias (ancho completo) */}
                    {treemapData.length > 0 && treemapData[0].children && treemapData[0].children.length > 0 && (
                      <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-base font-semibold text-figma-text">
                            Roles y sus Materias
                          </CardTitle>
                          <p className="text-sm text-gray-500">
                            Cada color representa un rol diferente con sus materias correspondientes
                          </p>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={500}>
                            <Treemap
                                data={treemapData[0].children}
                                dataKey="value"
                                stroke="#fff"
                                fill="#8884d8"
                                content={(props) => <CustomTreemapContent {...props} colors={CHART_COLORS} />}
                              >
                                <Tooltip 
                                  content={({ payload }) => {
                                    if (payload && payload.length > 0) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-white p-3 border-2 border-gray-300 rounded-lg shadow-xl">
                                          <p className="font-bold text-figma-text text-base">{data.name}</p>
                                          <p className="text-sm text-gray-600 mt-1">
                                            Estudiantes: <span className="font-semibold">{data.value || 0}</span>
                                          </p>
                                          {data.children && data.children.length > 0 && (
                                            <p className="text-xs text-gray-500 mt-1 border-t border-gray-200 pt-1">
                                              📚 {data.children.length} materia{data.children.length !== 1 ? 's' : ''}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                              </Treemap>
                            </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </>
            )}

            {/* SECCIÓN 3: GRÁFICO DE BARRAS - Tamaño de equipos */}
            {teamSizeData.length > 0 && (
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-figma-text">
                    Tamaño de Cada Equipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={teamSizeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="size" 
                        fill="hsl(173, 85%, 33%)" 
                        name="Número de Estudiantes"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* SECCIÓN 4: HEATMAP INTERACTIVO */}
            {heatmapData.length > 0 && selectedSubjects.length > 0 && (
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-figma-text">
                    Mapa de Calor: Cumplimiento por Equipo y Materia
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-2">
                    Verde: cumple mínimo | Amarillo: parcial | Rojo: sin estudiantes
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 bg-gray-100 p-2 text-sm font-semibold text-figma-text">
                            Equipo
                          </th>
                          {selectedSubjects.map((subject) => (
                            <th 
                              key={subject}
                              className="border border-gray-300 bg-gray-100 p-2 text-sm font-semibold text-figma-text"
                            >
                              {subject}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {heatmapData.map((teamRow) => (
                          <tr key={teamRow.teamId}>
                            <td className="border border-gray-300 bg-gray-50 p-2 text-sm font-medium text-figma-text text-center">
                              {teamRow.teamName}
                            </td>
                            {selectedSubjects.map((subject) => {
                              const data = teamRow[subject];
                              return (
                                <td
                                  key={subject}
                                  className={`border border-gray-300 p-2 text-center cursor-pointer transition-all hover:opacity-80 ${getHeatmapColor(data.status)}`}
                                  title={`${subject}: ${data.count} estudiantes (mínimo: ${data.required})`}
                                >
                                  <span className="text-white font-semibold text-sm">
                                    {data.count}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

