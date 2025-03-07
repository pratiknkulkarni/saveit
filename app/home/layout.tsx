"use client"

import "../globals.css"
import {ThemeProvider} from '@/components/ui/theme-provider'
import {ReactNode} from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import FolderSidebar from "@/app/home/components/FolderSidebar";
import {ToggleProvider} from "@/app/context/ToggleContext";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";

const queryClient = new QueryClient();

export default function HomeLayout({
                                       children,
                                   }: {
    children: ReactNode
}) {

    return (
        <div className={"flex h-screen"}>
            <QueryClientProvider client={queryClient}>
                <ReactQueryDevtools initialIsOpen={false}/>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <ToggleProvider>
                        {/*{children}*/}
                        <FolderSidebar>{children}</FolderSidebar>
                    </ToggleProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </div>
    )
}