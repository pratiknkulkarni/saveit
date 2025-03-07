"use client"

import type React from "react"
import { render, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import {useIsMobile} from "@/hooks/use-mobile";
import HomeLayout from "../layout";

vi.mock("@/components/ui/theme-provider", () => ({
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>,
}))

vi.mock("@/components/Sidebar", () => ({
    default: ({ isCollapsed }: { isCollapsed: boolean }) => (
        <div data-testid="sidebar">{isCollapsed ? "Collapsed" : "Expanded"}</div>
    ),
}))

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: vi.fn(),
}))

vi.mock("@/components/Header", () => ({
    default: ({ toggleSidebar }: { toggleSidebar: () => void }) => (
        <header data-testid="header">
            <button onClick={toggleSidebar}>Toggle Sidebar</button>
        </header>
    ),
}))

vi.mock("@/app/context/SidebarContext", () => ({
    SidebarProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="sidebar-provider">{children}</div>
    ),
}))

describe("HomeLayout", () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it("renders children within providers", () => {
        const { getByTestId, getByText } = render(
            <HomeLayout>
                <div>Test Child</div>
            </HomeLayout>,
        )

        expect(getByTestId("theme-provider")).toBeDefined()
        expect(getByTestId("sidebar-provider")).toBeDefined()
        expect(getByTestId("sidebar")).toBeDefined()
        expect(getByTestId("header")).toBeDefined()
        expect(getByText("Test Child")).toBeDefined()
    })

    it("collapses sidebar on desktop by default", () => {
        vi.mocked(useIsMobile).mockReturnValue(false)
        const { getByTestId } = render(<HomeLayout>Test Content</HomeLayout>)

        expect(getByTestId("sidebar").textContent).toBe("Collapsed")
    })

    it("expands sidebar on mobile by default", () => {
        vi.mocked(useIsMobile).mockReturnValue(true)
        const { getByTestId } = render(<HomeLayout>Test Content</HomeLayout>)

        expect(getByTestId("sidebar").textContent).toBe("Expanded")
    })

    it("toggles sidebar when header button is clicked", () => {
        vi.mocked(useIsMobile).mockReturnValue(false)
        const { getByTestId, getByText } = render(<HomeLayout>Test Content</HomeLayout>)

        const toggleButton = getByText("Toggle Sidebar")

        expect(getByTestId("sidebar").textContent).toBe("Collapsed")

        fireEvent.click(toggleButton)
        expect(getByTestId("sidebar").textContent).toBe("Expanded")

        fireEvent.click(toggleButton)
        expect(getByTestId("sidebar").textContent).toBe("Collapsed")
    })

    it("renders main content correctly on mobile with collapsed sidebar", () => {
        vi.mocked(useIsMobile).mockReturnValue(true)
        const { getByText } = render(<HomeLayout>Test Content</HomeLayout>)

        const toggleButton = getByText("Toggle Sidebar")
        fireEvent.click(toggleButton) // Collapse sidebar on mobile

        expect(getByText("Test Content")).toBeDefined()
    })

    it("renders main content correctly on desktop", () => {
        vi.mocked(useIsMobile).mockReturnValue(false)
        const { getByText } = render(<HomeLayout>Test Content</HomeLayout>)

        expect(getByText("Test Content")).toBeDefined()
    })
})

