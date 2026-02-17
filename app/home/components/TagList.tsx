"use client"

import {Badge} from "@/components/ui/badge"
import {useEffect, useState} from "react";
import {authClient} from "@/lib/auth-client";
import {Skeleton} from "@/components/ui/skeleton";
import {useGetUserTagsQuery} from "@/hooks/use-get-user-tags-query";
import {useRouter, useSearchParams} from "next/navigation";
import {Pencil, PencilIcon, XIcon} from "lucide-react";
import {useDeleteTagMutation} from "@/hooks/use-delete-tag-mutation";
import {QUERY_KEYS} from "@/lib/queryKeys";
import {toast} from "@/hooks/use-toast";
import {useQueryClient} from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useUpdateTagBookmarkMutation} from "@/hooks/use-update-tag-bookmark-mutation";

type Tag = {
    id: number, name: string
}

type TagGroup = {
    letter: string;
    tags: Tag[];
}

const generateFilterURL = (folderId: string, tagIds: string[], newTagId: string): string => {
    const url = "/filters";
    const params: string[] = [];

    if (folderId) {
        params.push(`folderId=${folderId}`);
    }

    // no repeats
    const uniqueTags = new Set(tagIds);
    if (!uniqueTags.has(newTagId)) {
        uniqueTags.add(newTagId);
    }

    uniqueTags.forEach((tagId) => {
        params.push(`tagId=${tagId}`);
    });

    return params.length > 0 ? `${url}?${params.join("&")}` : url;
}

const groupTagsAlphabetically = (tags: Tag[]): TagGroup[] => {
    const grouped = tags.reduce((acc, tag) => {
        const letter = tag.name[0].toUpperCase();
        if (!acc[letter]) {
            acc[letter] = [];
        }
        acc[letter].push(tag);
        return acc;
    }, {} as Record<string, Tag[]>);

    return Object.entries(grouped)
        .map(([letter, tags]) => ({
            letter,
            tags: tags.sort((a, b) => a.name.localeCompare(b.name))
        }))
        .sort((a, b) => a.letter.localeCompare(b.letter));
};

const TagList = () => {
    const {data: session} = authClient.useSession();
    const {data: tags = [], isLoading} = useGetUserTagsQuery(session?.user?.id);
    const router = useRouter();

    const [groupedTags, setGroupedTags] = useState<TagGroup[]>([]);
    const [editMode, setEditMode] = useState<boolean>(false);

    const [editingTagId, setEditingTagId] = useState<number | null>(null);
    const [editingTagName, setEditingTagName] = useState<string>("");

    const queryClient = useQueryClient();

    const searchParams = useSearchParams();
    const tagIds = searchParams.getAll("tagId") || "";
    const folderId = searchParams.get("folderId") || "";

    const deleteTagMutation = useDeleteTagMutation();
    const updateTagMutation = useUpdateTagBookmarkMutation(session?.user?.id);

    useEffect(() => {
        if (updateTagMutation?.data && !updateTagMutation.data.success) {
            toast({
                title: "Error",
                description: updateTagMutation.data.error,
            });
        }

        if (updateTagMutation?.data && updateTagMutation.data.success) {
            setEditingTagId(null);

            setTimeout(() => {
                void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useGetUserTagsQueryKey]});
            }, 100)

            setTimeout(() => {
                void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useTagsForBookmarksQueryKey]});
            }, 200)

            toast({
                title: "Tag updated",
                description: "Your tag has been successfully updated.",
            });
        }

    }, [deleteTagMutation.data, queryClient, updateTagMutation.data]);


    useEffect(() => {
        if (tags.length > 0) {
            setGroupedTags(groupTagsAlphabetically(tags.map(tag => ({id: tag.id, name: tag.name}))));
        }
    }, [tags]);

    const handleSaveTagName = (tagId: number, currentName: string, newName: string) => {
        if (currentName === newName) {
            setEditingTagId(null);
            toast({
                title: "No changes made",
                description: "The tag name remains the same.",
            });
            return;
        }

        updateTagMutation.mutate({
            tagId: tagId,
            newTagName: newName,
        });
    };

    return (
        <div className="space-y-6 group">
            <h2 className="text-xl font-semibold flex items-center">
                <span className={"pr-2"}>Tags</span>
                <Pencil
                    className="h-4 w-4 hidden sm:block lg:hidden lg:group-hover:block transform cursor-pointer"
                    onClick={() => setEditMode(!editMode)}
                />
            </h2>
            {tags.length === 0 && !isLoading && <p>No tags found</p>}

            {isLoading && (
                <div className={"grid grid-cols-3 gap-2"}>
                    <Skeleton className={"w-[40px] h-[20px]"}/>
                    <Skeleton className={"w-[40px] h-[20px]"}/>
                    <Skeleton className={"w-[40px] h-[20px]"}/>
                    <Skeleton className={"w-[40px] h-[20px]"}/>
                    <Skeleton className={"w-[40px] h-[20px]"}/>
                    <Skeleton className={"w-[40px] h-[20px]"}/>
                    <Skeleton className={"w-[40px] h-[20px]"}/>
                    <Skeleton className={"w-[40px] h-[20px]"}/>
                    <Skeleton className={"w-[40px] h-[20px]"}/>
                    <Skeleton className={"w-[40px] h-[20px]"}/>
                    <Skeleton className={"w-[40px] h-[20px]"}/>
                    <Skeleton className={"w-[40px] h-[20px]"}/>
                    <Skeleton className={"w-[40px] h-[20px]"}/>
                    <Skeleton className={"w-[40px] h-[20px]"}/>
                    <Skeleton className={"w-[40px] h-[20px]"}/>
                </div>
            )}

            {groupedTags.map((group) => (
                <div key={group.letter}>
                    <h3 className="text-sm font-bold mb-2">{group.letter}</h3>
                    <div className="flex text-xs flex-wrap gap-2">
                        {group.tags.map((tag) => (
                            <Badge key={tag.id} className={"cursor-pointer"} variant="secondary" onClick={() => {
                                if (!editMode) {
                                    const url = generateFilterURL(folderId, tagIds, String(tag.id));
                                    router.push(url);
                                }
                            }}>
                                {tag.name}
                                {editMode && (
                                    <div className="flex items-center ml-1">
                                        <Dialog open={editingTagId === tag.id} onOpenChange={(open) => {
                                            if (open) {
                                                setEditingTagId(tag.id);
                                                setEditingTagName(tag.name);
                                            } else {
                                                setEditingTagId(null);
                                            }
                                        }}>
                                            <DialogTrigger asChild>
                                                <button
                                                    className="h-3 w-3 text-gray-500 hover:text-blue-500"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <PencilIcon className="h-3 w-3"/>
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Edit Tag</DialogTitle>
                                                    <DialogDescription>
                                                        Click save when you are done.
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <div className="py-4">
                                                    <Input
                                                        value={editingTagName}
                                                        onChange={e => setEditingTagName(e.target.value)}
                                                    />
                                                </div>

                                                <DialogFooter>
                                                    <Button
                                                        onClick={() => handleSaveTagName(tag.id, tag.name, editingTagName)}
                                                        disabled={updateTagMutation.isPending || editingTagName === ""}
                                                    >
                                                        {updateTagMutation.isPending ? "Saving..." : "Save"}
                                                    </Button>

                                                    <Button variant={"outline"} onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingTagId(null);
                                                    }}>Cancel</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        <button
                                            className="h-3 w-3 text-gray-500 hover:text-red-500 ml-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteTagMutation.mutate(tag.id, {
                                                    onSuccess: () => {
                                                        toast({
                                                            title: "Tag deleted",
                                                            description: "Your tag has been successfully deleted.",
                                                        });
                                                    },
                                                    onError: () => {
                                                        toast({
                                                            title: "Error deleting tag.",
                                                        });
                                                    }
                                                });
                                            }
                                            }
                                        >
                                            <XIcon className="h-3 w-3"/>
                                        </button>
                                    </div>
                                )}
                            </Badge>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default TagList;
