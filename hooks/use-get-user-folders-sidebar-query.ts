import {useQuery} from "@tanstack/react-query";
import {GetUserFoldersResponse} from "@/app/actions/types";
import {getUserFolders} from "@/app/actions/folders";
import {QUERY_KEYS} from "@/lib/queryKeys";

export const useGetUserFoldersSidebarQuery = () => {
    return useQuery<GetUserFoldersResponse>({
        queryKey: [QUERY_KEYS.useGetUserFoldersSidebarQuery],
        queryFn: async () => await getUserFolders(),
        retry: 3,
        retryDelay: 1000,
    });
}