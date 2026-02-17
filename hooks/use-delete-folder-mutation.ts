import {deleteFolder} from "@/app/actions/folders";
import {useMutation} from "@tanstack/react-query";

export const useDeleteFolderMutation = () => {
    return useMutation({
        mutationFn: (folderId: number) => deleteFolder({folderId})
    });
};
