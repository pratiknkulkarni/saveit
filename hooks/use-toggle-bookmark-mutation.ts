import {useMutation} from "@tanstack/react-query";
import {toggleBookmarkFavorite} from "@/app/actions/bookmark";

export const useToggleBookmarkMutation = (userId: string | undefined) => {
    return useMutation({
        mutationFn: ({
                         bookmarkId, isFavorite
                     }: {
            bookmarkId: number, isFavorite: boolean
        }) => toggleBookmarkFavorite(userId, bookmarkId, isFavorite),
    });
}