import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@radix-ui/react-label";
import { File, FileUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  fileName: string | null;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleClearData: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ fileName, handleFileUpload, handleClearData }) => (
  <Card className="shadow-sm">
    <CardHeader>
      <CardTitle className="text-lg font-semibold flex items-center gap-2">
        <File className="text-accent" />
        Cargar archivo
      </CardTitle>
      <CardDescription className="text-sm text-muted-foreground">
        Selecciona un archivo de Excel con el listado de estudiantes.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Label htmlFor="file-upload" className={cn(
          "flex items-center justify-center w-full h-20 px-4 transition bg-background border-2 border-border border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none",
          fileName && "border-primary bg-primary/10"
        )}>
          <span className="flex items-center space-x-2 text-center">
            <FileUp className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground text-sm">
              {fileName ? `${fileName}` : 'Haz clic o arrastra para subir un archivo'}
            </span>
          </span>
          <Input
            id="file-upload"
            type="file"
            accept=".xlsx"
            onChange={handleFileUpload}
            className="sr-only"
          />
        </Label>
        <p className="text-xs text-end text-muted-foreground mt-1">
          Solo se permiten archivos .xlsx
        </p>
        <Button variant="outline" size="sm" onClick={handleClearData} className="w-full flex items-center gap-1 hover:bg-primary/10 hover:text-primary">
          <Trash2 className="w-4 h-4" /> Limpiar datos
        </Button>
      </div>
    </CardContent>
  </Card>
);