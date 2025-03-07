import {useQuery} from "@tanstack/react-query";
import {getUserFolders} from "@/app/actions/folders";
import {QUERY_KEYS} from "@/lib/queryKeys";

export const useGetUserFoldersQuery = (userId: string | undefined) => {
    return useQuery({
        queryKey: [QUERY_KEYS.useGetUserFoldersQueryKey, userId],
        queryFn: () => getUserFolders({userId}),
        enabled: !!userId,
        select: (response) =>
            response.success && response.data
                ? response.data.map((folder: { id: number; name: string }) => ({
                    id: folder.id.toString(),
                    name: folder.name,
                }))
                : [],
    });
};