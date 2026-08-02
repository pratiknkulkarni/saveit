import {beforeEach, describe, expect, it, vi} from "vitest";
import {Readable} from "stream";
import axios from "axios";
import {fetchMetadata} from "../metadatafetcher";

/**
 * Covers Phase 5 smoke item 4. The network call is stubbed at axios so the suite
 * stays offline and deterministic; what is exercised is the parsing, the relative
 * og:image resolution, the SSRF guard and the failure path.
 *
 * fetchMetadata memoises into a module-scope LRU, so every case uses a distinct
 * URL — reusing one would silently hit the cache instead of the code under test.
 */

vi.mock("axios", () => ({
    default: {
        get: vi.fn(),
        isAxiosError: vi.fn().mockReturnValue(false),
    },
}));

const htmlResponse = (html: string) => ({
    data: Readable.from([Buffer.from(html)]),
});

const page = ({title = "", description = "", ogImage = ""}) => `
    <html>
        <head>
            <title>${title}</title>
            ${description ? `<meta name="description" content="${description}">` : ""}
            ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ""}
        </head>
        <body>ignored</body>
    </html>
`;

describe("fetchMetadata", () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(axios.isAxiosError).mockReturnValue(false);
    });

    it("extracts title, description and preview image", async () => {
        vi.mocked(axios.get).mockResolvedValue(htmlResponse(page({
            title: "Example Domain",
            description: "An example page",
            ogImage: "https://cdn.example.com/preview.png",
        })) as never);

        const metadata = await fetchMetadata("https://meta-basic.example.com");

        expect(metadata).toEqual({
            url: "https://meta-basic.example.com",
            title: "Example Domain",
            description: "An example page",
            preview_image: "https://cdn.example.com/preview.png",
        });
    });

    it("resolves a relative og:image against the page URL", async () => {
        vi.mocked(axios.get).mockResolvedValue(htmlResponse(page({
            title: "Relative",
            ogImage: "/static/thumb.png",
        })) as never);

        const metadata = await fetchMetadata("https://meta-relative.example.com/articles/one");

        expect(metadata?.preview_image).toBe("https://meta-relative.example.com/static/thumb.png");
    });

    it("returns nulls rather than throwing when the page has no metadata", async () => {
        vi.mocked(axios.get).mockResolvedValue(htmlResponse("<html><head></head><body>hi</body></html>") as never);

        const metadata = await fetchMetadata("https://meta-empty.example.com");

        expect(metadata).toEqual({
            url: "https://meta-empty.example.com",
            title: null,
            description: null,
            preview_image: null,
        });
    });

    it("caches by URL and does not refetch", async () => {
        vi.mocked(axios.get).mockResolvedValue(htmlResponse(page({title: "Cached"})) as never);

        await fetchMetadata("https://meta-cache.example.com");
        await fetchMetadata("https://meta-cache.example.com");

        expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it("degrades to nulls when the request fails", async () => {
        vi.mocked(axios.get).mockRejectedValue(new Error("ECONNREFUSED"));

        const metadata = await fetchMetadata("https://meta-down.example.com");

        expect(metadata).toEqual({
            url: "https://meta-down.example.com",
            title: null,
            description: null,
            preview_image: null,
        });
    });

    describe("SSRF guard", () => {
        it.each([
            "http://localhost:33449/admin",
            "http://127.0.0.1/",
            "http://192.168.1.36/",
            "http://10.0.0.5/",
            "http://169.254.169.254/latest/meta-data/",
        ])("refuses %s", async (url) => {
            await expect(fetchMetadata(url)).rejects.toThrow("URL not allowed");
            expect(axios.get).not.toHaveBeenCalled();
        });

        it("rejects a malformed URL before any request", async () => {
            await expect(fetchMetadata("not-a-url")).rejects.toThrow("Invalid URL");
            expect(axios.get).not.toHaveBeenCalled();
        });
    });
});
