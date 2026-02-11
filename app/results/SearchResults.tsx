"use client";

import {useRouter, useSearchParams} from "next/navigation";
import {Skeleton} from "@/components/ui/skeleton";
import {ArrowLeft, SearchX} from "lucide-react";
import {authClient} from "@/lib/auth-client";
import {Filter, MatchMode} from "../actions/search_enum";
import SearchSection from "./components/SearchSection";
import {useSearchResultsQuery} from "@/hooks/use-search-results";
import {useScroll} from "@/app/context/RefContext";
import {Button} from "@/components/ui/button";

const SearchResults = () => {
    const searchParams = useSearchParams();
    const searchTerm = searchParams.get("query") || "";

    const rawFilter = searchParams.get("filter") || "";
    const validFilters: Filter[] = ["title", "description", "url", "tag", "folder", "all"];
    const filter: Filter = validFilters.includes(rawFilter as Filter) ? (rawFilter as Filter) : "url";

    const rawMatchMode = searchParams.get("matchMode");
    const validMatchModes: MatchMode[] = ["exact", "fuzzy", "loose", "startsWith", "contains"];
    const matchMode: MatchMode = validMatchModes.includes(rawMatchMode as MatchMode) ? (rawMatchMode as MatchMode) : "fuzzy";
    const {refs} = useScroll();
    const router = useRouter();

    const {data: session} = authClient.useSession();
    const {
        data: searchResults = [],
        isLoading,
        isError,
        error,
    } = useSearchResultsQuery(searchTerm, filter, matchMode, session?.user?.id);

    const groupedResults = {
        tag: searchResults.filter((res) => res.type === "tag"),
        folder: searchResults.filter((res) => res.type === "folder"),
        bookmark: searchResults.filter((res) => res.type === "bookmark"),
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <Button variant={"ghost"} onClick={() => {
                router.push("/home");
            }}>
                <ArrowLeft/>
                Back to home
            </Button>

            <h1 className="text-2xl font-medium mb-6">Search Results for <span
                className={"font-extrabold"}>{searchTerm}</span></h1>

            {isLoading ? (
                <div className="flex flex-col gap-4">
                    <Skeleton className="h-20 w-full"/>
                    <Skeleton className="h-20 w-full"/>
                    <Skeleton className="h-20 w-full"/>
                </div>
            ) : (
                <>
                    <SearchSection ref={refs.firstRef} title="Tags" items={groupedResults.tag} type="tag"/>
                    <SearchSection ref={refs.secondRef} title="Folders" items={groupedResults.folder} type="folder"/>
                    <SearchSection ref={refs.thirdRef} title="Bookmarks" items={groupedResults.bookmark}
                                   type="bookmark"
                                   includeActions/>
                </>
            )}
            {isError && (
                <div className="text-red-500 text-center mt-4">
                    An error occurred: {(error as Error).message}
                </div>
            )}

            {!isLoading && searchResults.length === 0 && (
                <div className="flex flex-col items-center mt-10">
                    <SearchX size={48} className="text-gray-400"/>
                    <p className="text-gray-600 mt-2">No results found</p>
                </div>
            )}

        </div>
    );
};


export default SearchResults;
