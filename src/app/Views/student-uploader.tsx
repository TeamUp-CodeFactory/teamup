
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { FileUp, Upload } from "lucide-react";
import { cn } from "@/lib/utils";


interface StudentUploadProps{
    fileName: string | null;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}



export  function StudentUploader({fileName,handleFileUpload}:StudentUploadProps){

    return(
      <Card className="w-full max-w-3xl rounded-co bg-figma-muted-surface border-none shadow-none">
        <CardContent className="p-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload" className={cn(
              "flex items-center justify-center w-full min-h-[128px] max-h-[256px] px-4 py-8 transition bg-white border border-dashed rounded-ci appearance-none cursor-pointer hover:border-figma-primary focus:outline-none",
              fileName ? "border-figma-primary bg-figma-primary/5" : "border-gray-300"
            )}>
              <span className="flex items-center gap-2 text-center">
                <Upload className="w-6 h-6 text-figma-primary flex-shrink-0" />
                <span className="text-sm leading-5 text-figma-text">
                  {fileName ? `• • • ${fileName}`: 'Haz clic o arrastra para cargar un archivo'}
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
            <div className="w-full flex items-center justify-end">
              <p className="text-xs tracking-wide leading-4 text-right text-muted-foreground">
                Carga un archivo en formato .xlsx
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );

}