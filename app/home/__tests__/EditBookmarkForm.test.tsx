import React from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {render, screen, waitFor} from "@testing-library/react";
import {userEvent} from "@testing-library/user-event";
import "@testing-library/jest-dom";
import EditBookmarkForm from "@/app/home/components/EditBookmarkForm";
import {updateBookmark} from "@/app/actions/bookmark";
import {createQueryClientWrapper} from "@/tests/wrapper";
import {Tag} from "@/app/actions/types";

/**
 * Covers Phase 5 smoke item 5: the `tagsModified` flag has to survive the trip
 * from the form, through `new FormData()`, into `updateBookmark`. The server-side
 * half is covered in app/actions/__tests__/bookmark.test.ts; this is the client
 * half, which had never run outside a browser.
 */

const {mockPush} = vi.hoisted(() => ({mockPush: vi.fn()}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({push: mockPush, replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn()}),
    usePathname: () => "/home",
}));

vi.mock("@/app/actions/bookmark", () => ({
    updateBookmark: vi.fn(),
}));

vi.mock("@/app/actions/folders", () => ({
    getUserFolders: vi.fn().mockResolvedValue({success: true, data: []}),
    createFolders: vi.fn(),
}));

vi.mock("@/app/actions/tags", () => ({
    getTagsForBookmark: vi.fn().mockResolvedValue({success: true, data: []}),
    createNewTags: vi.fn(),
}));

vi.mock("@/app/actions/metadatafetcher", () => ({
    fetchMetadata: vi.fn(),
}));

vi.mock("@/hooks/use-get-user-tags-query", () => ({
    useGetUserTagsQuery: () => ({data: [], refetch: vi.fn(), isRefetching: false}),
}));

vi.mock("@/lib/auth-client", () => ({
    authClient: {
        useSession: () => ({data: {user: {id: "edit-user-id"}}}),
    },
}));

vi.mock("@/app/context/SettingsContext", () => ({
    useSettings: () => ({settings: {bookmarkDisplay: []}}),
}));

vi.mock("@/hooks/use-toast", () => ({
    useToast: () => ({toast: vi.fn(), dismiss: vi.fn(), toasts: []}),
}));

// Driving the real TagInput means driving a popover + command palette. The
// contract under test is only "TagInput fired onChange", so stand in for it with
// a button that does exactly that.
vi.mock("@/app/home/components/TagInput", () => ({
    default: ({onChange}: { onChange: (tags: Tag[]) => void }) => (
        <button type="button" onClick={() => onChange([{id: 1, name: "React"}])}>
            change-tags
        </button>
    ),
}));

const bookmarkFormData = {
    id: 42,
    title: "Original Title",
    url: "https://example.com",
    description: "Original description",
    folderId: undefined,
};

const renderForm = () =>
    render(<EditBookmarkForm setOpen={vi.fn()} bookmarkFormData={bookmarkFormData}/>, {
        wrapper: createQueryClientWrapper(),
    });

/** Pulls the FormData that the mutation handed to updateBookmark. */
const submittedFormData = () => {
    const [formData, bookmarkId] = vi.mocked(updateBookmark).mock.calls[0];
    return {formData: formData as FormData, bookmarkId};
};

describe("EditBookmarkForm — tagsModified contract", () => {

    beforeEach(() => {
        vi.mocked(updateBookmark).mockResolvedValue({success: true, data: {id: 42}} as never);
        vi.mocked(updateBookmark).mockClear();
    });

    it("sends tagsModified=false when only the title was edited", async () => {
        const user = userEvent.setup();
        renderForm();

        const titleInput = await screen.findByDisplayValue("Original Title");
        await user.clear(titleInput);
        await user.type(titleInput, "Renamed Title");

        await user.click(screen.getByRole("button", {name: "Save Bookmark"}));

        await waitFor(() => expect(updateBookmark).toHaveBeenCalledTimes(1));

        const {formData, bookmarkId} = submittedFormData();
        // the whole point: the server gates its deleteMany/createMany on this
        expect(formData.get("tagsModified")).toBe("false");
        expect(formData.get("title")).toBe("Renamed Title");
        expect(bookmarkId).toBe(42);
    });

    it("sends tagsModified=true once TagInput reports a change", async () => {
        const user = userEvent.setup();
        renderForm();

        await user.click(await screen.findByRole("button", {name: "change-tags"}));
        await user.click(screen.getByRole("button", {name: "Save Bookmark"}));

        await waitFor(() => expect(updateBookmark).toHaveBeenCalledTimes(1));

        const {formData} = submittedFormData();
        expect(formData.get("tagsModified")).toBe("true");
        expect(JSON.parse(formData.get("tags") as string)).toEqual([{id: 1, name: "React"}]);
    });

    it("keeps the untouched fields intact on a title-only edit", async () => {
        const user = userEvent.setup();
        renderForm();

        const titleInput = await screen.findByDisplayValue("Original Title");
        await user.clear(titleInput);
        await user.type(titleInput, "Renamed Title");
        await user.click(screen.getByRole("button", {name: "Save Bookmark"}));

        await waitFor(() => expect(updateBookmark).toHaveBeenCalledTimes(1));

        const {formData} = submittedFormData();
        expect(formData.get("url")).toBe("https://example.com");
        expect(formData.get("description")).toBe("Original description");
    });
});
