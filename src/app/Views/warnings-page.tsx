"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTeamBuilder } from "@/hooks/use-team-builder";

interface WarningsPageProps {
  teamBuilderState: ReturnType<typeof useTeamBuilder>;
}

export function WarningsPage({ teamBuilderState }: WarningsPageProps) {
  const { warnings } = teamBuilderState;

  // Agrupar advertencias por tipo
  const criticalWarnings = warnings.filter(w => w.isCritical);
  const normalWarnings = warnings.filter(w => !w.isCritical);

  // Agrupar advertencias por equipo
  const warningsByTeam = warnings.reduce((acc, warning) => {
    if (warning.team !== undefined) {
      if (!acc[warning.team]) {
        acc[warning.team] = [];
      }
      acc[warning.team].push(warning);
    } else {
      if (!acc['general']) {
        acc['general'] = [];
      }
      acc['general'].push(warning);
    }
    return acc;
  }, {} as Record<string | number, typeof warnings>);

  const hasCriticalWarnings = criticalWarnings.length > 0;

  return (
    <div className="min-h-screen bg-figma-surface">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-8 h-8 text-figma-primary" />
          <h1 className="text-3xl font-semibold text-figma-text">Advertencias</h1>
        </div>

        {/* Summary badges */}
        <div className="flex gap-3 mb-6">
          <Badge 
            variant="secondary" 
            className={`text-sm px-3 py-1 ${
              hasCriticalWarnings 
                ? "bg-red-500 text-white hover:bg-red-600" 
                : "bg-figma-primary text-white hover:bg-figma-primary/90"
            }`}
          >
            {warnings.length} Advertencias
          </Badge>
          
        </div>

        {/* No warnings message */}
        {warnings.length === 0 && (
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-figma-text text-lg">No hay advertencias para mostrar</p>
              <p className="text-gray-500 text-sm mt-2">
                Los equipos se generaron sin problemas o aún no has generado equipos.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Advertencias section */}
        {warnings.length > 0 && (
          <div className="space-y-4">
            {/* Advertencias Críticas */}
            {hasCriticalWarnings && (
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-red-50 border-b border-red-200 p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="bg-red-500 text-white text-xs">
                      CRÍTICO
                    </Badge>
                    <h2 className="text-base font-semibold text-red-700">
                      Advertencias
                    </h2>
                  </div>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-200">
                    {criticalWarnings.map((warning, index) => (
                      <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1 flex-1">
                                <p className="text-sm text-gray-500 font-medium">Label</p>
                                <p className="text-sm text-figma-text">{warning.message}</p>
                              </div>
                              {warning.team && (
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-500 font-medium">Text</p>
                                  <p className="text-sm text-figma-text">Equipo {warning.team}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Advertencias Normales */}
            {normalWarnings.length > 0 && (
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-yellow-50 border-b border-yellow-200 p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-figma-primary text-white text-xs">
                      AVISO
                    </Badge>
                    <h2 className="text-base font-semibold text-yellow-700">
                      Advertencias
                    </h2>
                  </div>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-200">
                    {normalWarnings.map((warning, index) => (
                      <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1 flex-1">
                                <p className="text-sm text-gray-500 font-medium">Label</p>
                                <p className="text-sm text-figma-text">{warning.message}</p>
                              </div>
                              {warning.team && (
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-500 font-medium">Text</p>
                                  <p className="text-sm text-figma-text">Equipo {warning.team}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
