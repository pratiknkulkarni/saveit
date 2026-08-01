import {useMutation} from "@tanstack/react-query";
import {toggleBookmarkFavorite} from "@/app/actions/bookmark";

export const useToggleBookmarkMutation = (
    _userId: string | undefined //TODO: remove this, keeping for not breaking the UI
) => {
    return useMutation({
        mutationFn: ({
                         bookmarkId, isFavorite
                     }: {
            bookmarkId: number, isFavorite: boolean
        }) => toggleBookmarkFavorite(bookmarkId, isFavorite),
    });
}