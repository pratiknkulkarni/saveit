import {renderHook, waitFor} from "@testing-library/react";
import {describe, it, expect, vi, beforeEach} from "vitest";
import {useDeleteBookmarkMutation} from "../use-delete-bookmark-mutation";
import {createQueryClientWrapper} from "@/tests/wrapper"; // Ensure this path matches your setup
import * as bookmarkActions from "@/app/actions/bookmark";
import {useQueryClient} from "@tanstack/react-query";
import {QUERY_KEYS} from "@/lib/queryKeys";

vi.mock("@/app/actions/bookmark", () => ({
    deleteBookmarkByUserId: vi.fn(),
}));

describe("useDeleteBookmarkMutation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should delete and INVALIDATE queries on success", async () => {
        vi.mocked(bookmarkActions.deleteBookmarkByUserId).mockResolvedValue({success: true} as any);

        let queryClientSpy: any;
        const {result} = renderHook(() => {
            queryClientSpy = useQueryClient();
            return useDeleteBookmarkMutation("user-123");
        }, {
            wrapper: createQueryClientWrapper(),
        });

        const invalidateSpy = vi.spyOn(queryClientSpy, "invalidateQueries");

        result.current.mutate(99);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(invalidateSpy).toHaveBeenCalledWith({queryKey: [QUERY_KEYS.useBookmarksOnHomePageQueryKey]});
        expect(invalidateSpy).toHaveBeenCalledWith({queryKey: [QUERY_KEYS.useFilteredBookmarksQuery]});
    });
});