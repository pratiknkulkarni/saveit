import type React from "react"
import {describe, it, vi} from "vitest";
import {render, screen, fireEvent} from "@testing-library/react"
import "@testing-library/jest-dom";
import SettingsLayout from "../layout";
import {useIsMobile} from "@/hooks/use-mobile";

vi.mock("@/components/ui/theme-provider", () => ({
    ThemeProvider: ({children}: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: vi.fn(),
}))

vi.mock("@/components/Header", () => ({
    default: ({toggleSidebar}: { toggleSidebar: () => void }) => (
        <header data-testid="header">
            <button onClick={toggleSidebar}>Toggle Sidebar</button>
        </header>
    ),
}))

vi.mock("@/components/Sidebar", () => ({
    default: ({isCollapsed}: { isCollapsed: boolean }) => (
        <div data-testid="sidebar">{isCollapsed ? "Collapsed" : "Expanded"}</div>
    ),
}))

vi.mock("@/app/context/SidebarContext", () => ({
    SidebarProvider: ({children}: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe("SettingsLayout", () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it("renders the layout with sidebar and header", () => {
        vi.mocked(useIsMobile).mockReturnValue(false)
        render(<SettingsLayout>Test Content</SettingsLayout>)

        expect(screen.getByTestId("sidebar")).toBeInTheDocument();
        expect(screen.getByTestId("header")).toBeInTheDocument()
        expect(screen.getByText("Test Content")).toBeInTheDocument()
    })

    it("collapses sidebar on mobile", () => {
        vi.mocked(useIsMobile).mockReturnValue(true)
        render(<SettingsLayout>Test Content</SettingsLayout>)

        expect(screen.getByTestId("sidebar")).toHaveTextContent("Collapsed")
    })

    it("expands sidebar on desktop", () => {
        vi.mocked(useIsMobile).mockReturnValue(false)
        render(<SettingsLayout>Test Content</SettingsLayout>)

        expect(screen.getByTestId("sidebar")).toHaveTextContent("Expanded")
    })

    it("toggles sidebar when header button is clicked", () => {
        vi.mocked(useIsMobile).mockReturnValue(false)
        render(<SettingsLayout>Test Content</SettingsLayout>)

        const toggleButton = screen.getByText("Toggle Sidebar")

        fireEvent.click(toggleButton)
        expect(screen.getByTestId("sidebar")).toHaveTextContent("Collapsed")

        fireEvent.click(toggleButton)
        expect(screen.getByTestId("sidebar")).toHaveTextContent("Expanded")
    })

    it("renders main content correctly on mobile with collapsed sidebar", () => {
        vi.mocked(useIsMobile).mockReturnValue(true)
        render(<SettingsLayout>Test Content</SettingsLayout>)

        expect(screen.getByText("Test Content")).toBeInTheDocument()
    })

    it("renders main content correctly on desktop", () => {
        vi.mocked(useIsMobile).mockReturnValue(false)
        render(<SettingsLayout>Test Content</SettingsLayout>)

        expect(screen.getByText("Test Content")).toBeInTheDocument()
    })
})

