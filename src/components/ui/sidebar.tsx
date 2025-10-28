import * as React from "react";
import { Container } from "@/components/ui/container";
import { Settings, Users,AlertCircle, Package, Info, GraduationCap, Gauge, FileDown } from "lucide-react";
import TeamUpLogo from '@/components/icons/TeamUpLogo';

interface SidebarProps {
    children?: React.ReactNode;
    onDownloadTemplate?: () => void;
    onExportTeams?: () => void;
    hasStudents?: boolean;
    hasTeams?: boolean;
    currentPage?: string;
    onNavigate?: (page: string) => void;
}

export function Sidebar({ children, onDownloadTemplate, onExportTeams, hasStudents, hasTeams, currentPage = "inicio", onNavigate }: SidebarProps) {

    return (
        <Container className="w-[var(--sidebar-width)] h-screen
    flex flex-col items-center justify-between 
     shadow-xl border-none bg-figma-primary text-figma-text
    ">
    <div className="w-full h-full relative flex flex-col items-center justify-between py-16 px-0 box-border gap-6 text-left text-lg">

            {/* logo (centered) */}
            <div className="w-full flex items-center justify-center py-6">
                <div className="relative max-w-full overflow-hidden w-[252px] h-[45.8px]">
                    <TeamUpLogo className="w-full h-full text-figma-surface" />
                </div>
            </div>
            <nav className="self-stretch flex flex-col gap-4 px-6 z-[1] flex-1 justify-center">
                <div className="self-stretch flex flex-col items-start">
                    <button
                        onClick={() => onNavigate?.("inicio")}
                        className={`self-stretch h-12 rounded-[8px] flex items-center py-0 px-4 box-border gap-3 ${currentPage === "inicio" ? "bg-figma-team-bg text-figma-text" : "hover:bg-figma-primary/10 text-figma-surface"}`}
                    >
                        {!hasStudents ?(
                            <><Users className="w-5 h-5" /><div className="relative tracking-[-0.04px] leading-[26px] font-medium">Crear equipos</div></>
                        ):(
                        <><Settings className="w-5 h-5" /><div className="relative tracking-[-0.04px] leading-[26px] font-medium">Configurar equipos</div></>
                        )}
                    </button>
                </div>

                {hasStudents && (
                    <div className="self-stretch flex flex-col items-start">
                        <button
                            onClick={() => onNavigate?.("estudiantes")}
                            className={`self-stretch h-12 rounded-[8px] flex items-center py-0 px-4 box-border gap-3 ${currentPage === "estudiantes" ? "bg-figma-team-bg text-figma-text" : "hover:bg-figma-primary/10 text-figma-surface"}`}
                        >
                            <GraduationCap className="w-5 h-5" />
                            <div className="relative tracking-[-0.04px] leading-[26px] font-medium">Estudiantes</div>
                        </button>
                    </div>
                )}
                {hasStudents && (
                    <div className="self-stretch flex flex-col items-start">
                        <button
                            onClick={() => onNavigate?.("dashboard")}
                            className={`self-stretch h-12 rounded-[8px] flex items-center py-0 px-4 box-border gap-3 ${currentPage === "dashboard" ? "bg-figma-team-bg text-figma-text" : "hover:bg-figma-primary/10 text-figma-surface"}`}
                    >
                        <Gauge className="w-5 h-5" />
                        <div className="relative tracking-[-0.04px] leading-[26px] font-medium">Dashboard</div>
                    </button>
                </div>)}

                {hasTeams && (
                  <div className="self-stretch flex flex-col items-start">
                      <div className="self-stretch flex flex-col items-start">
                          <button
                              onClick={() => onNavigate?.("equipos")}
                              className={`self-stretch h-12 rounded-[8px] flex items-center py-0 px-4 box-border gap-3 ${currentPage === "equipos" ? "bg-figma-team-bg text-figma-text" : "hover:bg-figma-primary/10 text-figma-surface"}`}
                          >
                              <Users className="w-5 h-5" />
                              <div className="relative tracking-[-0.04px] leading-[26px] font-medium">Equipos</div>
                          </button>

                          <button
                              onClick={() => onNavigate?.("advertencias")}
                              className={`self-stretch h-12 rounded-[8px] flex items-center py-0 px-4 box-border gap-3 ${currentPage === "advertencias" ? "bg-figma-team-bg text-figma-text" : "hover:bg-figma-primary/10 text-figma-surface"}`}
                          >
                              <AlertCircle className="w-5 h-5" />
                              <div className="relative tracking-[-0.04px] leading-[26px] font-medium">Advertencias</div>
                          </button>

                          <button
                              onClick={() => onExportTeams?.()}
                              className={`self-stretch h-12 rounded-[8px] flex items-center py-0 px-4 box-border gap-3 hover:bg-figma-primary/10 text-figma-surface`}
                          >
                              <Package className="w-5 h-5" />
                              <div className="relative tracking-[-0.04px] leading-[26px] font-medium">Exportar</div>
                          </button>
                      </div>
                  </div>
                )}

                <div className="self-stretch flex flex-col items-start">
                    <button
                        onClick={() => onDownloadTemplate?.()}
                        className={`self-stretch h-12 rounded-[8px] flex items-center py-0 px-4 box-border gap-3 hover:bg-figma-primary/10 text-figma-surface`}
                    >
                        <FileDown className="w-5 h-5" />
                        <div className="relative tracking-[-0.04px] leading-[26px] font-medium">Descargar plantilla</div>
                    </button>
                </div>

                {/* Spacer handled by flex-1 on nav; info will be at the bottom inside the parent due to justify-between */}
            </nav>

            {/* Bottom info button (fixed to bottom within the sidebar block) */}
            <div className="w-full px-6">
                <button
                    onClick={() => onNavigate?.("informacion")}
                    className={`self-stretch h-12 rounded-[8px] flex items-center py-0 px-4 box-border gap-3 hover:bg-figma-primary/10 text-figma-surface`}
                >
                    <Info className="w-5 h-5" />
                    <div className="relative tracking-[-0.04px] leading-[26px] font-medium">Información</div>
                </button>
            </div>
        </div>
            {children}
        </Container>
    ); 
}
