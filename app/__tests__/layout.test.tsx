import type React from "react"
import {render} from "@testing-library/react"
import {describe, it, expect, vi} from "vitest"
import RootLayout from "@/app/layout";

vi.mock("next/font/google", () => ({
    Inter: () => ({className: "mocked-inter"}),
}))

vi.mock("@/components/ui/theme-provider", () => ({
    ThemeProvider: ({children}: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>,
}))

vi.mock("@/components/ui/toaster", () => ({
    Toaster: () => <div data-testid="toaster"/>,
}))

vi.mock("@/app/context/SettingsContext", () => ({
    SettingsProvider: ({children}: { children: React.ReactNode }) => (
        <div data-testid="settings-provider">{children}</div>
    ),
}))

describe("RootLayout", () => {
    it("renders children within providers", () => {
        const {getByTestId, getByText} = render(
            <RootLayout>
                <div>Test Child</div>
            </RootLayout>,
        )
        expect(getByTestId("theme-provider")).toBeDefined()
        expect(getByTestId("settings-provider")).toBeDefined()
        expect(getByTestId("toaster")).toBeDefined()
        expect(getByText("Test Child")).toBeDefined()
    })
})

