"use client"

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {SidebarProvider} from "@/app/context/SidebarContext";
import {useIsMobile} from "@/hooks/use-mobile";
import {useEffect, useState} from "react";
import {authClient} from "@/lib/auth-client";
import {SidebarContentType} from "@/app/types";
import {SidebarContentsLoadingErrorContext} from "@/app/context/SidebarContentsLoadingErrorContext";
import {useGetUserFoldersSidebarQuery} from "@/hooks/use-get-user-folders-sidebar-query";
import TagList from "@/app/home/components/TagList";
import {usePathname} from "next/navigation";
import FilteredTagListContainer from "@/app/filters/component/FilteredTagListContainer";

const FolderSidebar = ({children}: { children: React.ReactNode }) => {
    const isMobile = useIsMobile();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(!isMobile);
    const [SidebarContents, setSidebarContents] = useState<SidebarContentType[]>([]);
    const {data: session} = authClient.useSession();
    const [errorMessage, setErrorMessage] = useState<string>("");
    const pathName = usePathname();

    const {data: foldersResponse, isLoading} = useGetUserFoldersSidebarQuery(session?.user?.id);

    useEffect(() => {
        if (foldersResponse?.success) {
            setSidebarContents([]);

            foldersResponse?.data?.map((folder) => {
                setSidebarContents((prev) => [...prev, {
                    id: folder.id,
                    name: folder.name,
                    isCurrent: false,
                }]);
            })
        } else {
            setErrorMessage(foldersResponse?.error || "Failed to load folders. Please try again.");
        }
    }, [foldersResponse]);

    useEffect(() => {
        if (!isMobile) {
            setIsSidebarCollapsed(false);
        } else {
            setIsSidebarCollapsed(true);
        }
    }, [isMobile])

    return (SidebarContents.length > 0 ?
            <SidebarContentsLoadingErrorContext.Provider value={{isLoading, errorMessage}}>
                <SidebarProvider defaultSidebarContent={SidebarContents[0]}>
                    <Sidebar title={"Folders"}
                             contents={SidebarContents}
                             isCollapsed={isSidebarCollapsed}/>
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <Header
                            isSidebarCollapsed={isSidebarCollapsed}
                            toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        />
                        {(isMobile && isSidebarCollapsed) &&
                            <main className="flex-1 overflow-y-auto p-4">{children}</main>}

                        {(isMobile && !isSidebarCollapsed && pathName === "/home") &&
                            <main className="flex-1 overflow-y-auto p-4">
                                <TagList/>
                            </main>}

                        {(isMobile && !isSidebarCollapsed && pathName === "/filters") &&
                            <main className="flex-1 overflow-y-auto p-4">
                                <FilteredTagListContainer/>
                            </main>}

                        {!isMobile && <main className="flex-1 overflow-y-auto p-4">{children}</main>}

                    </div>
                </SidebarProvider>
            </SidebarContentsLoadingErrorContext.Provider> : (
                <SidebarContentsLoadingErrorContext.Provider value={{isLoading, errorMessage}}>
                    {/*TODO: hard coding this for now*/}
                    <SidebarProvider defaultSidebarContent={{id: -99, name: "No Folders", isCurrent: false}}>
                        <Sidebar title={"Folders"}
                                 contents={SidebarContents}
                                 isCollapsed={isSidebarCollapsed} isEmpty={true}/>
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <Header
                                isSidebarCollapsed={isSidebarCollapsed}
                                toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            />
                            {(isMobile && isSidebarCollapsed) &&
                                <main className="flex-1 overflow-y-auto p-4 bg-red-100">{children}</main>}
                            {!isMobile && <main className="flex-1 overflow-y-auto p-4">{children}</main>}
                        </div>
                    </SidebarProvider>
                </SidebarContentsLoadingErrorContext.Provider>
            )
    )
}

export default FolderSidebar