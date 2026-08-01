import {useQuery} from "@tanstack/react-query";
import {GetUserFoldersResponse} from "@/app/actions/types";
import {getUserFolders} from "@/app/actions/folders";
import {QUERY_KEYS} from "@/lib/queryKeys";

export const useGetUserFoldersSidebarQuery = (userId: string | undefined) => {
    return useQuery<GetUserFoldersResponse>({
        queryKey: [QUERY_KEYS.useGetUserFoldersSidebarQuery, userId],
        queryFn: async () => await getUserFolders(),
        enabled: !!userId,
        retry: 3,
        retryDelay: 1000,
    });
}