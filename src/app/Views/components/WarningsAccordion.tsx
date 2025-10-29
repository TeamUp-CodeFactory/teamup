import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@radix-ui/react-accordion";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AssignmentWarning } from "@/types";

interface WarningsAccordionProps {
  warnings: AssignmentWarning[];
}

export const WarningsAccordion: React.FC<WarningsAccordionProps> = ({ warnings }) => (
  <Card className="shadow-sm">
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="warnings" className="border-none">
        <CardHeader className={
          warnings.some(w => w.isCritical)
            ? "p-4 rounded-t-lg bg-destructive/10"
            : "p-4 rounded-t-lg bg-yellow-50 dark:bg-yellow-900/30"
        }>
          <AccordionTrigger className="p-0 hover:no-underline [&[data-state=open]>svg]:rotate-180">
            <div className="flex items-center flex-1">
              <AlertTriangle className={
                warnings.some(w => w.isCritical)
                  ? "h-5 w-5 text-destructive"
                  : "h-5 w-5 text-yellow-600 dark:text-yellow-400"
              } />
              <CardTitle className={
                warnings.some(w => w.isCritical)
                  ? "text-lg pl-2 mb-0 text-destructive"
                  : "text-lg pl-2 mb-0 text-yellow-800 dark:text-yellow-300"
              }>
                Advertencias y errores ({warnings.length})
                {warnings.some(w => w.isCritical) && " - ¡CRÍTICO!"}
              </CardTitle>
            </div>
          </AccordionTrigger>
        </CardHeader>
        <AccordionContent className="border border-t-0 rounded-b-lg p-4">
          <ul className="list-disc pl-5 space-y-1 mt-2">
            {warnings.map((warning, index) => (
              <li key={index} className={
                warning.isCritical
                  ? "text-sm font-semibold text-destructive dark:text-red-300"
                  : "text-sm"
              }>
                {warning.isCritical && <Badge variant="destructive" className="mr-1.5 text-xs px-1 py-0 align-middle">CRÍTICO</Badge>}
                {warning.message}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Estos detalles también se incluirán al exportar los datos.</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </Card>
);