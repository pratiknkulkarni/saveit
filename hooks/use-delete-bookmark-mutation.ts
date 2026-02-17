import {useMutation, useQueryClient} from "@tanstack/react-query";
import {deleteBookmarkByUserId} from "@/app/actions/bookmark";
import {QUERY_KEYS} from "@/lib/queryKeys";

export const useDeleteBookmarkMutation = (userId: string | undefined) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (bookmarkId: number) => deleteBookmarkByUserId(bookmarkId),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useBookmarksOnHomePageQueryKey]}),
                queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useFilteredBookmarksQuery]}),
                queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useTagsForBookmarksQueryKey]})
            ])
        }
    });
}
