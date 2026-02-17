import {useMutation, useQueryClient} from "@tanstack/react-query";
import {deleteTag} from "@/app/actions/tags";
import {QUERY_KEYS} from "@/lib/queryKeys";

export const useDeleteTagMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (tagId: number) => deleteTag({tagId}),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useGetUserTagsQueryKey]}),
                queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useBookmarksOnHomePageQueryKey]}),
                queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useTagsForBookmarksQueryKey]})
            ]);
        }
    });
}