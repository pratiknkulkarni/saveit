import React from "react"
import {render} from "@testing-library/react"
import {describe, it, expect, vi} from "vitest"
import Home from "@/app/home/page";
import {useIsMobile} from "@/hooks/use-mobile";

vi.mock("@/app/home/components/BookmarkList", () => ({
    default: () => <div data-testid="bookmark-list">BookmarkList</div>,
}))

// TagList is a default export — mocking it as a named one left `default`
// undefined, so the desktop branch rendered nothing.
vi.mock("@/app/home/components/TagList", () => ({
    default: () => <div data-testid="tag-list">TagList</div>,
}))

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: vi.fn(),
}))

// Home reads settings.showTags and the session. Stub both rather than wrapping in
// the real SettingsProvider, which would fetch settings over the network.
vi.mock("@/app/context/SettingsContext", () => ({
    useSettings: () => ({settings: {showTags: true}}),
}))

vi.mock("@/lib/auth-client", () => ({
    authClient: {
        useSession: () => ({data: {user: {id: "test-user-id"}}}),
    },
}))

describe("Home", () => {
    it("renders BookmarkList", () => {
        const {getByTestId} = render(<Home/>)
        expect(getByTestId("bookmark-list")).toBeDefined()
    })

    it("renders TagList on desktop", () => {
        vi.mocked(useIsMobile).mockReturnValue(false)
        const {getByTestId} = render(<Home/>)
        expect(getByTestId("tag-list")).toBeDefined()
    })

    it("does not render TagList on mobile", () => {
        vi.mocked(useIsMobile).mockReturnValue(true)
        const {queryByTestId} = render(<Home/>)
        expect(queryByTestId("tag-list")).toBeNull()
    })

    it("applies correct classes for layout", () => {
        const {container} = render(<Home/>)
        const outerDiv = container.firstChild as HTMLElement
        expect(outerDiv.className).toContain("space-y-6")

        const innerDiv = outerDiv.firstChild as HTMLElement
        expect(innerDiv.className).toContain("flex flex-col lg:flex-row gap-6")
    })

    it("applies correct classes for BookmarkList container", () => {
        const {container} = render(<Home/>)
        const bookmarkListContainer = container.querySelector(".flex-grow")
        expect(bookmarkListContainer).toBeDefined()
        expect(bookmarkListContainer?.className).toContain("flex-grow text-sm")
    })
})

