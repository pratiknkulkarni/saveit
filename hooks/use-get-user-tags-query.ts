import {useQuery} from "@tanstack/react-query";
import {getUserTags} from "@/app/actions/tags";
import {Tag} from "@/app/actions/types";
import {QUERY_KEYS} from "@/lib/queryKeys";

export const useGetUserTagsQuery = (userId: string | undefined) => {
    return useQuery({
        queryKey: [QUERY_KEYS.useGetUserTagsQueryKey, userId],
        queryFn: () => getUserTags({userId}),
        enabled: !!userId,
        select: (response) =>
            response.success && response.data
                ? response.data.map((tag: Tag) => ({
                    id: tag.id,
                    name: tag.name,
                }))
                : [],
    });
};