import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileUploader } from "./components/FileUploader";
import { TeamsConfigurator } from "./components/TeamsConfigurator";
import { StudentsTable } from "./components/StudentsTable";
import { TeamsDisplay } from "./components/TeamsDisplay";
import { WarningsAccordion } from "./components/WarningsAccordion";
import { Student, Team, AssignmentWarning } from "@/types";
import type { MinStudentMode } from '@/types';

interface StudentsMainLayoutProps {
  fileName: string | null;
  error: string | null;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  students: Student[];
  numberOfTeams: number;
  handleNumberOfTeamsChange: (value: number) => void;
  handleClearData: () => void;
  handleSubjectToggle: (value: string) => void;
  generatedTeams: Team[];
  allSubjectsFromFile: string[];
  selectedSubjects: string[];
  minMode: MinStudentMode;
  setMinMode: (value: MinStudentMode) => void;
  handleExport: () => void;
  minStudentsPerSubject: number;
  individualMinStudents: Record<string, number>;
  handleGlobalMinChange: (value: number) => void;
  handleIndividualMinChange: (subject: string, value: number) => void;
  setGeneratedTeams: (teams: Team[]) => void;
  setWarnings: (warnings: AssignmentWarning[]) => void;
  setError: (error: string | null) => void;
  handleAssignTeams: () => void;
  warnings: AssignmentWarning[];
  unassignedStudents: Student[];
}

export function StudentsMainLayout (props: StudentsMainLayoutProps) {
  const {
    handleExport,
    setMinMode,
    minMode,
    selectedSubjects,
    allSubjectsFromFile,
    generatedTeams,
    handleSubjectToggle,
    fileName,
    error,
    handleFileUpload,
    students,
    numberOfTeams,
    handleNumberOfTeamsChange,
    handleClearData,
    minStudentsPerSubject,
    individualMinStudents,
    handleGlobalMinChange,
    handleIndividualMinChange,
    handleAssignTeams,
    warnings,
  // getDisplayMinimumForSubject and countStudentsWithSubject removed

  } = props;



  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Columna de configuración */}
      <div className="md:col-span-1 space-y-6">
        <FileUploader
          fileName={fileName}
          handleFileUpload={handleFileUpload}
          handleClearData={handleClearData}
        />
        <TeamsConfigurator
          numberOfTeams={numberOfTeams}
          handleNumberOfTeamsChange={handleNumberOfTeamsChange}
          allSubjectsFromFile={allSubjectsFromFile}
          selectedSubjects={selectedSubjects}
          handleSubjectToggle={handleSubjectToggle}
          minMode={minMode}
          setMinMode={setMinMode}
          minStudentsPerSubject={minStudentsPerSubject}
          handleGlobalMinChange={handleGlobalMinChange}
          individualMinStudents={individualMinStudents}
          handleIndividualMinChange={handleIndividualMinChange}
          studentsLength={students.length}
          handleAssignTeams={handleAssignTeams}
        />
      </div>

      {/* Columna de resultados */}
      <div className="md:col-span-2 space-y-6">
        {/* Error global */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Advertencias y errores */}
        {warnings.length > 0 && generatedTeams.length > 0 && (
          <WarningsAccordion warnings={warnings} />
        )}
        {/* Tabla de estudiantes */}
        {students.length > 0 && generatedTeams.length === 0 && (
          <StudentsTable
            students={students}
            fileName={fileName}
            selectedSubjects={selectedSubjects}
          />
        )}
        {/* Equipos generados */}
        {generatedTeams.length > 0 && (
          <TeamsDisplay
            generatedTeams={generatedTeams}
            selectedSubjects={selectedSubjects}
            handleExport={handleExport}
            minMode={minMode}
            minStudentsPerSubject={minStudentsPerSubject}
            individualMinStudents={individualMinStudents}
          />
        )}
      </div>
    </div>
  );

    
}