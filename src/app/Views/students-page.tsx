"use client";

import { useState, useMemo } from "react";
import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

interface StudentsPageProps {
  teamBuilderState: ReturnType<typeof useTeamBuilder>;
}

export function StudentsPage({ teamBuilderState }: StudentsPageProps) {
  const { students } = teamBuilderState;
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrar estudiantes según la búsqueda
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;

    const query = searchQuery.toLowerCase();
    return students.filter((student) => {
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
  }, [students, searchQuery]);

  return (
    <div className="min-h-screen bg-figma-surface">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <GraduationCap className="w-8 h-8 text-figma-primary" />
          <h1 className="text-3xl font-semibold text-figma-text">Estudiantes</h1>
        </div>

        {/* Badge de conteo */}
        <div className="mb-6 flex items-center gap-4">
          <Badge 
            variant="secondary" 
            className="bg-figma-primary text-white hover:bg-figma-primary/90 text-sm px-3 py-1"
          >
            {students.length} estudiantes detectados
          </Badge>
          
          {searchQuery && (
            <Badge 
              variant="secondary" 
              className="bg-gray-200 text-gray-700 text-sm px-3 py-1"
            >
              {filteredStudents.length} resultado{filteredStudents.length !== 1 ? 's' : ''} encontrado{filteredStudents.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar por nombre, ID, correo o materia..."
            className="max-w-md"
          />
        </div>

        {/* Tabla de estudiantes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-figma-text">Identificador</TableHead>
                <TableHead className="font-semibold text-figma-text">Nombre completo</TableHead>
                <TableHead className="font-semibold text-figma-text">Correo electrónico</TableHead>
                <TableHead className="font-semibold text-figma-text">Materias y grupos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <TableRow key={student.ID || index} className="hover:bg-gray-50">
                    <TableCell className="text-figma-text">{student.ID || "Text"}</TableCell>
                    <TableCell className="text-figma-text">{student["Nombre completo"] || "Text"}</TableCell>
                    <TableCell className="text-figma-text">{student["Correo electrónico"] || "Text"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.Materias && student.Materias.length > 0 ? (
                          student.Materias.map((subjectGroup, idx) => (
                            <span
                              key={idx}
                              className="text-figma-primary text-sm bg-transparent"
                            >
                              {subjectGroup.subject}
                              {subjectGroup.group && ` (${subjectGroup.group})`}
                              {idx < student.Materias.length - 1 && ", "}
                            </span>
                          ))
                        ) : (
                          <span className="text-figma-primary text-sm">Materia (Grupo)</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No se encontraron estudiantes que coincidan con "{searchQuery}"
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
