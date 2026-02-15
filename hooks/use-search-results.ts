import {useQuery} from "@tanstack/react-query";
import {searchAll} from "@/app/actions/search";
import {Filter, MatchMode} from "@/app/actions/search_enum";
import {QUERY_KEYS} from "@/lib/queryKeys";

export const useSearchResultsQuery = (
    searchTerm: string,
    filter: Filter,
    matchMode: MatchMode,
    userId: string | undefined //TODO: remove this, keeping for not breaking the UI
) => {
    return useQuery({
        queryKey: [QUERY_KEYS.useSearchResultsQueryKey, searchTerm, filter, matchMode],
        queryFn: () => searchAll(searchTerm, filter, matchMode),
        enabled: !!searchTerm && searchTerm.length > 0 && !!userId,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5
    });
}