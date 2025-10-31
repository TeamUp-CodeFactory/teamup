"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings, Upload, FileUp, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTeamBuilder, Role } from '@/hooks/use-team-builder';
import { Toaster } from "@/components/ui/toaster";

interface TeamConfiguratorProps {
  teamBuilderState: ReturnType<typeof useTeamBuilder>;
}

export function TeamConfigurator({ teamBuilderState }: TeamConfiguratorProps) {
  const {
    students,
    fileName,
    allSubjectsFromFile,
    selectedSubjects,
    minStudentsPerSubject,
    numberOfTeams,
    error,
    minMode,
    individualMinStudents,
    roles,
    activeTab,
    setActiveTab,
    handleFileUpload,
    handleAssignTeams,
    handleClearData,
    handleNumberOfTeamsChange,
    handleSubjectToggle,
    handleIndividualMinChange,
    handleGlobalMinChange,
    setMinMode,
    handleAddRole,
    handleDeleteRole,
  } = teamBuilderState;

  // Estados locales solo para el formulario de roles
  const [currentRoleName, setCurrentRoleName] = useState("");
  const [currentRoleSubjects, setCurrentRoleSubjects] = useState<string[]>([]);
  const [currentRoleMinStudents, setCurrentRoleMinStudents] = useState<number | undefined>(undefined);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);

  const handleSaveRole = () => {
    if (!currentRoleName.trim()) return;
    
    handleAddRole(currentRoleName, currentRoleSubjects, currentRoleMinStudents, editingRoleId);
    
    // Limpiar formulario
    setCurrentRoleName("");
    setCurrentRoleSubjects([]);
    setCurrentRoleMinStudents(undefined);
    setEditingRoleId(null);
  };

  const handleEditRole = (role: Role) => {
    setEditingRoleId(role.id);
    setCurrentRoleName(role.name);
    setCurrentRoleSubjects(role.subjects);
    setCurrentRoleMinStudents(role.minStudents);
  };

  const handleCancelEdit = () => {
    setEditingRoleId(null);
    setCurrentRoleName("");
    setCurrentRoleSubjects([]);
    setCurrentRoleMinStudents(undefined);
  };

  const handleDeleteRoleLocal = (id: number) => {
    handleDeleteRole(id);
    // Si estamos editando el rol que se está borrando, cancelar la edición
    if (editingRoleId === id) {
      handleCancelEdit();
    }
  };

  const handleToggleRoleSubject = (subject: string) => {
    if (currentRoleSubjects.includes(subject)) {
      setCurrentRoleSubjects(currentRoleSubjects.filter((s) => s !== subject));
    } else {
      setCurrentRoleSubjects([...currentRoleSubjects, subject]);
    }
  };

  // Calcular materias disponibles (excluir las ya asignadas a otros roles)
  const getAvailableSubjects = () => {
    // Obtener todas las materias asignadas a roles existentes, excepto el rol que se está editando
    const assignedSubjects = roles
      .filter(role => role.id !== editingRoleId) // Excluir el rol actual si se está editando
      .flatMap(role => role.subjects);
    
    // Retornar solo las materias que no están asignadas
    return allSubjectsFromFile.filter(subject => !assignedSubjects.includes(subject));
  };

  const availableSubjects = getAvailableSubjects();

  return (
    <div className="w-full min-h-screen bg-figma-surface">
      <Toaster />
      
      {/* Header con título */}
      <div className="p-8 md:px-16 md:pt-8 md:pb-4">
        <div className="flex items-center gap-4">
          <Settings className="w-12 h-12 text-figma-primary" />
          <h1 className="text-[35px] font-bold tracking-tight text-figma-primary">Configurar equipos</h1>
        </div>
      </div>

      {/* Botón fijo en la esquina superior derecha - Ajustado para la sidebar */}
      <div className="fixed top-4 right-8 z-50" style={{ marginLeft: '280px' }}>
        <Button 
          onClick={handleAssignTeams}
          className="bg-figma-primary hover:bg-figma-primary/90 text-white h-12 px-6 shadow-lg"
          disabled={
            !fileName || 
            numberOfTeams < 1 || 
            (activeTab === "subjects" && selectedSubjects.length === 0) ||
            (activeTab === "roles" && roles.filter(r => r.subjects.length > 0).length === 0)
          }
        >
          <Upload className="w-5 h-5 mr-3" />
          Generar equipos
        </Button>
      </div>

      {/* Content */}
      <div className="p-8 md:px-16 md:pt-2 md:pb-16">

      {/* Tabs */}
      <div className="mb-3">
        <div className="flex gap-0 border-b border-gray-300">
          <button 
            onClick={() => setActiveTab("roles")}
            className={`px-2 py-2 text-sm font-medium relative ${
              activeTab === "roles" 
                ? "text-figma-text" 
                : "text-muted-foreground hover:text-figma-text"
            }`}
          >
            <div className="px-2 py-1 rounded-sm">
              Asignar por roles
            </div>
            {activeTab === "roles" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-figma-primary" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab("subjects")}
            className={`px-2 py-2 text-sm font-medium relative ${
              activeTab === "subjects" 
                ? "text-figma-text" 
                : "text-muted-foreground hover:text-figma-text"
            }`}
          >
            <div className="px-2 py-1 rounded-sm">
              Asignar por materias
            </div>
            {activeTab === "subjects" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-figma-primary" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Cargar estudiantes */}
          <Card className="rounded-2xl bg-figma-muted-surface border-none">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Upload className="w-6 h-6 text-figma-text" />
                <h3 className="text-xl font-medium text-figma-text">Cargar estudiantes</h3>
              </div>
              
              {!fileName ? (
                <>
                  <Label 
                    htmlFor="file-upload-config" 
                    className="block w-full rounded border border-dashed border-gray-300 bg-white text-center text-sm text-muted-foreground py-2 px-2 cursor-pointer hover:border-figma-primary transition-colors"
                  >
                    Cargar archivo
                    <Input
                      id="file-upload-config"
                      type="file"
                      accept=".xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground text-right">
                    Carga un archivo en formato .XLSX
                  </p>
                </>
              ) : (
                <>
                  <div className="w-full rounded border border-figma-primary bg-figma-primary/5 text-center text-sm py-2 px-2">
                    <div className="flex items-center justify-center gap-2">
                      <FileUp className="w-4 h-4 text-figma-primary" />
                      <span className="text-figma-text font-medium">{fileName}</span>
                    </div>
                  </div>
                  <p className="text-xs text-figma-primary text-right">
                    Archivo cargado correctamente
                  </p>
                  <Button 
                    onClick={handleClearData}
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500 hover:bg-red-50 h-8 w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpiar datos
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cantidad máxima de equipos */}
          <div className="space-y-2">
            <Label htmlFor="team-count" className="text-sm font-medium text-figma-text">
              Cantidad máxima de equipos
            </Label>
            <Input
              id="team-count"
              type="number"
              min="1"
              value={numberOfTeams}
              onChange={(e) => handleNumberOfTeamsChange(Number(e.target.value))}
              placeholder="Ingresa el número de equipos"
              className="rounded bg-figma-muted-surface border-gray-400"
            />
          </div>

          {/* Tipo de mínimo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-figma-text">
              Tipo de mínimo
            </Label>
            <RadioGroup 
              value={minMode} 
              onValueChange={(value) => setMinMode(value as "global" | "individual")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="global" id="global-min" />
                <Label htmlFor="global-min" className="text-sm font-normal cursor-pointer">
                  Mínimo global
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual-min" />
                <Label htmlFor="individual-min" className="text-sm font-normal cursor-pointer">
                  Mínimo por {activeTab === "roles" ? "rol" : "materia"}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Mínimo de estudiantes por rol/materia - Global */}
          {minMode === "global" && (
            <div className="space-y-2">
              <Label htmlFor="min-students-global" className="text-sm font-medium text-figma-text">
                Mínimo de estudiantes por {activeTab === "roles" ? "rol" : "materia"}
              </Label>
              <Input
                id="min-students-global"
                type="number"
                min="1"
                value={minStudentsPerSubject}
                onChange={(e) => handleGlobalMinChange(Number(e.target.value))}
                placeholder="Ingresa el mínimo de estudiantes"
                className="rounded bg-figma-muted-surface border-gray-400"
              />
              <p className="text-xs text-muted-foreground">
                Cada equipo intentará incluir mínimo esta cantidad de estudiantes por {activeTab === "roles" ? "rol" : "materia"}.
              </p>
            </div>
          )}

          {/* Roles List (Left Column) */}
          {activeTab === "roles" && roles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-figma-text" />
                <h3 className="text-xl font-medium text-figma-text">Roles</h3>
              </div>
              <div className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`rounded-lg flex items-center p-3 transition-colors ${
                      editingRoleId === role.id 
                        ? "bg-figma-primary/10 border-2 border-figma-primary" 
                        : "bg-figma-muted-surface"
                    }`}
                  >
                    <div className="flex-1">
                      <span className="text-sm text-figma-text block font-medium">{role.name}</span>
                      {role.subjects.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {role.subjects.length} {role.subjects.length === 1 ? 'materia' : 'materias'}
                        </span>
                      )}
                      {minMode === "individual" && role.minStudents && (
                        <span className="text-xs text-muted-foreground ml-2">· Mín: {role.minStudents}</span>
                      )}
                    </div>
                    <button 
                      onClick={() => handleEditRole(role)}
                      className="w-12 h-12 rounded-lg hover:bg-figma-surface flex items-center justify-center transition-colors"
                      title="Editar rol"
                    >
                      <Pencil className="w-5 h-5 text-figma-primary" />
                    </button>
                    <button 
                      onClick={() => handleDeleteRoleLocal(role.id)}
                      className="w-12 h-12 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                      title="Eliminar rol"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {activeTab === "roles" && (
            <>
              {/* Configurar roles */}
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-figma-text" />
                <h3 className="text-xl font-medium text-figma-text">
                  {editingRoleId !== null ? "Editar rol" : "Configurar roles"}
                </h3>
                {editingRoleId !== null && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="border-gray-400 text-gray-600 hover:bg-gray-100 h-8 ml-auto"
                  >
                    Cancelar
                  </Button>
                )}
              </div>

              {/* Nombre del rol */}
              <div className="space-y-2">
                <Label htmlFor="role-name" className="text-sm font-medium text-figma-text">
                  Nombre del rol
                </Label>
                <Input
                  id="role-name"
                  type="text"
                  value={currentRoleName}
                  onChange={(e) => setCurrentRoleName(e.target.value)}
                  placeholder="Ingresa el nombre del rol"
                  className="rounded bg-figma-muted-surface border-gray-400"
                />
              </div>

              {/* Materias que cubren el rol */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-figma-text">
                  Materias que cubren el rol
                </Label>
                <p className="text-xs text-muted-foreground">
                  Estas materias se asignarán exclusivamente a este rol y no estarán disponibles para otras asignaciones.
                </p>
                {availableSubjects.length > 0 ? (
                  <div className="space-y-2">
                    {availableSubjects.map((subject) => (
                      <div key={subject} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`role-subject-${subject}`}
                          checked={currentRoleSubjects.includes(subject)}
                          onChange={() => handleToggleRoleSubject(subject)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <Label 
                          htmlFor={`role-subject-${subject}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {subject}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {allSubjectsFromFile.length === 0 
                      ? "No hay materias disponibles. Carga un archivo primero."
                      : "Todas las materias ya han sido asignadas a otros roles."}
                  </p>
                )}
              </div>

              {/* Mínimo de estudiantes (solo si está en modo individual) */}
              {minMode === "individual" && (
                <div className="space-y-2">
                  <Label htmlFor="role-min-students" className="text-sm font-medium text-figma-text">
                    Mínimo de estudiantes
                  </Label>
                  <Input
                    id="role-min-students"
                    type="number"
                    min="1"
                    value={currentRoleMinStudents || ""}
                    onChange={(e) => setCurrentRoleMinStudents(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ingresa el mínimo de estudiantes"
                    className="rounded bg-figma-muted-surface border-gray-400"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cada equipo intentará incluir mínimo esta cantidad de estudiantes para este rol.
                  </p>
                </div>
              )}

              {/* Botón Guardar */}
              <Button 
                onClick={handleSaveRole}
                disabled={!currentRoleName.trim() || currentRoleSubjects.length === 0}
                className="bg-figma-primary hover:bg-figma-primary/90 text-white h-8"
              >
                <Upload className="w-4 h-4 mr-2" />
                {editingRoleId !== null ? "Actualizar rol" : "Guardar rol"}
              </Button>
            </>
          )}

          {activeTab === "subjects" && (
            <Card className="rounded-2xl bg-figma-muted-surface border-none">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-xl font-medium text-figma-text">
                  {minMode === "individual" ? "Materias a considerar" : "Materias disponibles"}
                </h3>
                
                {allSubjectsFromFile.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {minMode === "individual" && (
                      <div className="flex items-center justify-end mb-2">
                        <span className="text-xs text-muted-foreground font-medium">Mínimo</span>
                      </div>
                    )}
                    {allSubjectsFromFile.map((subject) => (
                      <div key={subject} className="flex items-center space-x-2 p-2 hover:bg-figma-surface rounded">
                        <input
                          type="checkbox"
                          id={`subject-${subject}`}
                          checked={selectedSubjects.includes(subject)}
                          onChange={() => handleSubjectToggle(subject)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <Label 
                          htmlFor={`subject-${subject}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {subject}
                        </Label>
                        {minMode === "individual" && (
                          <Input
                            type="number"
                            min="1"
                            value={individualMinStudents[subject] || minStudentsPerSubject}
                            onChange={(e) => handleIndividualMinChange(subject, Number(e.target.value))}
                            className="w-16 h-8 text-xs rounded bg-white border-gray-400 text-center"
                            placeholder="Min"
                            disabled={!selectedSubjects.includes(subject)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay materias disponibles. Carga un archivo primero.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Error messages */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      </div>
    </div>
  );
}
