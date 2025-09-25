React.use
import * as React from "react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Zap } from "lucide-react";

interface SidebarProps {
    children?: React.ReactNode;
    onDownloadTemplate?: () => void;
    hasStudents?: boolean;
}

export function Sidebar({ children, onDownloadTemplate, hasStudents }: SidebarProps) {
    const [selectedMenu, setSelectedMenu] = useState("inicio");

    return (
        <Card className="fixed top-6 left-6 w-[280px] h-[92vh]
    flex flex-col items-center justify-start
    rounded-2xl shadow-xl border-none
    bg-gradient-to-b
    from-[hsl(var(--sidebar-grad-from))]
    to-[hsl(var(--sidebar-grad-to))]">
            {/* logo */}
            <div className="w-full flex flex-col items-center py-6">
                <header className="mb-8 flex gap-2">
                    <Zap className="h-10 w-10" />
                    <h1 className="text-3xl font-bold mb-2">TeamUp</h1>
                </header>
            </div>
            {/* Menú */}
            <nav className="w-full flex flex-col gap-2 px-6">
                <button
                    className={`text-left px-4 py-2 rounded-lg transition-colors font-semibold ${selectedMenu === "inicio" ? "bg-background " : "hover:bg-primary/10 text-foreground"}`}
                    onClick={() => setSelectedMenu("inicio")}
                >
                    Crea un equipo
                </button>
                { hasStudents && (
                <button
                    className={`text-left px-4 py-2 rounded-lg transition-colors ${selectedMenu === "equipos" ? "bg-background  font-semibold" : "hover:bg-primary/10 text-foreground"}`}
                    onClick={() => setSelectedMenu("equipos")}
                >
                    Consulta tus equipos
                </button>)
                }
                <button
                    className={`text-left px-4 py-2 rounded-lg transition-colors ${selectedMenu === "plantilla" ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-primary/10 text-foreground"}`}
                    onClick={() => onDownloadTemplate?.()
                    }
                >
                    Plantilla excel
                </button>
            </nav>
            {children}
        </Card>
    );
}
