import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent,} from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Download } from "lucide-react";

import { Team, Student } from "@/types";
import { Button } from "@/components/ui/button";
import { countStudentsWithSubject, getConfiguredSubjectMinimum } from '@/lib/teams/utils';

import type { MinStudentMode } from '@/types';
interface TeamsDisplayProps {
  generatedTeams: Team[];
  selectedSubjects: string[];
  handleExport: () => void;
  minMode: MinStudentMode;
  minStudentsPerSubject: number;
  individualMinStudents: Record<string, number>;
}

export const TeamsDisplay: React.FC<TeamsDisplayProps> = ({
  generatedTeams,
  selectedSubjects,
  handleExport,
  minMode,
  minStudentsPerSubject,
  individualMinStudents
}) => {
  // Helper to get the minimum for a subject
  const getDisplayMinimumForSubject = (subject: string) =>
    getConfiguredSubjectMinimum(subject, minMode, minStudentsPerSubject, individualMinStudents);

  return (
  <Card className="bg-background/80 shadow-sm">
    <CardHeader className="flex flex-row justify-between">
      <div>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Users className="text-muted-foreground" /> Equipos generados ({generatedTeams.length})
        </CardTitle>
        <CardDescription className="mt-1.5">Revisa la conformación de los equipos y la información de los estudiantes.</CardDescription>
      </div>
      <Button onClick={handleExport} variant="outline" size="sm" className="flex items-center gap-1 ml-2 hover:bg-primary/10 hover:text-primary">
        <Download className="h-4 w-4" /> Exportar
      </Button>
    </CardHeader>
    <CardContent className="space-y-4 pt-0">
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
                    <span key={`${subj}-count`} className={
                      isCriticallyMissing ? "font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                        : isMet ? "font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                          : isPresent ? "font-medium px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                            : "font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    }>
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
  );
};