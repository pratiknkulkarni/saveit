import {useQuery} from '@tanstack/react-query';
import {getBookmarksByUserId} from "@/app/actions/bookmark";
import {QUERY_KEYS} from "@/lib/queryKeys";

export const useBookmarksOnHomePageQuery = (page: number = 1, pageSize: number = 10) => {
    return useQuery({
        queryKey: [QUERY_KEYS.useBookmarksOnHomePageQueryKey, page, pageSize],
        queryFn: () => getBookmarksByUserId(page, pageSize),
    });
};