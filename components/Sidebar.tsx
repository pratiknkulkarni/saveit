"use client";

import Image from "next/image";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import {useIsMobile} from "@/hooks/use-mobile";
import {useRouter, useSearchParams} from "next/navigation";
import {useSidebarContext} from "@/app/context/SidebarContext";
import {SidebarProps} from "@/app/interfaces";
import {SidebarContentType} from "@/app/types";
import {useEffect} from "react";
import FolderSidebar from "@/components/FolderSidebar";

const SettingsSidebarContent: SidebarContentType[] = [
    {
        id: 1,
        name: "Appearance",
        isCurrent: true,
    },
    {
        id: 2,
        name: "Account",
        isCurrent: false,
    }
]

const Sidebar = ({isCollapsed, contents, title, isEmpty, handleClick}: SidebarProps) => {
    const isMobile = useIsMobile();
    const router = useRouter();
    const {setSelectedContent, selectedContent} = useSidebarContext();
    const searchParams = useSearchParams();
    const folderId = searchParams.get("folderId") || "";

    useEffect(() => {
        if (selectedContent.id === -99) {
            setSelectedContent({
                id: Number(folderId),
                name: "",
                isCurrent: true,
            })
        }
    }, [selectedContent, folderId]);

    const handleContentClick = (content: SidebarContentType) => {
        setSelectedContent(content);

        if (handleClick) {
            handleClick()
        }
    };

    return (
        <div
            className={cn(
                "border-r bg-background h-screen flex flex-col transition-all duration-300 ease-in-out group",
                isCollapsed ? "w-20" : isMobile ? "w-40" : "w-64",
                isMobile && isCollapsed && "w-0 transition-all duration-300 ease-in-out"
            )}
        >
            <div className="p-4 flex justify-center">
                <Button
                    aria-label={"Save It"}
                    variant={"ghost"}
                    size={"lg"}
                    className={isCollapsed ? "hidden" : "block pr-2 cursor-pointer text-2xl"}
                    onClick={() => router.push("/home")}
                >
                    Save It
                </Button>
                <Image
                    src={"/app-icon.svg"}
                    alt="Save It placeholder"
                    width={32}
                    height={32}
                    unoptimized={true}
                />
            </div>

            {
                !isCollapsed && title === "Settings" && (
                    SettingsSidebarContent.map(content => {
                        return <div
                            key={content.id}
                            className={selectedContent.id === content.id ? "flex items-center justify-between p-2 rounded-md hover:bg-accent group cursor-pointer bg-primary-foreground" : "flex items-center justify-between p-2 rounded-md hover:bg-accent group cursor-pointer "}
                            onClick={() => handleContentClick(content)}
                        >
                            <div>{content.name}</div>
                        </div>
                    })
                )
            }

            {title === "Folders" &&
                <FolderSidebar isCollapsed={isCollapsed} isEmpty={isEmpty} contents={contents}/>}
        </div>
    );
};

export default Sidebar;
