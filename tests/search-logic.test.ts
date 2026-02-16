import {describe, it, expect} from "vitest";
import {getMatchedTerms} from "@/lib/search-highlight";
import {getSmartSnippet} from "@/lib/smart-snippet";

describe("Search Logic: Highlighting & Snippets", () => {

    describe("getMatchedTerms (Levenshtein + Tokenization)", () => {
        it("finds exact matches", () => {
            const terms = getMatchedTerms("Hello world", "Hello", "exact");
            expect(terms).toContain("Hello");
        });

        it("finds fuzzy matches (1 typo)", () => {
            // "Bananna" (search) -> "Banana" (text)
            const terms = getMatchedTerms("The Banana Stand", "Bananna", "fuzzy");
            expect(terms).toContain("Banana");
        });

        it("handles punctuation splitting", () => {
            const terms = getMatchedTerms("apple,banana;grape", "banana", "fuzzy");
            expect(terms).toContain("banana");
        });
    });

    describe("getSmartSnippet (Context Window)", () => {
        it("returns full text if short", () => {
            const text = "Short description.";
            const snippet = getSmartSnippet(text, "Short", "exact", 100);
            expect(snippet).toBe("Short description.");
        });

        it("crops long text around the match", () => {
            const longText = "Start " + "noise ".repeat(20) + "NEEDLE " + "noise ".repeat(20) + "End";
            const snippet = getSmartSnippet(longText, "NEEDLE", "exact", 50);

            expect(snippet).toContain("NEEDLE");
            expect(snippet).not.toContain("Start");
            expect(snippet).not.toContain("End");
            expect(snippet.startsWith("...")).toBe(true);
            expect(snippet.endsWith("...")).toBe(true);
        });

        it("handles missing matches gracefully", () => {
            const snippet = getSmartSnippet("Some text", "xyz", "exact");
            expect(snippet).toBe("Some text");
        });
    });
});