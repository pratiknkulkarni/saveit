import {useMutation} from "@tanstack/react-query";
import {updateFolder} from "@/app/actions/folders";

export const useUpdateFolderBookmarkMutation = (
    _userId: string | undefined //TODO: remove this, keeping for not breaking the UI
) => {
    return useMutation({
        mutationFn: ({folderId, newFolderName}: { folderId: number, newFolderName: string }) => updateFolder({
            folderId,
            newFolderName,
        })
    });
};