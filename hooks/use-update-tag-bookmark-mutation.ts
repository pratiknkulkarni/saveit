import {useMutation} from "@tanstack/react-query";
import {updateTag} from "@/app/actions/tags";

export const useUpdateTagBookmarkMutation = (userId: string | undefined) => {
    return useMutation({
        mutationFn: ({tagId, newTagName}: { tagId: number, newTagName: string }) => updateTag({
            tagId,
            newTagName,
        })
    });
};