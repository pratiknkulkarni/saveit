"use client"

import {useEffect, useState} from "react";
import {useGetFilteredBookmarks} from "@/hooks/use-get-filtered-bookmarks";
import {useSearchParams} from "next/navigation";
import {Skeleton} from "@/components/ui/skeleton";
import FilteredTagList from "@/app/filters/component/FilteredTagList";

type Tag = {
    id: number, name: string
}

const FilteredTagListContainer = () => {
    const searchParams = useSearchParams();
    const folderId = searchParams.get("folderId") || "";
    const tagIds = searchParams.getAll("tagId") || "";
    const parsedFolderId = folderId ? parseInt(folderId, 10) : undefined;
    const parsedTagIds = tagIds.length > 0 ? tagIds.map((id) => parseInt(id, 10)) : undefined;
    const [uniqueTags, setUniqueTags] = useState<Tag[]>([]);
    const {data: filteredBookmarks, isLoading, isError, error} = useGetFilteredBookmarks(parsedFolderId, parsedTagIds);

    useEffect(() => {
        if (filteredBookmarks) {
            const tagSet = new Set<string>(); // Using a Set to track unique tag IDs
            const uniqueTagsArray: Tag[] = [];

            filteredBookmarks.forEach(filteredBookmark => {
                filteredBookmark.tags.forEach(t => {
                    if (!tagSet.has(t.id.toString())) {
                        tagSet.add(t.id.toString());
                        uniqueTagsArray.push(t);
                    }
                });
            });

            setUniqueTags(uniqueTagsArray); // Update the state with unique tags
        }
    }, [filteredBookmarks]);

    if (isLoading) return (
        <div className={"flex gap-6 flex-col"}>
            <Skeleton className="w-full h-[160px]"/>
            <Skeleton className="w-full h-[160px]"/>
            <Skeleton className="w-full h-[160px]"/>
            <Skeleton className="w-full h-[160px]"/>
            <Skeleton className="w-full h-[160px]"/>
            <Skeleton className="w-full h-[160px]"/>
        </div>
    )
    if (isError) return <p>Error: {error.message}</p>;

    return (
        <div className={"px-2 w-1/5"}>
            {filteredBookmarks && <FilteredTagList tags={Array.from(uniqueTags)}/>}
        </div>
    )
}

export default FilteredTagListContainer
