import {useMutation} from "@tanstack/react-query";
import {deleteBookmarkByUserId} from "@/app/actions/bookmark";


export const useDeleteBookmarkMutation = (userId: string | undefined) => {
    return useMutation({
        mutationFn: (bookmarkId: number) => deleteBookmarkByUserId(userId, bookmarkId),
    });
}