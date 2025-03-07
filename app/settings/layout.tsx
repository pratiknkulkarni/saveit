"use client";

import "../globals.css";
import {ThemeProvider} from "@/components/ui/theme-provider";
import {Suspense, useEffect, useState} from "react";
import {useIsMobile} from "@/hooks/use-mobile";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import {SidebarProvider} from "@/app/context/SidebarContext";
import {SidebarContentType} from "@/app/types";
import {SidebarContentsLoadingErrorContext} from "@/app/context/SidebarContentsLoadingErrorContext";

export default function SettingsLayout({
                                           children,
                                       }: {
    children: React.ReactNode;
}) {
    const isMobile = useIsMobile();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(!isMobile);
    const SidebarContents: SidebarContentType[] = [
        {
            id: 1,
            name: "Appearance",
            isCurrent: true,
        },
        {
            id: 2,
            name: "Account",
            isCurrent: false,
        },
    ];

    useEffect(() => {
        if (!isMobile) {
            setIsSidebarCollapsed(false);
        } else {
            setIsSidebarCollapsed(true);
        }
    }, [isMobile]);

    return (
        <div className={"flex h-screen"}>
            <Suspense fallback={<div>Loading...</div>}>
            <SidebarContentsLoadingErrorContext.Provider value={{isLoading: false, errorMessage: ""}}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <SidebarProvider defaultSidebarContent={SidebarContents[0]}>
                        <Sidebar
                            title={"Settings"}
                            contents={SidebarContents}
                            isCollapsed={isSidebarCollapsed}
                        />
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <Header
                                isSidebarCollapsed={isSidebarCollapsed}
                                toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            />
                            {(isMobile && isSidebarCollapsed) &&
                                <main className="flex-1 overflow-y-auto p-4">{children}</main>}
                            {!isMobile && <main className="flex-1 overflow-y-auto p-4">{children}</main>}
                        </div>
                    </SidebarProvider>
                </ThemeProvider>
            </SidebarContentsLoadingErrorContext.Provider>
            </Suspense>
        </div>
    );
}