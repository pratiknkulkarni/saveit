import {useQuery} from "@tanstack/react-query";
import {getUserFolders} from "@/app/actions/folders";
import {QUERY_KEYS} from "@/lib/queryKeys";

export const useGetUserFoldersQuery = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.useGetUserFoldersQueryKey],
        queryFn: () => getUserFolders(),
        select: (response) =>
            response.success && response.data
                ? response.data.map((folder: { id: number; name: string }) => ({
                    id: folder.id.toString(),
                    name: folder.name,
                }))
                : [],
    });
};