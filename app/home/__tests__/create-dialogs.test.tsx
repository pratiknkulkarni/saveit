import React from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {render, screen, waitFor} from "@testing-library/react";
import {userEvent} from "@testing-library/user-event";
import "@testing-library/jest-dom";
import CreateFolderDialog from "@/app/home/components/CreateFolderDialog";
import CreateTagDialog from "@/app/home/components/CreateTagDialog";
import {createFolders} from "@/app/actions/folders";
import {createNewTags} from "@/app/actions/tags";
import {createQueryClientWrapper} from "@/tests/wrapper";

/**
 * Covers the create half of Phase 5 smoke items 2 and 3. These are the three
 * call sites Phase 3 changed when userId was dropped from the server actions
 * (CreateFolderDialog, CreateTagDialog, and TagInput's createNewTags) — the
 * server side is covered in app/actions/__tests__, but nothing exercised the
 * argument shape the components actually send.
 */

vi.mock("@/app/actions/folders", () => ({
    createFolders: vi.fn(),
}));

vi.mock("@/app/actions/tags", () => ({
    createNewTags: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
    useToast: () => ({toast: vi.fn(), dismiss: vi.fn(), toasts: []}),
}));

const renderWithClient = (ui: React.ReactElement) =>
    render(ui, {wrapper: createQueryClientWrapper()});

describe("CreateFolderDialog", () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(createFolders).mockResolvedValue({success: true, data: 1} as never);
    });

    it("submits folder names without a userId", async () => {
        const user = userEvent.setup();
        renderWithClient(<CreateFolderDialog/>);

        await user.click(screen.getByRole("button", {name: /New Folder/i}));

        const input = await screen.findByPlaceholderText("Enter folder name (press Enter to add)");
        await user.type(input, "Reading List{Enter}");
        await user.type(input, "Archive{Enter}");

        await user.click(screen.getByRole("button", {name: "Submit"}));

        await waitFor(() => expect(createFolders).toHaveBeenCalledTimes(1));
        expect(createFolders).toHaveBeenCalledWith({names: ["Reading List", "Archive"]});
        expect(vi.mocked(createFolders).mock.calls[0][0]).not.toHaveProperty("userId");
    });

    it("keeps Submit disabled until a folder has been added", async () => {
        const user = userEvent.setup();
        renderWithClient(<CreateFolderDialog/>);

        await user.click(screen.getByRole("button", {name: /New Folder/i}));

        expect(await screen.findByRole("button", {name: "Submit"})).toBeDisabled();

        await user.type(
            screen.getByPlaceholderText("Enter folder name (press Enter to add)"),
            "Reading List{Enter}"
        );

        expect(screen.getByRole("button", {name: "Submit"})).toBeEnabled();
    });

    it("does not add the same folder name twice", async () => {
        const user = userEvent.setup();
        renderWithClient(<CreateFolderDialog/>);

        await user.click(screen.getByRole("button", {name: /New Folder/i}));

        const input = await screen.findByPlaceholderText("Enter folder name (press Enter to add)");
        await user.type(input, "Duplicate{Enter}");
        await user.type(input, "Duplicate{Enter}");

        await user.click(screen.getByRole("button", {name: "Submit"}));

        await waitFor(() => expect(createFolders).toHaveBeenCalledTimes(1));
        expect(createFolders).toHaveBeenCalledWith({names: ["Duplicate"]});
    });
});

describe("CreateTagDialog", () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(createNewTags).mockResolvedValue({success: true, data: 1} as never);
    });

    it("submits tag names without a userId", async () => {
        const user = userEvent.setup();
        renderWithClient(<CreateTagDialog/>);

        await user.click(screen.getByRole("button", {name: /New Tag/i}));

        const input = await screen.findByPlaceholderText(/press Enter to add/i);
        await user.type(input, "React{Enter}");
        await user.type(input, "NextJS{Enter}");

        await user.click(screen.getByRole("button", {name: "Submit"}));

        await waitFor(() => expect(createNewTags).toHaveBeenCalledTimes(1));
        expect(createNewTags).toHaveBeenCalledWith({tags: ["React", "NextJS"]});
        expect(vi.mocked(createNewTags).mock.calls[0][0]).not.toHaveProperty("userId");
    });
});
