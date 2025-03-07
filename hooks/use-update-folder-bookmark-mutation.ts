import {useMutation} from "@tanstack/react-query";
import {updateFolder} from "@/app/actions/folders";

export const useUpdateFolderBookmarkMutation = (userId: string | undefined) => {
    return useMutation({
        mutationFn: ({folderId, newFolderName}: { folderId: number, newFolderName: string }) => updateFolder({
            folderId,
            newFolderName,
            userId,
        })
    });
};