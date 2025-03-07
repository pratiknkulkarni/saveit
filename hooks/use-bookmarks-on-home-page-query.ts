import {useQuery} from '@tanstack/react-query';
import {getBookmarksByUserId} from "@/app/actions/bookmark";
import {QUERY_KEYS} from "@/lib/queryKeys";

export const useBookmarksOnHomePageQuery = (userId: string, page: number = 1, pageSize: number = 10) => {
    return useQuery({
        queryKey: [QUERY_KEYS.useBookmarksOnHomePageQueryKey, userId, page, pageSize],
        queryFn: () => getBookmarksByUserId(userId, page, pageSize),
    });
};