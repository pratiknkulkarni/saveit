import {useMutation} from "@tanstack/react-query";
import {createBookmark} from "@/app/actions/bookmark";

// export const useCreateBookmarkMutation = () => {
//     return useMutation({
//         mutationFn: ({formData, userId}: { formData: FormData; userId: string }) => createBookmark(formData)
//     });
// }

export const useCreateBookmarkMutation = () => {
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await createBookmark(formData);
            if (!response.success) {
                throw new Error(response.error || "Failed to create bookmark");
            }
            return response;
        }
    })
}