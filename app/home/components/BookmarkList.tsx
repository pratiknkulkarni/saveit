"use client"

import {useEffect, useRef, useState} from 'react'
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {useBookmarksOnHomePageQuery} from '@/hooks/use-bookmarks-on-home-page-query'
import {useSettings} from "@/app/context/SettingsContext";
import {authClient} from "@/lib/auth-client";
import {useTagsForBookmarksQuery} from "@/hooks/use-tags-for-bookmarks-query";
import {Skeleton} from "@/components/ui/skeleton";
import BookmarkCard from "@/app/home/components/BookmarkCard";

const BookmarksList = ({userId}: { userId: string }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const {data: session} = authClient.useSession();
    const topRef = useRef<HTMLDivElement>(null);
    const {settings} = useSettings();
    const [bookmarkIds, setBookmarkIds] = useState<number[]>([]);
    const pageSize = settings.itemsPerPage;

    // get the bookmarks
    const {data: bookmarksResponse, isLoading} = useBookmarksOnHomePageQuery(userId, currentPage, pageSize);

    // get the tags
    const {
        data: bookmarkTagsResponse,
        refetch: refetchBookmarkTagsResponse
    } = useTagsForBookmarksQuery(session?.user?.id, bookmarkIds);

    useEffect(() => {
        if (bookmarksResponse?.success && bookmarksResponse?.data) {
            setBookmarkIds(bookmarksResponse.data.data.map(bookmark => bookmark.id));

            // adding a 10 ms delay for the bookmarks to be displayed
            setTimeout(() => {
                void refetchBookmarkTagsResponse()
            }, 10)
        }
    }, [bookmarksResponse]);


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

    if (bookmarksResponse?.success && bookmarksResponse.data.data.length === 0) {
        return (
            <div className={"w-full h-screen flex flex-col justify-center items-center"}>
                <div>No bookmarks found, add a new one to get started</div>
            </div>
        )
    }

    if (!bookmarksResponse?.success) return <div>Error: {bookmarksResponse?.error}</div>;

    const {data: bookmarks, metadata} = bookmarksResponse.data;

    console.log(bookmarks);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        topRef.current?.scrollIntoView({block: "start"});
    };

    return (
        <div ref={topRef}>
            <ul className="space-y-4">
                {bookmarks.map((bookmark) => (
                    bookmarkTagsResponse &&
                    <BookmarkCard key={bookmark.id} bookmark={bookmark} bookmarkTagsResponse={bookmarkTagsResponse}/>
                ))}
            </ul>
            {metadata.totalPages > 1 && (
                <Pagination className="mt-4 pb-4">
                    <PaginationContent>
                        <PaginationItem className="cursor-pointer">
                            <PaginationPrevious
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                        </PaginationItem>

                        {[...Array(metadata.totalPages)].map((_, index) => {
                            const page = index + 1;
                            if (
                                page === 1 ||
                                page === metadata.totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                                return (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            isActive={currentPage === page}
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            } else if (
                                (page === currentPage - 2 && currentPage > 3) ||
                                (page === currentPage + 2 && currentPage < metadata.totalPages - 2)
                            ) {
                                return <PaginationEllipsis key={page}/>;
                            }
                            return null;
                        })}

                        <PaginationItem className="cursor-pointer">
                            <PaginationNext
                                onClick={() => handlePageChange(Math.min(metadata.totalPages, currentPage + 1))}
                                className={currentPage === metadata.totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}

export default BookmarksList;