import {renderHook, waitFor} from "@testing-library/react";
import {describe, it, expect, vi, beforeEach} from "vitest";
import {useUpdateBookmarkMutation} from "../use-update-bookmark-mutation";
import {createQueryClientWrapper} from "@/tests/wrapper";
import * as bookmarkActions from "@/app/actions/bookmark";

vi.mock("@/app/actions/bookmark", () => ({
    updateBookmark: vi.fn(),
}));

describe("useUpdateBookmarkMutation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should resolve when server returns success", async () => {
        vi.mocked(bookmarkActions.updateBookmark).mockResolvedValue({
            success: true,
            message: "Updated",
        });

        const {result} = renderHook(() => useUpdateBookmarkMutation(), {
            wrapper: createQueryClientWrapper(),
        });

        result.current.mutate({formData: new FormData(), bookmarkId: 123});

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it("should THROW when server returns success: false", async () => {
        vi.mocked(bookmarkActions.updateBookmark).mockResolvedValue({
            success: false,
            error: "Unauthorized access",
        });

        const {result} = renderHook(() => useUpdateBookmarkMutation(), {
            wrapper: createQueryClientWrapper(),
        });

        result.current.mutate({formData: new FormData(), bookmarkId: 123});

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error?.message).toBe("Unauthorized access");
    });
});