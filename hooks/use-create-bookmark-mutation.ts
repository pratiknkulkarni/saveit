import {useMutation} from "@tanstack/react-query";
import {createBookmark} from "@/app/actions/bookmark";

export const useCreateBookmarkMutation = () => {
    return useMutation({
        mutationFn: ({formData, userId}: { formData: FormData; userId: string }) => createBookmark(formData, userId),
    });
}