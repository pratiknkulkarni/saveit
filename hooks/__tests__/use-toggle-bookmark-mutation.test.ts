import {renderHook, waitFor} from "@testing-library/react";
import {describe, it, expect, vi, beforeEach} from "vitest";
import {useToggleBookmarkMutation} from "../use-toggle-bookmark-mutation";
import {createQueryClientWrapper} from "@/tests/wrapper";
import * as bookmarkActions from "@/app/actions/bookmark";
import {useQueryClient} from "@tanstack/react-query";
import {QUERY_KEYS} from "@/lib/queryKeys";

vi.mock("@/app/actions/bookmark", () => ({
    toggleBookmarkFavorite: vi.fn(),
}));

describe("useToggleBookmarkMutation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should toggle favorite and INVALIDATE queries on success", async () => {
        vi.mocked(bookmarkActions.toggleBookmarkFavorite).mockResolvedValue({success: true} as any);

        let queryClientSpy: any;
        const {result} = renderHook(() => {
            queryClientSpy = useQueryClient();
            return useToggleBookmarkMutation();
        }, {
            wrapper: createQueryClientWrapper(),
        });

        const invalidateSpy = vi.spyOn(queryClientSpy, "invalidateQueries");

        result.current.mutate({bookmarkId: 50, isFavorite: true});

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(invalidateSpy).toHaveBeenCalledWith({queryKey: [QUERY_KEYS.useBookmarksOnHomePageQueryKey]});
    });
});