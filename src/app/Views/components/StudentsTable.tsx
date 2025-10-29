import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Mail } from "lucide-react";
import { Student } from "@/types";

interface StudentsTableProps {
  students: Student[];
  fileName: string | null;
  selectedSubjects: string[];
}

export const StudentsTable: React.FC<StudentsTableProps> = ({ students, fileName, selectedSubjects }) => (
  <Card className="bg-background/80 shadow-sm">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-xl">
        <Users className="text-muted-foreground" /> Listado de estudiantes ({students.length})
      </CardTitle>
      <CardDescription className="mt-1.5">
        Estudiantes cargados desde '{fileName}'. Verifica las materias seleccionadas (<Badge variant="default" className="text-xs px-1.5 py-0.5 align-middle bg-primary text-primary-foreground">color verde</Badge>).
      </CardDescription>
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
                    <Badge key={`${sg.subject}-${sg.group}`} variant={selectedSubjects.includes(sg.subject) ? "default" : "secondary"} className={selectedSubjects.includes(sg.subject) ? "text-xs bg-primary text-primary-foreground" : "text-xs"}>
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
);