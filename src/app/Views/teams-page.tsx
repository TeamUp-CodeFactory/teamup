"use client";

import { useState, useMemo } from "react";
import { Users, ChevronDown, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTeamBuilder } from "@/hooks/use-team-builder";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TeamsPageProps {
  teamBuilderState: ReturnType<typeof useTeamBuilder>;
}

export function TeamsPage({ teamBuilderState }: TeamsPageProps) {
  const { generatedTeams, selectedSubjects, handleExport, activeTab, roles } = teamBuilderState;
  const [openTeams, setOpenTeams] = useState<Record<number, boolean>>({
    1: true, // Primera equipo abierto por defecto
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Ordenar equipos por ID
  const sortedTeams = [...generatedTeams].sort((a, b) => a.id - b.id);

  // Filtrar equipos según la búsqueda (busca en estudiantes dentro de equipos)
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return sortedTeams;

    const query = searchQuery.toLowerCase();
    return sortedTeams.filter((team) => {
      // Buscar en el número de equipo
      if (`equipo ${team.id}`.includes(query)) return true;

      // Buscar en los estudiantes del equipo
      return team.students.some((student) => {
        const id = String(student.ID).toLowerCase();
        const name = student["Nombre completo"].toLowerCase();
        const email = student["Correo electrónico"].toLowerCase();
        const subjects = student.Materias.map(m => m.subject.toLowerCase()).join(" ");

        return (
          id.includes(query) ||
          name.includes(query) ||
          email.includes(query) ||
          subjects.includes(query)
        );
      });
    });
  }, [sortedTeams, searchQuery]);

  const toggleTeam = (teamId: number) => {
    setOpenTeams((prev) => ({
      ...prev,
      [teamId]: !prev[teamId],
    }));
  };

  // Obtener todas las materias únicas de los estudiantes
  const getAllSubjects = () => {
    const subjects = new Set<string>();
    sortedTeams.forEach(team => {
      team.students.forEach(student => {
        student.Materias.forEach(materia => {
          subjects.add(materia.subject);
        });
      });
    });
    return Array.from(subjects);
  };

  const allSubjects = getAllSubjects();

  // Contar roles o materias por equipo según el modo de generación
  const getRoleCountsForTeam = (teamId: number) => {
    const team = filteredTeams.find(t => t.id === teamId);
    if (!team) return {};

    const counts: Record<string, { count: number; required: number }> = {};
    
    if (activeTab === 'roles') {
      // Contar por roles
      roles.forEach(role => {
        const count = team.students.filter(student => 
          role.subjects.some(subject => 
            student.Materias.some(m => m.subject === subject)
          )
        ).length;
        counts[role.name] = { 
          count, 
          required: role.minStudents || 2 
        };
      });
    } else {
      // Contar por materias (comportamiento original)
      selectedSubjects.forEach(subject => {
        const count = team.students.filter(student => 
          student.Materias.some(m => m.subject === subject)
        ).length;
        counts[subject] = { count, required: 2 }; // Por ahora hardcoded a 2
      });
    }

    return counts;
  };

  return (
    <div className="min-h-screen bg-figma-surface">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-figma-primary" />
            <h1 className="text-3xl font-semibold text-figma-text">Equipos</h1>
          </div>
          
          <Button 
            onClick={handleExport}
            className="bg-figma-primary hover:bg-figma-primary/90 text-white flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>

        {/* Badge de conteo */}
        <div className="mb-6 flex items-center gap-4">
          <Badge 
            variant="secondary" 
            className="bg-figma-primary text-white hover:bg-figma-primary/90 text-sm px-3 py-1"
          >
            {sortedTeams.length} equipos generados
          </Badge>

          {searchQuery && (
            <Badge 
              variant="secondary" 
              className="bg-gray-200 text-gray-700 text-sm px-3 py-1"
            >
              {filteredTeams.length} equipo{filteredTeams.length !== 1 ? 's' : ''} encontrado{filteredTeams.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar equipo, estudiante, ID, correo o materia..."
            className="max-w-lg"
          />
        </div>

        {/* Lista de equipos */}
        <div className="space-y-4">
          {filteredTeams.length > 0 ? (
            filteredTeams.map((team) => {
            const isOpen = openTeams[team.id] || false;
            const roleCounts = getRoleCountsForTeam(team.id);

            return (
              <Collapsible
                key={team.id}
                open={isOpen}
                onOpenChange={() => toggleTeam(team.id)}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-figma-text">
                        Equipo {team.id} ({team.students.length} estudiante{team.students.length !== 1 ? 's' : ''})
                      </h2>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 text-figma-text transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4">
                    {/* Badges de roles/materias */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Object.entries(roleCounts).map(([role, data]) => {
                        const isMet = data.count >= data.required;
                        const label = `${role}: ${data.count}/${data.required}`;
                        
                        return (
                          <Badge
                            key={role}
                            className={`text-xs font-medium px-2 py-1 ${
                              isMet 
                                ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200" 
                                : "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
                            }`}
                          >
                            {label}
                          </Badge>
                        );
                      })}
                    </div>

                    {/* Tabla de estudiantes */}
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-figma-muted-surface hover:bg-figma-muted-surface">
                          <TableHead className="font-semibold text-figma-text rounded-tl-lg">Identificación</TableHead>
                          <TableHead className="font-semibold text-figma-text">Nombre completo</TableHead>
                          <TableHead className="font-semibold text-figma-text">Correo electrónico</TableHead>
                          <TableHead className="font-semibold text-figma-text">Materias y grupos</TableHead>
                          <TableHead className="font-semibold text-figma-text rounded-tr-lg">Roles</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {team.students.map((student, index) => (
                          <TableRow key={student.ID || index} className="hover:bg-gray-50">
                            <TableCell className="text-figma-text">{student.ID}</TableCell>
                            <TableCell className="text-figma-text">{student["Nombre completo"]}</TableCell>
                            <TableCell className="text-figma-text">{student["Correo electrónico"]}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {student.Materias && student.Materias.length > 0 ? (
                                  student.Materias.map((materia, idx) => (
                                    <span
                                      key={idx}
                                      className="text-figma-primary text-sm"
                                    >
                                      {materia.subject}
                                      {materia.group && ` (${materia.group})`}
                                      {idx < student.Materias.length - 1 && ", "}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-400 text-sm">Sin materias</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-figma-text text-sm">Rol</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">
                No se encontraron equipos que coincidan con "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
