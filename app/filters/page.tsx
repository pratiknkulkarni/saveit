"use client"

import {useRouter, useSearchParams} from "next/navigation";
import {useGetFilteredBookmarks} from "@/hooks/use-get-filtered-bookmarks";
import FilteredBookmarkCard from "@/app/filters/component/FilteredBookmarkCard";
import {Button} from "@/components/ui/button";
import {ArrowLeft} from "lucide-react";
import {Skeleton} from "@/components/ui/skeleton";
import FilteredTagListContainer from "@/app/filters/component/FilteredTagListContainer";
import {useIsMobile} from "@/hooks/use-mobile";

const FiltersPage = () => {
    const searchParams = useSearchParams();

    const folderId = searchParams.get("folderId") || "";
    const tagIds = searchParams.getAll("tagId") || "";

    const parsedFolderId = folderId ? parseInt(folderId, 10) : undefined;
    const parsedTagIds = tagIds.length > 0 ? tagIds.map((id) => parseInt(id, 10)) : undefined;
    const {data: filteredBookmarks, isLoading, isError, error} = useGetFilteredBookmarks(parsedFolderId, parsedTagIds);
    const router = useRouter();
    const isMobile = useIsMobile();


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

    if (filteredBookmarks && filteredBookmarks.length === 0) {
        return (
            <div className={"w-full h-screen flex flex-col justify-center items-center"}>
                <Button variant={"ghost"} onClick={() => {
                    router.push("/home");
                }}>
                    <ArrowLeft/>
                    Back to home
                </Button>
                <div>No bookmarks found</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Button variant={"ghost"} onClick={() => {
                router.push("/home");
            }}>
                <ArrowLeft/>
                Back to home
            </Button>
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-grow text-sm">
                    {filteredBookmarks && filteredBookmarks.map((filteredBookmark) => (
                        <FilteredBookmarkCard key={filteredBookmark.id} bookmark={filteredBookmark}/>
                    ))}
                </div>
                {!isMobile && <FilteredTagListContainer/>}
            </div>
        </div>
    )
}

export default FiltersPage