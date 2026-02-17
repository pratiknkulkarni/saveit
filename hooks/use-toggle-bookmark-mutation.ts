import {useMutation, useQueryClient} from "@tanstack/react-query";
import {toggleBookmarkFavorite} from "@/app/actions/bookmark";
import {QUERY_KEYS} from "@/lib/queryKeys";

export const useToggleBookmarkMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({bookmarkId, isFavorite}: { bookmarkId: number, isFavorite: boolean }) =>
            toggleBookmarkFavorite(bookmarkId, isFavorite),

        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useBookmarksOnHomePageQueryKey]}),
                queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useFilteredBookmarksQuery]})
            ]);
        }
    });
}