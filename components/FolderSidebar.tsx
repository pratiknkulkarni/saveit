"use client"

import {useRouter, useSearchParams} from "next/navigation";
import {useSidebarContext} from "@/app/context/SidebarContext";
import {useSidebarContentsLoadingErrorContext} from "@/app/context/SidebarContentsLoadingErrorContext";
import {authClient} from "@/lib/auth-client";
import {useEffect, useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {useDeleteFolderMutation} from "@/hooks/use-delete-folder-mutation";
import {useUpdateFolderBookmarkMutation} from "@/hooks/use-update-folder-bookmark-mutation";
import {toast} from "@/hooks/use-toast";
import {SidebarContentType} from "@/app/types";
import {QUERY_KEYS} from "@/lib/queryKeys";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Pencil, PlusCircle, X as XIcon} from "lucide-react";
import {Skeleton} from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {cn} from "@/lib/utils";
import {DropdownMenu, DropdownMenuContent, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import CreateBookmarkDialog from "@/app/home/components/CreateBookmarkDialog";
import CreateTagDialog from "@/app/home/components/CreateTagDialog";
import CreateFolderDialog from "@/app/home/components/CreateFolderDialog";

const generateFolderFilterURL = (newFolder: string, tagIds: string[]): string => {
    const url = "/filters";
    const params: string[] = [];

    if (newFolder) {
        params.push(`folderId=${newFolder}`);
    }

    tagIds.forEach((tagId) => {
        params.push(`tagId=${tagId}`);
    });

    return params.length > 0 ? `${url}?${params.join("&")}` : url;
}


const FolderSidebar = ({isEmpty, contents, isCollapsed}: {
    isEmpty: boolean | undefined,
    contents: SidebarContentType[],
    isCollapsed: boolean
}) => {
    // const isMobile = useIsMobile();
    const router = useRouter();
    const {setSelectedContent, selectedContent} = useSidebarContext();
    const {isLoading} = useSidebarContentsLoadingErrorContext();
    const {data: session} = authClient.useSession();

    const searchParams = useSearchParams();
    const tagIds = searchParams.getAll("tagId") || "";
    const folderId = searchParams.get("folderId") || "";

    const [editMode, setEditMode] = useState<boolean>(false);

    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
    const [selectedFolderName, setSelectedFolderName] = useState<string>("");
    const [folderMarkedForDeletion, setFolderMarkedForDeletion] = useState<number | null>(null);
    const queryClient = useQueryClient();

    const deleteFolderMutation = useDeleteFolderMutation(session?.user?.id);
    const updateFolderMutation = useUpdateFolderBookmarkMutation(session?.user?.id);

    const handleSaveFolderName = (folderId: number, currentName: string, newName: string) => {
        if (currentName === newName) {
            setSelectedFolderId(null);
            toast({title: "No changes made", description: "The folder name remains the same."});
            return;
        }

        if (selectedFolderId) {
            updateFolderMutation.mutate({folderId, newFolderName: newName});
            setSelectedFolderId(null);
        }
    };

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

        const url = generateFolderFilterURL(String(content.id), tagIds);
        router.push(url);
    };

    useEffect(() => {
        if (deleteFolderMutation?.data && deleteFolderMutation.data.success) {
            setTimeout(() => {
                void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useGetUserFoldersQueryKey]});
            }, 100)

            setTimeout(() => {
                void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useGetUserFoldersSidebarQuery]});
            }, 200)

            toast({
                title: "Folder deleted",
                description: "Your folder has been successfully deleted.",
            });
        }

        if (deleteFolderMutation?.data && !deleteFolderMutation.data.success) {
            setSelectedFolderId(null);
            setSelectedFolderName("");
            setFolderMarkedForDeletion(null);

            toast({
                title: "Error",
                description: deleteFolderMutation.data.error,
            });
        }

        if (updateFolderMutation?.data && !updateFolderMutation.data.success) {
            toast({
                title: "Error",
                description: updateFolderMutation.data.error,
            });
        }

        if (updateFolderMutation?.data && updateFolderMutation.data.success) {
            setTimeout(() => {
                void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useGetUserFoldersQueryKey]});
            }, 100)

            setTimeout(() => {
                void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useGetUserFoldersSidebarQuery]});
            }, 200)

            toast({
                title: "Folder updated",
                description: "Your folder has been successfully updated.",
            });
        }
    }, [deleteFolderMutation.data, queryClient, updateFolderMutation.data]);


    return <>
        <ScrollArea className="flex-1 px-2 group">
            {!isCollapsed && (
                <div className="font-medium mb-2 px-2 text-lg justify-center pb-2 flex items-center">
                    <span className="pr-2">Folders</span>
                    <Pencil
                        className="h-4 w-4 invisible sm:visible lg:invisible lg:group-hover:visible cursor-pointer"
                        onClick={() => setEditMode(!editMode)}
                    />
                </div>
            )}

            {isLoading &&
                <div className={"w-full flex flex-col gap-2 justify-around items-start overflow-y-hidden"}>
                    <Skeleton className={"w-full h-[30px]"}/>
                    <Skeleton className={"w-full h-[30px]"}/>
                    <Skeleton className={"w-full h-[30px]"}/>
                    <Skeleton className={"w-full h-[30px]"}/>
                    <Skeleton className={"w-full h-[30px]"}/>
                    <Skeleton className={"w-full h-[30px]"}/>
                    <Skeleton className={"w-full h-[30px]"}/>
                    <Skeleton className={"w-full h-[30px]"}/>
                    <Skeleton className={"w-full h-[30px]"}/>
                    <Skeleton className={"w-full h-[30px]"}/>
                    <Skeleton className={"w-full h-[30px]"}/>
                    <Skeleton className={"w-full h-[30px]"}/>
                </div>}

            <Dialog
                open={folderMarkedForDeletion !== null}
            >
                <DialogContent>
                    <DialogTitle>Delete Folder Confirmation</DialogTitle>
                    <DialogDescription>Once you delete a folder, all the bookmarks in this folder will be preserved
                        but no longer associated with any folder. You can manually assign them later
                        on.</DialogDescription>
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                if (folderMarkedForDeletion !== null) {
                                    deleteFolderMutation.mutate(folderMarkedForDeletion);
                                    setFolderMarkedForDeletion(null);
                                }
                            }}>
                            Continue
                        </Button>
                        <Button variant="outline"
                                onClick={() => setFolderMarkedForDeletion(null)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {(isEmpty && !isLoading) ? <div
                className={"h-screen flex justify-center items-start text-center"}>No folders found, add
                a new one to
                get started</div> : (contents.map((content) => (

                <div
                    key={content.id}
                    className={selectedContent.id === content.id ? "flex items-center justify-between p-2 rounded-md hover:bg-accent group cursor-pointer bg-primary-foreground" : "flex items-center justify-between p-2 rounded-md hover:bg-accent group cursor-pointer "}
                    onClick={() => {
                        if (!editMode) {
                            handleContentClick(content)
                        }
                    }
                    }
                >
                    <span>{content.name}</span>
                    {editMode && (
                        <div className="flex items-center space-x-2">
                            <Dialog
                                open={selectedFolderId === content.id}
                                onOpenChange={(open) => {
                                    if (open) {
                                        setSelectedFolderId(content.id);
                                        setSelectedFolderName(content.name);
                                    } else {
                                        setSelectedFolderId(null);
                                    }
                                }}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Pencil
                                            className="h-4 w-4 text-gray-500 hover:border border-solid border-"/>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>Edit Bookmark</DialogTitle>
                                    <Input
                                        value={selectedFolderName}
                                        onChange={(e) => setSelectedFolderName(e.target.value)}
                                    />
                                    <DialogFooter>
                                        <Button
                                            onClick={() => handleSaveFolderName(content.id, content.name, selectedFolderName)}>
                                            Save
                                        </Button>
                                        <Button variant="outline"
                                                onClick={() => setSelectedFolderId(null)}>Cancel</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setFolderMarkedForDeletion(content.id)
                                }
                                }
                            >
                                <XIcon className="h-4 w-4 text-gray-500 hover:text-red-500"/>
                            </Button>
                        </div>
                    )}
                </div>
            )))}

        </ScrollArea>

        <div
            className={cn(
                "p-2 space-y-2",
                isCollapsed && "flex flex-col items-center"
            )}
        >
            {!isCollapsed &&
                <div className={"flex justify-center w-full gap-0"}>
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <div className={"w-fit flex justify-center items-center"}>
                                <PlusCircle className="h-full w-full"/>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <CreateBookmarkDialog/>
                            <CreateTagDialog/>
                            <CreateFolderDialog/>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>}
        </div>
    </>
}

export default FolderSidebar;