import {useQuery} from "@tanstack/react-query";
import {getUserTags} from "@/app/actions/tags";
import {Tag} from "@/app/actions/types";
import {QUERY_KEYS} from "@/lib/queryKeys";

export const useGetUserTagsQuery = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.useGetUserTagsQueryKey],
        queryFn: () => getUserTags(),
        select: (response) =>
            response.success && response.data
                ? response.data.map((tag: Tag) => ({
                    id: tag.id,
                    name: tag.name,
                }))
                : [],
    });
};