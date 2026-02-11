import {describe, it, expect, vi, beforeEach} from "vitest";
import {commitSettings, getUserSettings, applyDefaultSettings} from "../settings";
import {prisma} from "@/lib/prisma";

vi.mock("@/lib/auth-server", () => ({
    getCurrentUser: vi.fn().mockResolvedValue({id: "settings-user", email: "settings@test.com"}),
}));

describe("Server Action: Settings", () => {

    beforeEach(async () => {
        await prisma.user.create({
            data: {
                id: "settings-user",
                name: "Settings User",
                email: "settings@test.com",
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
    });

    it("should apply default settings", async () => {
        const response = await applyDefaultSettings({userId: "settings-user"});
        expect(response.success).toBe(true);

        const settings = await prisma.settings.findUnique({where: {userId: "settings-user"}});
        expect(settings?.theme).toBe("light");
        expect(settings?.itemsPerPage).toBe(20);
    });

    it("should update existing settings (Partial Update)", async () => {
        await applyDefaultSettings({userId: "settings-user"});

        const response = await commitSettings({theme: "dark"});
        expect(response.success).toBe(true);

        const settings = await prisma.settings.findUnique({where: {userId: "settings-user"}});
        expect(settings?.theme).toBe("dark");
        expect(settings?.itemsPerPage).toBe(20); // Should remain unchanged
    });

    it("should retrieve user settings", async () => {
        await applyDefaultSettings({userId: "settings-user"});
        await commitSettings({itemsPerPage: 50});

        const settings = await getUserSettings();
        expect(settings?.itemsPerPage).toBe(50);
    });

    it("should fail validation for invalid inputs", async () => {
        await applyDefaultSettings({userId: "settings-user"});

        const response = await commitSettings({itemsPerPage: -5});

        expect(response.success).toBe(false);
        expect(response.message).toBe("Invalid settings provided.");
    });
});