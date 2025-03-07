"use client"

import "../globals.css"
import {ThemeProvider} from '@/components/ui/theme-provider'
import {ReactNode, Suspense, useEffect, useState} from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ToggleProvider} from "@/app/context/ToggleContext";
import {SidebarProvider} from "@/app/context/SidebarContext";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {SidebarContentsLoadingErrorContext} from "@/app/context/SidebarContentsLoadingErrorContext";
import {SidebarContentType} from "@/app/types";
import {useIsMobile} from "@/hooks/use-mobile";
import {useScroll} from "@/app/context/RefContext";

const queryClient = new QueryClient();
const SidebarContents: SidebarContentType[] = [
    {
        id: 1,
        name: "Tags",
        isCurrent: false,
    },
    {
        id: 2,
        name: "Folders",
        isCurrent: false,
    },
    {
        id: 3,
        name: "Bookmarks",
        isCurrent: false
    }
];

export default function ResultsLayout({
                                          children,
                                      }: {
    children: ReactNode
}) {
    const isMobile = useIsMobile();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(!isMobile);
    const {scrollToFirst} = useScroll();

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
                <QueryClientProvider client={queryClient}>
                    <SidebarContentsLoadingErrorContext.Provider value={{isLoading: false, errorMessage: ""}}>
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="system"
                            enableSystem
                            disableTransitionOnChange
                        >
                            <SidebarProvider defaultSidebarContent={SidebarContents[0]}>
                                <Sidebar
                                    title={"Search Results"}
                                    contents={SidebarContents}
                                    isCollapsed={isSidebarCollapsed}
                                    handleClick={() => {
                                        scrollToFirst();
                                    }}
                                />
                                <ThemeProvider
                                    attribute="class"
                                    defaultTheme="system"
                                    enableSystem
                                    disableTransitionOnChange
                                >
                                    <ToggleProvider>
                                        <div className="flex flex-col flex-1 overflow-hidden">
                                            <Header
                                                isSidebarCollapsed={isSidebarCollapsed}
                                                toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                            />
                                            {(isMobile && isSidebarCollapsed) &&
                                                <main className="flex-1 overflow-y-auto p-4">{children}</main>}
                                            {!isMobile &&
                                                <main className="flex-1 overflow-y-auto p-4">{children}</main>}
                                        </div>
                                    </ToggleProvider>
                                </ThemeProvider>
                            </SidebarProvider>
                        </ThemeProvider>
                    </SidebarContentsLoadingErrorContext.Provider>
                </QueryClientProvider>
            </Suspense>
        </div>
    )
}