import {renderHook, waitFor} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {createQueryClientWrapper} from "@/tests/wrapper";
import {useDeleteBookmarkMutation} from "../use-delete-bookmark-mutation";
import {useToggleBookmarkMutation} from "../use-toggle-bookmark-mutation";
import {useDeleteFolderMutation} from "../use-delete-folder-mutation";
import {useDeleteTagMutation} from "../use-delete-tag-mutation";
import {useUpdateFolderBookmarkMutation} from "../use-update-folder-bookmark-mutation";
import {useUpdateTagBookmarkMutation} from "../use-update-tag-bookmark-mutation";
import {deleteBookmarkByUserId, toggleBookmarkFavorite} from "@/app/actions/bookmark";
import {deleteFolder, updateFolder} from "@/app/actions/folders";
import {deleteTag, updateTag} from "@/app/actions/tags";

/**
 * Covers Phase 5 smoke items 2, 3 and 6 at the client layer, and locks in the
 * Phase 3 rule: hooks keep `userId` for the react-query key and the `enabled`
 * guard, but must never forward it to a server action — the session is
 * authoritative there. Each case asserts the exact argument shape the action
 * receives, so re-adding a userId argument fails here.
 */

vi.mock("@/app/actions/bookmark", () => ({
    deleteBookmarkByUserId: vi.fn(),
    toggleBookmarkFavorite: vi.fn(),
}));

vi.mock("@/app/actions/folders", () => ({
    deleteFolder: vi.fn(),
    updateFolder: vi.fn(),
}));

vi.mock("@/app/actions/tags", () => ({
    deleteTag: vi.fn(),
    updateTag: vi.fn(),
}));

const USER_ID = "hook-user-id";

describe("mutation hooks do not forward userId to server actions", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("useDeleteBookmarkMutation calls deleteBookmarkByUserId(bookmarkId) only", async () => {
        vi.mocked(deleteBookmarkByUserId).mockResolvedValue({success: true} as never);

        const {result} = renderHook(() => useDeleteBookmarkMutation(USER_ID), {
            wrapper: createQueryClientWrapper(),
        });

        result.current.mutate(7);
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(deleteBookmarkByUserId).toHaveBeenCalledWith(7);
        expect(deleteBookmarkByUserId).toHaveBeenCalledTimes(1);
    });

    it("useToggleBookmarkMutation calls toggleBookmarkFavorite(bookmarkId, isFavorite)", async () => {
        vi.mocked(toggleBookmarkFavorite).mockResolvedValue({success: true} as never);

        const {result} = renderHook(() => useToggleBookmarkMutation(USER_ID), {
            wrapper: createQueryClientWrapper(),
        });

        result.current.mutate({bookmarkId: 12, isFavorite: true});
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(toggleBookmarkFavorite).toHaveBeenCalledWith(12, true);
    });

    it("useToggleBookmarkMutation passes the un-favourite direction through", async () => {
        vi.mocked(toggleBookmarkFavorite).mockResolvedValue({success: true} as never);

        const {result} = renderHook(() => useToggleBookmarkMutation(USER_ID), {
            wrapper: createQueryClientWrapper(),
        });

        result.current.mutate({bookmarkId: 12, isFavorite: false});
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(toggleBookmarkFavorite).toHaveBeenCalledWith(12, false);
    });

    it("useDeleteFolderMutation calls deleteFolder({folderId}) with no userId key", async () => {
        vi.mocked(deleteFolder).mockResolvedValue({success: true} as never);

        const {result} = renderHook(() => useDeleteFolderMutation(USER_ID), {
            wrapper: createQueryClientWrapper(),
        });

        result.current.mutate(3);
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(deleteFolder).toHaveBeenCalledWith({folderId: 3});
        expect(vi.mocked(deleteFolder).mock.calls[0][0]).not.toHaveProperty("userId");
    });

    it("useDeleteTagMutation calls deleteTag({tagId}) with no userId key", async () => {
        vi.mocked(deleteTag).mockResolvedValue({success: true} as never);

        const {result} = renderHook(() => useDeleteTagMutation(USER_ID), {
            wrapper: createQueryClientWrapper(),
        });

        result.current.mutate(9);
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(deleteTag).toHaveBeenCalledWith({tagId: 9});
        expect(vi.mocked(deleteTag).mock.calls[0][0]).not.toHaveProperty("userId");
    });

    it("useUpdateFolderBookmarkMutation renames via updateFolder({folderId, newFolderName})", async () => {
        vi.mocked(updateFolder).mockResolvedValue({success: true} as never);

        const {result} = renderHook(() => useUpdateFolderBookmarkMutation(USER_ID), {
            wrapper: createQueryClientWrapper(),
        });

        result.current.mutate({folderId: 3, newFolderName: "Renamed Folder"});
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(updateFolder).toHaveBeenCalledWith({folderId: 3, newFolderName: "Renamed Folder"});
        expect(vi.mocked(updateFolder).mock.calls[0][0]).not.toHaveProperty("userId");
    });

    it("useUpdateTagBookmarkMutation renames via updateTag({tagId, newTagName})", async () => {
        vi.mocked(updateTag).mockResolvedValue({success: true} as never);

        const {result} = renderHook(() => useUpdateTagBookmarkMutation(USER_ID), {
            wrapper: createQueryClientWrapper(),
        });

        result.current.mutate({tagId: 9, newTagName: "Renamed Tag"});
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(updateTag).toHaveBeenCalledWith({tagId: 9, newTagName: "Renamed Tag"});
        expect(vi.mocked(updateTag).mock.calls[0][0]).not.toHaveProperty("userId");
    });

    it("surfaces a rejected action as an error state", async () => {
        vi.mocked(deleteBookmarkByUserId).mockRejectedValue(new Error("Unauthorized"));

        const {result} = renderHook(() => useDeleteBookmarkMutation(USER_ID), {
            wrapper: createQueryClientWrapper(),
        });

        result.current.mutate(7);
        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error?.message).toBe("Unauthorized");
    });
});
