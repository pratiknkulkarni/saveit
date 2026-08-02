import React from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {render, screen, waitFor} from "@testing-library/react";
import {userEvent} from "@testing-library/user-event";
import "@testing-library/jest-dom";
import TagInput from "@/app/home/components/TagInput";
import {createNewTags} from "@/app/actions/tags";
import {Tag} from "@/app/actions/types";

/**
 * The last of the call sites Phase 3 changed: TagInput creates tags inline and
 * must not send a userId. It still *accepts* a userId prop so the existing call
 * sites keep compiling — the point of this suite is that the prop goes nowhere
 * near the server action.
 */

vi.mock("@/app/actions/tags", () => ({
    createNewTags: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
    useToast: () => ({toast: mockToast, dismiss: vi.fn(), toasts: []}),
}));

const {mockToast} = vi.hoisted(() => ({mockToast: vi.fn()}));

const existingTags: Tag[] = [
    {id: 1, name: "React"},
    {id: 2, name: "NextJS"},
];

const renderTagInput = (overrides: Partial<React.ComponentProps<typeof TagInput>> = {}) => {
    const onChange = vi.fn();
    const refetchTags = vi.fn().mockResolvedValue({data: []});

    render(
        <TagInput
            tags={existingTags}
            selectedTags={[]}
            onChange={onChange}
            userId="tag-input-user-id"
            isTagsRefetching={false}
            refetchTags={refetchTags as never}
            {...overrides}
        />
    );

    return {onChange, refetchTags};
};

/**
 * A selected tag is rendered twice — once as a removable chip, once as a row in
 * the command list — so text alone is ambiguous. Scope to the cmdk item.
 */
const commandItem = (name: string) => {
    const match = screen.getAllByText(name).find((el) => el.closest("[cmdk-item]"));
    if (!match) throw new Error(`no command item labelled "${name}"`);
    return match;
};

describe("TagInput", () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(createNewTags).mockResolvedValue({success: true, data: 1} as never);
    });

    it("creates a tag without forwarding the userId prop", async () => {
        const user = userEvent.setup();
        const {refetchTags} = renderTagInput();

        await user.click(screen.getByRole("combobox"));
        await user.type(await screen.findByPlaceholderText("Search tags..."), "Postgres");

        await user.click(await screen.findByRole("button", {name: /Create/i}));

        await waitFor(() => expect(createNewTags).toHaveBeenCalledTimes(1));
        expect(createNewTags).toHaveBeenCalledWith({tags: ["Postgres"]});
        expect(vi.mocked(createNewTags).mock.calls[0][0]).not.toHaveProperty("userId");

        // the new tag has to show up in the list without a page reload
        await waitFor(() => expect(refetchTags).toHaveBeenCalled());
    });

    it("refuses to create an empty tag", async () => {
        const user = userEvent.setup();
        // the Create button lives inside CommandEmpty, which only renders when
        // nothing matches — so start from an empty tag list
        renderTagInput({tags: []});

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("button", {name: /Create/i}));

        expect(createNewTags).not.toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({title: "Tag name cannot be empty"})
        );
    });

    it("reports selection back through onChange", async () => {
        const user = userEvent.setup();
        const {onChange} = renderTagInput();

        await user.click(screen.getByRole("combobox"));
        await screen.findByPlaceholderText("Search tags...");
        await user.click(commandItem("React"));

        expect(onChange).toHaveBeenCalledWith([{id: 1, name: "React"}]);
    });

    it("deselects an already-selected tag", async () => {
        const user = userEvent.setup();
        const {onChange} = renderTagInput({selectedTags: [existingTags[0]]});

        await user.click(screen.getByRole("combobox"));
        await screen.findByPlaceholderText("Search tags...");
        await user.click(commandItem("React"));

        expect(onChange).toHaveBeenCalledWith([]);
    });
});
