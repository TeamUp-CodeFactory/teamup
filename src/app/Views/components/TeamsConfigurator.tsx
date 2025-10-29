import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@radix-ui/react-radio-group";
import { Settings, Shuffle } from "lucide-react";

import type { MinStudentMode } from '@/types';

interface TeamsConfiguratorProps {
  numberOfTeams: number;
  handleNumberOfTeamsChange: (value: number) => void;
  allSubjectsFromFile: string[];
  selectedSubjects: string[];
  handleSubjectToggle: (value: string) => void;
  minMode: MinStudentMode;
  setMinMode: (value: MinStudentMode) => void;
  minStudentsPerSubject: number;
  handleGlobalMinChange: (value: number) => void;
  individualMinStudents: Record<string, number>;
  handleIndividualMinChange: (subject: string, value: number) => void;
  studentsLength: number;
  handleAssignTeams: () => void;
}

export const TeamsConfigurator: React.FC<TeamsConfiguratorProps> = ({
  numberOfTeams,
  handleNumberOfTeamsChange,
  allSubjectsFromFile,
  selectedSubjects,
  handleSubjectToggle,
  minMode,
  setMinMode,
  minStudentsPerSubject,
  handleGlobalMinChange,
  individualMinStudents,
  handleIndividualMinChange,
  studentsLength,
  handleAssignTeams
}) => (
  <Card className="shadow-sm">
    <CardHeader>
      <CardTitle className="text-lg font-semibold flex items-center gap-2">
        <Settings className="text-primary" /> Configurar equipos
      </CardTitle>
      <CardDescription className="text-sm text-muted-foreground">Define cómo se conformarán los equipos.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6 no-scrollbar">
      {/* Number of Teams */}
      <div className="space-y-2">
        <Label htmlFor="num-teams" className="font-semibold block mb-2">Cantidad máxima de equipos</Label>
        <Input
          id="num-teams"
          type="number"
          min="1"
          value={numberOfTeams}
          onChange={e => handleNumberOfTeamsChange(parseInt(e.target.value))}
          placeholder="Ej: 5"
          className="form-input"
        />
      </div>
      {/* Subjects to Consider */}
      <div className="space-y-2">
        <Label className="font-semibold block mb-2">Materias a considerar</Label>
        <div className="space-y-1 rounded-md border p-2 bg-background">
          {allSubjectsFromFile.length > 0 ? allSubjectsFromFile.map(subject => (
            <div key={subject} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`subject-${subject}`}
                checked={selectedSubjects.includes(subject)}
                onChange={() => handleSubjectToggle(subject)}
                className="form-checkbox h-4 w-4 text-primary border-muted-foreground rounded focus:ring-primary cursor-pointer"
              />
              <Label htmlFor={`subject-${subject}`} className="text-sm font-normal cursor-pointer">
                {subject}
              </Label>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">No hay materias detectadas en el archivo.</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Marca las materias que deben estar presentes en cada equipo.</p>
      </div>
      {/* Minimum Students Configuration */}
      <div className="space-y-3">
        <Label className="font-semibold block mb-2">Mínimo de estudiantes por materia</Label>
        <RadioGroup value={minMode} onValueChange={setMinMode} className="mb-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="global" id="min-global" />
            <Label htmlFor="min-global" className="font-normal">Valor global</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="individual" id="min-individual" />
            <Label htmlFor="min-individual" className="font-normal">Valor por materia</Label>
          </div>
        </RadioGroup>
        {minMode === 'global' && (
          <div className="space-y-2 mt-1">
            <p className="text-xs text-muted-foreground mb-2">Define el mínimo para todas las materias seleccionadas:</p>
            <Input
              id="min-students-global"
              type="number"
              min="1"
              value={minStudentsPerSubject}
              onChange={e => handleGlobalMinChange(parseInt(e.target.value))}
              placeholder="Ej: 1"
              className="form-input"
            />
            <p className="text-xs text-muted-foreground">Cada equipo intentará incluir mínimo este número de estudiantes para cada materia considerando su grupo.</p>
          </div>
        )}
        {minMode === 'individual' && (
          <div className="space-y-2 mt-1">
            <p className="text-xs text-muted-foreground mb-2">Define el mínimo para cada materia seleccionada:</p>
            <div className="w-full rounded-md border p-2 bg-background space-y-2">
              {selectedSubjects.length > 0 ? selectedSubjects.map(subject => (
                <div key={subject} className="flex items-center justify-between space-x-2">
                  <Label htmlFor={`min-${subject}`} className="text-sm flex-1 truncate">{subject}</Label>
                  <Input
                    id={`min-${subject}`}
                    type="number"
                    min="1"
                    value={individualMinStudents[subject] ?? 1}
                    onChange={e => handleIndividualMinChange(subject, parseInt(e.target.value))}
                    className="form-input w-20 h-8 text-sm"
                    placeholder="1"
                  />
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">Selecciona materias primero.</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Cada equipo intentará incluir mínimo este número de estudiantes para cada materia considerando su grupo.</p>
          </div>
        )}
      </div>
    </CardContent>
    <CardFooter>
      <Button onClick={handleAssignTeams} disabled={studentsLength === 0 || selectedSubjects.length === 0} className="flex items-center gap-2 w-full">
        <Shuffle className="h-4 w-4" /> Generar equipos
      </Button>
    </CardFooter>
  </Card>
);