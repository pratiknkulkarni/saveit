import {deleteFolder} from "@/app/actions/folders";
import {useMutation} from "@tanstack/react-query";

export const useDeleteFolderMutation = (
    _userId: string | undefined //TODO: remove this, keeping for not breaking the UI
) => {
    return useMutation({
        mutationFn: (folderId: number) => deleteFolder({folderId})
    });
};
