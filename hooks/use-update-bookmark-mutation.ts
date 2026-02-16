import {useMutation} from "@tanstack/react-query";
import {updateBookmark} from "@/app/actions/bookmark";

interface UpdateBookmarkParams {
    formData: FormData;
    bookmarkId: number;
}

export const useUpdateBookmarkMutation = () => {
    return useMutation({
        mutationFn: async ({formData, bookmarkId}: UpdateBookmarkParams) => {
            const response = await updateBookmark(formData, bookmarkId);

            if (!response.success) {
                throw new Error(response.error || "Failed to update bookmark");
            }

            return response;
        }
    });
};