import {deleteFolder} from "@/app/actions/folders";
import {useMutation} from "@tanstack/react-query";

export const useDeleteFolderMutation = (userId: string | undefined) => {
    return useMutation({
        mutationFn: (folderId: number) => deleteFolder({folderId, userId})
    });
};
