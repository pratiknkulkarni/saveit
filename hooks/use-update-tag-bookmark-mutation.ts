import {useMutation} from "@tanstack/react-query";
import {updateTag} from "@/app/actions/tags";

export const useUpdateTagBookmarkMutation = (
    _userId: string | undefined //TODO: remove this, keeping for not breaking the UI
) => {
    return useMutation({
        mutationFn: ({tagId, newTagName}: { tagId: number, newTagName: string }) => updateTag({
            tagId,
            newTagName,
        })
    });
};