import {beforeEach, describe, expect, it, vi} from "vitest";
import {loginUser, registerUser} from "../auth";
import {applyDefaultSettings} from "@/app/actions/settings";
import {authClient} from "@/lib/auth-client";

/**
 * Covers Phase 5 smoke item 1. `registerUser` is not a server action — it runs in
 * the browser, calls better-auth over HTTP and then invokes `applyDefaultSettings`
 * itself. Hitting /api/auth directly therefore never creates the settings row, so
 * this wiring is only observable from the client side.
 */

vi.mock("@/lib/auth-client", () => ({
    authClient: {
        signUp: {email: vi.fn()},
        signIn: {email: vi.fn()},
    },
}));

vi.mock("@/app/actions/settings", () => ({
    applyDefaultSettings: vi.fn().mockResolvedValue({success: true}),
}));

const signUpResponse = (overrides = {}) => ({
    data: {
        token: "token-123",
        user: {
            id: "new-user-id",
            email: "person@example.com",
            name: "",
            image: null,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    },
    error: null,
    ...overrides,
});

describe("registerUser", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("applies default settings for the newly created user", async () => {
        vi.mocked(authClient.signUp.email).mockResolvedValue(signUpResponse() as never);

        const result = await registerUser({
            email: "person@example.com",
            password: "validpassword123",
            name: "",
            callbackURL: "",
        });

        expect(applyDefaultSettings).toHaveBeenCalledWith({userId: "new-user-id"});
        expect(result.error).toBeNull();
    });

    it("defaults callbackURL to /home when none is given", async () => {
        vi.mocked(authClient.signUp.email).mockResolvedValue(signUpResponse() as never);

        await registerUser({email: "person@example.com", password: "validpassword123", name: "", callbackURL: ""});

        expect(authClient.signUp.email).toHaveBeenCalledWith(
            expect.objectContaining({callbackURL: "/home"})
        );
    });

    it("does not apply settings when sign-up fails", async () => {
        vi.mocked(authClient.signUp.email).mockResolvedValue({
            data: null,
            error: {code: "USER_ALREADY_EXISTS", message: "User already exists"},
        } as never);

        const result = await registerUser({
            email: "taken@example.com",
            password: "validpassword123",
            name: "",
            callbackURL: "",
        });

        expect(applyDefaultSettings).not.toHaveBeenCalled();
        expect(result.error).not.toBeNull();
    });

    it("rethrows and does not swallow an unexpected failure", async () => {
        vi.mocked(authClient.signUp.email).mockRejectedValue(new Error("network down"));

        await expect(registerUser({
            email: "person@example.com",
            password: "validpassword123",
            name: "",
            callbackURL: "",
        })).rejects.toThrow("network down");

        expect(applyDefaultSettings).not.toHaveBeenCalled();
    });
});

describe("loginUser", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns the session on success", async () => {
        vi.mocked(authClient.signIn.email).mockResolvedValue(signUpResponse() as never);

        const result = await loginUser({email: "person@example.com", password: "validpassword123"});

        expect(result.error).toBeNull();
        expect(result.data?.user.id).toBe("new-user-id");
    });

    it("returns the error rather than throwing on bad credentials", async () => {
        vi.mocked(authClient.signIn.email).mockResolvedValue({
            data: null,
            error: {code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid email or password"},
        } as never);

        const result = await loginUser({email: "person@example.com", password: "wrong"});

        expect(result.error?.code).toBe("INVALID_EMAIL_OR_PASSWORD");
    });
});
