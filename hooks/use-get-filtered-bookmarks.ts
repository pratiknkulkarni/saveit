import {useQuery} from "@tanstack/react-query";
import {getFilteredBookmarks} from "@/app/actions/filters";
import {QUERY_KEYS} from "@/lib/queryKeys";

export const useGetFilteredBookmarks = (folderId?: number, tagIds?: number[]) => {
    return useQuery({
        queryKey: [QUERY_KEYS.useFilteredBookmarksQuery, folderId, tagIds],
        queryFn: () => getFilteredBookmarks({folderId, tagIds}),
        enabled: !!folderId || (tagIds && tagIds.length > 0),
        select: (response) =>
            response.success && response.data
                ? response.data.map((bookmark) => ({
                    id: bookmark.id,
                    url: bookmark.url,
                    title: bookmark.title,
                    description: bookmark.description,
                    folderId: bookmark.folderId,
                    tags: bookmark.tags,
                    createdAt: bookmark.createdAt,
                    updatedAt: bookmark.updatedAt,
                    isFavorite: bookmark.isFavorite,
                    isArchived: bookmark.isArchived,
                }))
                : [],
    });
};