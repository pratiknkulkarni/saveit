import {useMutation} from "@tanstack/react-query";
import {deleteBookmarkByUserId} from "@/app/actions/bookmark";


export const useDeleteBookmarkMutation = (
    _userId: string | undefined //TODO: remove this, keeping for not breaking the UI
) => {
    return useMutation({
        mutationFn: (bookmarkId: number) => deleteBookmarkByUserId(bookmarkId),
    });
}