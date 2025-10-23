
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { FileUp } from "lucide-react";
import { cn } from "@/lib/utils";


interface StudentUploadProps{
    fileName: string | null;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}



export  function StudentUploader({fileName,handleFileUpload}:StudentUploadProps){

    return(
            <Card className="shadow-sm  w-full md:w-2/3 mx-auto shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold flex items-center justify-center gap-2 text-center">
                  Bienvenid@ ¡Comencemos!
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground text-center">
                  Para empezar debes cargar un archivo de Excel con el listado de estudiantes. Asegúrate que contenga las siguientes columnas: ID, Nombre completo, Correo electrónico, Materias y Grupos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="file-upload" className={cn(
                    "flex items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-border border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none",
                    fileName && "border-primary bg-primary/10"
                  )}>
                    <span className="flex items-center space-x-2 text-center">
                      <FileUp className="h-6 w-6 " />
                      <span className="font-medium text-foreground">
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
                  <p className="text-xs text-center text-muted-foreground mt-1">
                    Solo se permiten archivos .xlsx
                  </p>
                </div>
              </CardContent>
            </Card>
    );

}