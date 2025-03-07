"use client"

import {useSettings} from "@/app/context/SettingsContext";
import {authClient} from "@/lib/auth-client";
import {useDeleteBookmarkMutation} from "@/hooks/use-delete-bookmark-mutation";
import {useToggleBookmarkMutation} from "@/hooks/use-toggle-bookmark-mutation";
import {useQueryClient} from "@tanstack/react-query";
import {useEffect} from "react";
import {QUERY_KEYS} from "@/lib/queryKeys";
import {toast} from "@/hooks/use-toast";
import Link from "next/link";
import {cn} from "@/lib/utils";
import TruncateText from "@/app/home/components/TruncateText";
import EditBookmarkDialog from "@/app/home/components/EditBookmarkDialog";
import {Button} from "@/components/ui/button";
import {Star, Trash2} from "lucide-react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {FilteredBookmark} from "@/app/actions/filters";
import {Badge} from "@/components/ui/badge";

const FilteredBookmarkCard = ({bookmark}: { bookmark: FilteredBookmark }) => {
    const {settings} = useSettings();
    const {data: session} = authClient.useSession();
    const deleteBookmarkMutation = useDeleteBookmarkMutation(session?.user?.id);
    const toggleBookmarkMutation = useToggleBookmarkMutation(session?.user?.id);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (deleteBookmarkMutation.status === "success") {
            void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useFilteredBookmarksQuery]});

            toast({
                title: "Bookmark deleted",
                description: "Your bookmark has been successfully deleted.",
            });
        }

        if (toggleBookmarkMutation.status === "success") {
            setTimeout(() => {
                void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useFilteredBookmarksQuery]});
            }, 100)

            toast({
                title: "Success!",
            });
        }

        if (deleteBookmarkMutation.status === "error") {
            toast({
                title: "Error",
                description: "There was a problem deleting your bookmark.",
                variant: "destructive",
            })
        }

        if (toggleBookmarkMutation.status === "error") {
            toast({
                title: "Error",
                description: "There was a problem updating your bookmark.",
                variant: "destructive",
            })
        }

    }, [deleteBookmarkMutation.status, toggleBookmarkMutation.status]);

    return (
        <div>
            <div key={bookmark.id}
                 className="flex-col items-center md:items-start w-full py-2 border-b">
                <div className="flex flex-col items-center md:items-start w-full">
                    <div className="w-full">
                        {settings.bookmarkDisplay.includes("Title") ? (
                            <Link href={bookmark.url}
                                  target="_blank"
                                  rel="noopener noreferrer">
                                <h3 className={cn("font-medium text-lg text-center lg:text-left")}>
                                    {bookmark.title}
                                </h3>
                            </Link>
                        ) : <div className={"hidden"}></div>}

                        {settings.bookmarkDisplay.includes("Tags") ? (
                            <div
                                className="flex flex-wrap gap-2 justify-center lg:justify-start w-full my-2 text-sm md:text-xs">
                                {bookmark.tags.map(tag => {
                                    return <Badge key={tag.id} variant={"secondary"}
                                                  className={"text-md"}>{tag.name}</Badge>
                                })}
                            </div>
                        ) : <div className={"hidden"}></div>}
                        {settings.bookmarkDisplay.includes("Description") ? (
                            <div
                                className="text-sm w-full h-12 flex items-center justify-center lg:justify-start overflow-x-clip text-muted-foreground">
                                <TruncateText text={bookmark.description as string}
                                              mobileWordLimit={15}
                                              desktopWordLimit={20}/>
                            </div>
                        ) : <div className={"hidden"}></div>}

                        <div
                            className="text-sm w-fit max-w-full lg:max-w-96 lg:mx-0 mx-auto text-ellipsis whitespace-nowrap overflow-hidden flex justify-center lg:justify-start">
                            <Link href={bookmark.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-center w-full lg:w-full md:text-xs text-blue-500 hover:underline flex items-center mt-1 mx-auto ltext lg:text-left"
                            >
                                {bookmark.url}
                            </Link>
                        </div>
                    </div>
                </div>
                {settings.bookmarkDisplay.includes("Actions") ? (
                    <div
                        className="flex md:w-1/4 lg:w-1/3 w-1/2 mx-auto justify-around space-x-2 md:mx-auto lg:mx-0">
                        <EditBookmarkDialog bookmarkFormData={{
                            id: bookmark.id,
                            url: bookmark.url,
                            description: bookmark.description === null ? "" : bookmark.description,
                            title: bookmark.title === null ? "" : bookmark.title,
                            folderId: (bookmark.folderId === null || bookmark.folderId === undefined) ? undefined : bookmark?.folderId.toString(),
                        }}/>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                const currentFavorite = bookmark.isFavorite;
                                bookmark.isFavorite = !bookmark.isFavorite;

                                toggleBookmarkMutation.mutate({
                                    isFavorite: !currentFavorite,
                                    bookmarkId: bookmark.id,
                                });
                            }}
                        >
                            <Star
                                className={cn("h-4 w-4", bookmark.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400")}/>
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Bookmark Confirmation?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you certain you want to remove this bookmark? Once deleted, it
                                        cannot be recovered.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => {
                                            deleteBookmarkMutation.mutate(bookmark.id)
                                        }}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                    </div>
                ) : <div className={"hidden"}></div>}
            </div>
        </div>
    )
}

export default FilteredBookmarkCard