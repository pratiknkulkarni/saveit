import {useMutation} from "@tanstack/react-query";
import {deleteTag} from "@/app/actions/tags";

export const useDeleteTagMutation = (userId: string | undefined) => {
    return useMutation({
        mutationFn: (tagId: number) => deleteTag({tagId, userId})
    });
}