import {useQuery} from "@tanstack/react-query";
import {QUERY_KEYS} from "@/lib/queryKeys";
import {searchAll} from "@/app/actions/search";
import {Filter, MatchMode} from "@/app/actions/enum";

export const useSearchResultsQuery = (searchTerm: string, filter: Filter, matchMode: MatchMode, userId: string | undefined) => {
    return useQuery({
        queryKey: [QUERY_KEYS.useSearchResultsQueryKey, searchTerm, filter, matchMode, userId],
        queryFn: () => searchAll(searchTerm, userId, filter, matchMode),
        enabled: !!searchTerm && !!userId,
    });
}
