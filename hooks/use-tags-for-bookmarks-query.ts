import {useQuery} from "@tanstack/react-query";
import {GetFormattedTagsForBookmarksResponse} from "@/app/actions/types";
import {getFormattedTagsForBookmarks} from "@/app/actions/tags";
import {QUERY_KEYS} from "@/lib/queryKeys";

export const useTagsForBookmarksQuery = (userId: string | undefined, bookmarkIds: number[]) => {
    return useQuery<GetFormattedTagsForBookmarksResponse>({
        queryKey: [QUERY_KEYS.useTagsForBookmarksQueryKey, userId],
        queryFn: async () => await getFormattedTagsForBookmarks(bookmarkIds),
        retry: 3,
        retryDelay: 1000,
        enabled: false,
    });
}