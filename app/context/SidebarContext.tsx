"use client";

import {createContext, ReactNode, useContext, useState} from "react";
import {SidebarContextType} from "@/app/interfaces";
import {SidebarContentType} from "@/app/types";

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({
                                    children,
                                    defaultSidebarContent,
                                }: {
    children: ReactNode;
    defaultSidebarContent: SidebarContentType;
}) => {
    const [selectedContent, setSelectedContent] = useState<SidebarContentType>(
        defaultSidebarContent
    );

    return (
        <SidebarContext.Provider value={{selectedContent, setSelectedContent}}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebarContext = () => {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error("useSidebarContext must be used within a SidebarProvider");
    }
    return context;
};
