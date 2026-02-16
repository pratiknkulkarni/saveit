import {renderHook, waitFor} from "@testing-library/react";
import {describe, it, expect, vi, beforeEach} from "vitest";
import {useCreateBookmarkMutation} from "../use-create-bookmark-mutation";
import {createQueryClientWrapper} from "@/tests/wrapper"; // Import from the new file
import * as bookmarkActions from "@/app/actions/bookmark";

vi.mock("@/app/actions/bookmark", () => ({
    createBookmark: vi.fn(),
}));

describe("useCreateBookmarkMutation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should resolve successfully when server returns success: true", async () => {
        vi.mocked(bookmarkActions.createBookmark).mockResolvedValue({
            success: true,
            data: {id: 1, url: "https://example.com"} as any,
        });

        const {result} = renderHook(() => useCreateBookmarkMutation(), {
            wrapper: createQueryClientWrapper(),
        });

        const formData = new FormData();
        formData.append("url", "https://example.com");
        result.current.mutate(formData);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual({
            success: true,
            data: {id: 1, url: "https://example.com"},
        });
    });

    it("should THROW an error when server returns success: false", async () => {
        vi.mocked(bookmarkActions.createBookmark).mockResolvedValue({
            success: false,
            error: "Database constraint violated",
        });

        const {result} = renderHook(() => useCreateBookmarkMutation(), {
            wrapper: createQueryClientWrapper(),
        });

        const formData = new FormData();
        formData.append("url", "https://fail.com");
        result.current.mutate(formData);

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe("Database constraint violated");
    });
});