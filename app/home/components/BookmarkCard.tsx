"use client"

import Link from "next/link";
import {cn} from "@/lib/utils";
import {Badge} from "@/components/ui/badge";
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
import {useSettings} from "@/app/context/SettingsContext";
import {useDeleteBookmarkMutation} from "@/hooks/use-delete-bookmark-mutation";
import {useToggleBookmarkMutation} from "@/hooks/use-toggle-bookmark-mutation";
import {authClient} from "@/lib/auth-client";
import {Bookmark} from "@prisma/client";
import {GetFormattedTagsForBookmarksResponse} from "@/app/actions/types";
import {toast} from "@/hooks/use-toast";
import Image from "next/image";


const BookmarkCard = ({bookmark, bookmarkTagsResponse}: {
    bookmark: Bookmark,
    bookmarkTagsResponse: GetFormattedTagsForBookmarksResponse
}) => {
    const {settings} = useSettings();
    const {data: session} = authClient.useSession();
    const deleteBookmarkMutation = useDeleteBookmarkMutation(session?.user?.id);
    const toggleBookmarkMutation = useToggleBookmarkMutation();

    return (
        <div>
            <li key={bookmark.id}
                className="flex-col items-center md:items-start w-full py-2 border-b">
                <div className="flex flex-col md:flex-row w-full">
                    <div className="w-full md:w-2/3 md:pr-4">
                        {settings.bookmarkDisplay.includes("Title") ? (
                            <Link href={bookmark.url}
                                  target="_blank"
                                  rel="noopener noreferrer">
                                <h3 className={cn("font-medium text-lg text-center md:text-left")}>
                                    {bookmark.title}
                                </h3>
                            </Link>
                        ) : <div className={"hidden"}></div>}

                        {settings.bookmarkDisplay.includes("Tags") ? (
                            <div
                                className="flex flex-wrap gap-2 justify-center md:justify-start w-full my-2 text-sm md:text-xs">
                                {bookmarkTagsResponse && bookmarkTagsResponse?.success && bookmarkTagsResponse?.data?.map((tag) => {
                                    if (tag.bookmarkId === bookmark.id) {
                                        return tag.tagNames.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="text-md">
                                                {tag}
                                            </Badge>
                                        ))
                                    }
                                })}
                            </div>
                        ) : <div className={"hidden"}></div>}

                        {settings.bookmarkDisplay.includes("Description") ? (
                            <div
                                className="text-sm w-full h-12 flex items-center justify-center md:justify-start overflow-x-clip text-muted-foreground">
                                <TruncateText text={bookmark.description as string}
                                              mobileWordLimit={15}
                                              desktopWordLimit={20}/>
                            </div>
                        ) : <div className={"hidden"}></div>}

                        <div
                            className="text-sm w-fit max-w-full md:max-w-full mx-auto md:mx-0 text-ellipsis whitespace-nowrap overflow-hidden flex justify-center md:justify-start">
                            <Link href={bookmark.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-center w-full md:w-full md:text-xs text-blue-500 hover:underline flex items-center mt-1 mx-auto md:mx-0"
                            >
                                {bookmark.url}
                            </Link>
                        </div>
                    </div>

                    {settings.bookmarkDisplay.includes("Images") ? (<div className="w-full md:w-1/3 mt-3 md:mt-0">
                        {bookmark.imageURL ? (
                            <div className="rounded-lg overflow-hidden border border-border">
                                <div className="relative aspect-video w-full">
                                    <Image
                                        src={bookmark.imageURL}
                                        alt={bookmark.title || "Bookmark image"}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 300px"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg overflow-hidden border border-border bg-muted">
                                <div className="flex items-center justify-center aspect-video w-full">
                                    <span className="text-muted-foreground text-sm">No preview available</span>
                                </div>
                            </div>
                        )}
                    </div>) : (<div className={"hidden"}></div>)
                    }
                </div>

                {settings.bookmarkDisplay.includes("Actions") ? (
                    <div
                        className="flex md:w-1/3 w-1/2 mx-auto md:ml-0 justify-around space-x-2 mt-3">
                        <EditBookmarkDialog bookmarkFormData={{
                            id: bookmark.id,
                            url: bookmark.url,
                            description: bookmark.description === null ? "" : bookmark.description,
                            title: bookmark.title === null ? "" : bookmark.title,
                            folderId: bookmark.folderId === null ? undefined : bookmark.folderId,
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
                                }, {
                                    onSuccess: () => {
                                        toast({
                                            title: "Bookmark toggled",
                                        })
                                    },
                                    onError: () => {
                                        toast({title: "Error", variant: "destructive"});
                                    }
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
                                            deleteBookmarkMutation.mutate(bookmark.id, {
                                                onSuccess: () => {
                                                    toast({
                                                        title: "Bookmark deleted",
                                                        description: "Your bookmark has been successfully deleted.",
                                                    })
                                                },
                                                onError: () => {
                                                    toast({title: "Error", variant: "destructive"});
                                                }
                                            })
                                        }}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                ) : <div className={"hidden"}></div>}
            </li>
        </div>
    )
}

export default BookmarkCard;