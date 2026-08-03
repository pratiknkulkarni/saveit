import {describe, it, vi, beforeEach, expect} from "vitest";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react"
import "@testing-library/jest-dom";
import {userEvent} from "@testing-library/user-event";
import AccountSettings from "@/app/settings/components/AccountSettings";
import {authClient} from "@/lib/auth-client";
import {useToast} from "@/hooks/use-toast";

vi.mock("@/lib/auth-client", () => ({
    authClient: {
        changePassword: vi.fn(),
        deleteUser: vi.fn(),
    }
}));

vi.mock("@/hooks/use-toast", () => ({
    useToast: vi.fn()
}));

const {mockPush} = vi.hoisted(() => ({mockPush: vi.fn()}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
        replace: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
    })
}));

describe("AccountSettings", () => {
    const mockToast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useToast).mockReturnValue({
            toast: mockToast,
            dismiss: vi.fn(),
            toasts: []
        });
    });

    it("renders change password and delete account sections", () => {
        render(<AccountSettings/>);

        expect(screen.getByText("Change Password")).toBeInTheDocument();
        expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
        expect(screen.getByLabelText("New Password")).toBeInTheDocument();
        expect(screen.getByLabelText("Confirm New Password")).toBeInTheDocument();

        expect(screen.getAllByText("Delete Account").length).toBeGreaterThanOrEqual(2);
        expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    });

    it("submits a password change with the current and new password", async () => {
        vi.mocked(authClient.changePassword).mockImplementation(async (_body, options) => {
            options?.onSuccess?.({} as never);
            return {} as never;
        });

        render(<AccountSettings/>);

        await userEvent.type(screen.getByLabelText("Current Password"), "oldpassword123");
        await userEvent.type(screen.getByLabelText("New Password"), "newpassword123");
        await userEvent.type(screen.getByLabelText("Confirm New Password"), "newpassword123");

        fireEvent.submit(screen.getByRole("button", {name: "Update Password"}));

        await waitFor(() => {
            expect(authClient.changePassword).toHaveBeenCalledWith({
                currentPassword: "oldpassword123",
                newPassword: "newpassword123",
                revokeOtherSessions: true,
            }, expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }));
        });
        expect(mockToast).toHaveBeenCalledWith({title: "Password updated successfully."});
    });

    it("shows a validation error when the new passwords do not match", async () => {
        render(<AccountSettings/>);

        await userEvent.type(screen.getByLabelText("Current Password"), "oldpassword123");
        await userEvent.type(screen.getByLabelText("New Password"), "newpassword123");
        await userEvent.type(screen.getByLabelText("Confirm New Password"), "differentpassword");

        fireEvent.submit(screen.getByRole("button", {name: "Update Password"}));

        await waitFor(() => {
            expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
        });
        expect(authClient.changePassword).not.toHaveBeenCalled();
    });

    it("deletes the account after confirming the password and the dialog", async () => {
        vi.mocked(authClient.deleteUser).mockImplementation(async (_body, options) => {
            options?.onSuccess?.({} as never);
            return {} as never;
        });

        render(<AccountSettings/>);

        await userEvent.type(screen.getByLabelText("Confirm Password"), "mypassword123");
        await userEvent.click(screen.getByRole("button", {name: "Delete Account"}));

        const dialog = await screen.findByRole("alertdialog");
        await userEvent.click(within(dialog).getByRole("button", {name: "Delete Account"}));

        await waitFor(() => {
            expect(authClient.deleteUser).toHaveBeenCalledWith({
                password: "mypassword123",
            }, expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }));
        });
        expect(mockToast).toHaveBeenCalledWith({title: "Your account has been deleted."});
        expect(mockPush).toHaveBeenCalledWith("/login");
    });

    it("does not open the delete confirmation dialog without a password", async () => {
        render(<AccountSettings/>);

        await userEvent.click(screen.getByRole("button", {name: "Delete Account"}));

        await waitFor(() => {
            expect(screen.getByText("Password is required")).toBeInTheDocument();
        });
        expect(screen.queryByText("Delete Account Confirmation?")).not.toBeInTheDocument();
    });
});
