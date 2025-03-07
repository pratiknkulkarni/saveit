import {createContext, useContext} from "react";

interface SidebarContentsLoadingErrorContextType {
    isLoading?: boolean;
    errorMessage?: string;
}

const SidebarContentsLoadingErrorContext = createContext<SidebarContentsLoadingErrorContextType | undefined>(undefined);

const useSidebarContentsLoadingErrorContext = () => {
    const context = useContext(SidebarContentsLoadingErrorContext);
    if (!context) {
        throw new Error("useLoadingErrorContext must be used within a SidebarContentsLoadingErrorProvider");
    }
    return context;
};

export {SidebarContentsLoadingErrorContext, useSidebarContentsLoadingErrorContext};