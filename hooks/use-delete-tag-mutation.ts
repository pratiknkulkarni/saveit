import {useMutation} from "@tanstack/react-query";
import {deleteTag} from "@/app/actions/tags";

export const useDeleteTagMutation = (
    _userId: string | undefined //TODO: remove this, keeping for not breaking the UI
) => {
    return useMutation({
        mutationFn: (tagId: number) => deleteTag({tagId})
    });
}