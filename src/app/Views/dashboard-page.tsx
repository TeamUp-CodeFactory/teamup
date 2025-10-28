"use client";

import { useMemo } from "react";
import { Gauge, Users, AlertTriangle, CheckCircle2, TrendingUp, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTeamBuilder } from "@/hooks/use-team-builder";

interface DashboardPageProps {
  teamBuilderState: ReturnType<typeof useTeamBuilder>;
}

// Función auxiliar para contar estudiantes con una materia específica en un equipo
const countStudentsWithSubject = (team: any, subject: string): number => {
  return team.students.filter((s: any) => 
    s.Materias.some((m: any) => m.subject === subject)
  ).length;
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
  } = teamBuilderState;

  // ============ CÁLCULOS DE MÉTRICAS ============
  
  // Métricas generales
  const totalStudents = students.length;
  const assignedStudents = totalStudents - unassignedStudents.length;
  const assignmentRate = totalStudents > 0 ? (assignedStudents / totalStudents) * 100 : 0;
  const totalTeams = generatedTeams.length;
  
  // Tamaño promedio de equipos
  const avgTeamSize = totalTeams > 0 
    ? (assignedStudents / totalTeams).toFixed(1)
    : '0';
  
  // Advertencias
  const totalWarnings = warnings.length;
  const criticalWarnings = warnings.filter(w => w.isCritical).length;
  const normalWarnings = totalWarnings - criticalWarnings;

  // Distribución de materias
  const subjectDistribution = useMemo(() => {
    if (!allSubjectsFromFile.length) return [];
    
    return allSubjectsFromFile.map(subject => {
      const studentsInSubject = students.filter(s => 
        s.Materias.some(m => m.subject === subject)
      ).length;
      
      const percentage = totalStudents > 0 
        ? (studentsInSubject / totalStudents) * 100 
        : 0;
      
      const isSelected = selectedSubjects.includes(subject);
      
      return {
        subject,
        count: studentsInSubject,
        percentage: percentage.toFixed(1),
        isSelected
      };
    }).sort((a, b) => b.count - a.count);
  }, [students, allSubjectsFromFile, selectedSubjects, totalStudents]);

  // Cumplimiento de requisitos por equipo
  const teamCompliance = useMemo(() => {
    if (!generatedTeams.length || !selectedSubjects.length) return null;
    
    const compliantTeams = generatedTeams.filter(team => {
      return selectedSubjects.every(subject => {
        const count = countStudentsWithSubject(team, subject);
        const required = minMode === 'global' 
          ? minStudentsPerSubject 
          : (individualMinStudents[subject] || 1);
        return count >= required;
      });
    });
    
    return {
      compliant: compliantTeams.length,
      total: totalTeams,
      percentage: totalTeams > 0 ? (compliantTeams.length / totalTeams) * 100 : 0
    };
  }, [generatedTeams, selectedSubjects, minMode, minStudentsPerSubject, individualMinStudents, totalTeams]);

  // Balance de equipos (desviación estándar del tamaño)
  const teamBalance = useMemo(() => {
    if (!generatedTeams.length) return null;
    
    const sizes = generatedTeams.map(t => t.students.length);
    const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avg, 2), 0) / sizes.length;
    const stdDev = Math.sqrt(variance);
    
    // Considerar "balanceado" si la desviación es menor a 1 estudiante
    const isBalanced = stdDev < 1.5;
    
    return {
      isBalanced,
      stdDev: stdDev.toFixed(2),
      minSize: Math.min(...sizes),
      maxSize: Math.max(...sizes)
    };
  }, [generatedTeams]);

  return (
    <div className="min-h-screen bg-figma-surface">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Gauge className="w-8 h-8 text-figma-primary" />
          <h1 className="text-3xl font-semibold text-figma-text">Dashboard</h1>
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

        {/* Métricas principales */}
        {totalStudents > 0 && (
          <div className="space-y-6">
            {/* Fila 1: Métricas generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Estudiantes */}
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Estudiantes
                  </CardTitle>
                  <Users className="w-4 h-4 text-figma-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-figma-text">{totalStudents}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Cargados desde el archivo
                  </p>
                </CardContent>
              </Card>

              {/* Equipos Generados */}
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Equipos Generados
                  </CardTitle>
                  <Users className="w-4 h-4 text-figma-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-figma-text">{totalTeams}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Tamaño promedio: {avgTeamSize} estudiantes
                  </p>
                </CardContent>
              </Card>

              {/* Tasa de Asignación */}
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Tasa de Asignación
                  </CardTitle>
                  <TrendingUp className="w-4 h-4 text-figma-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-figma-text">
                    {assignmentRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {assignedStudents} de {totalStudents} asignados
                  </p>
                  <Progress value={assignmentRate} className="mt-2 h-2" />
                </CardContent>
              </Card>

              {/* Advertencias */}
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Advertencias
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
                    {totalWarnings === 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        Sin problemas
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fila 2: Cumplimiento y Balance */}
            {generatedTeams.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cumplimiento de Requisitos */}
                {teamCompliance && (
                  <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold text-figma-text flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-figma-primary" />
                        Cumplimiento de Requisitos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">
                          Equipos que cumplen todos los mínimos
                        </span>
                        <span className="text-sm font-semibold text-figma-text">
                          {teamCompliance.compliant} / {teamCompliance.total}
                        </span>
                      </div>
                      <Progress value={teamCompliance.percentage} className="h-3 mb-2" />
                      <p className="text-xs text-gray-500">
                        {teamCompliance.percentage.toFixed(1)}% de cumplimiento
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Balance de Equipos */}
                {teamBalance && (
                  <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold text-figma-text flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-figma-primary" />
                        Balance de Equipos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-3">
                        {teamBalance.isBalanced ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Balanceado
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            Desbalanceado
                          </Badge>
                        )}
                        <span className="text-sm text-gray-600">
                          Desviación: {teamBalance.stdDev}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Tamaño mínimo</p>
                          <p className="text-2xl font-bold text-figma-text">
                            {teamBalance.minSize}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Tamaño máximo</p>
                          <p className="text-2xl font-bold text-figma-text">
                            {teamBalance.maxSize}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Fila 3: Distribución de Materias */}
            {subjectDistribution.length > 0 && (
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-figma-text">
                    Distribución de Materias
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Número de estudiantes por materia
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subjectDistribution.map((item) => (
                      <div key={item.subject} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-figma-text">
                              {item.subject}
                            </span>
                            {item.isSelected && (
                              <Badge className="bg-figma-primary text-white text-xs">
                                Seleccionada
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-gray-600">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                        <Progress 
                          value={parseFloat(item.percentage)} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Estudiantes sin asignar */}
            {unassignedStudents.length > 0 && (
              <Card className="bg-red-50 rounded-2xl shadow-sm border border-red-200">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Estudiantes Sin Asignar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-3">
                    Hay {unassignedStudents.length} estudiante(s) que no fueron asignados a ningún equipo.
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {unassignedStudents.slice(0, 10).map((student) => (
                      <div 
                        key={student.ID}
                        className="text-xs text-gray-600 bg-white p-2 rounded border border-red-100"
                      >
                        {student.ID} - {student["Nombre completo"]}
                      </div>
                    ))}
                    {unassignedStudents.length > 10 && (
                      <p className="text-xs text-gray-500 italic pt-2">
                        ... y {unassignedStudents.length - 10} más
                      </p>
                    )}
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
