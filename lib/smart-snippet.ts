import {getMatchedTerms} from "@/lib/search-highlight";
import {MatchMode} from "@/app/actions/search_enum";

export const getSmartSnippet = (
    text: string | null | undefined,
    searchTerm: string,
    matchMode: MatchMode,
    maxLength: number = 150
): string => {
    if (!text) return "";

    const matchedTerms = getMatchedTerms(text, searchTerm, matchMode);

    // if no matches found or text is short, return start of text
    if (matchedTerms.length === 0 || text.length <= maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    }

    // find the index of the "first matching term"
    const firstTerm = matchedTerms[0];
    const index = text.toLowerCase().indexOf(firstTerm.toLowerCase());

    if (index === -1) return text.substring(0, maxLength) + "...";

    const halfLength = Math.floor(maxLength / 2);
    const start = Math.max(0, index - halfLength);
    const end = Math.min(text.length, index + halfLength);

    let snippet = text.substring(start, end);

    if (start > 0) snippet = "..." + snippet;
    if (end < text.length) snippet = snippet + "...";

    return snippet;
};