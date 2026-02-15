import {MatchMode} from "@/app/actions/search_enum";

// Simple Levenshtein distance for fuzzy highlighting on the client
// ref - https://en.wikipedia.org/wiki/Levenshtein_distance#Computation
const getLevenshteinDistance = (a: string, b: string): number => {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }

    return matrix[b.length][a.length];
};

export const getMatchedTerms = (
    text: string | null | undefined,
    searchTerm: string,
    matchMode: MatchMode
): string[] => {
    if (!text || !searchTerm) return [];

    const normalizedText = text.toLowerCase();
    const normalizedTerm = searchTerm.toLowerCase();

    // Exact OR StartsWith OR Contains ->
    if (matchMode !== "fuzzy" && matchMode !== "loose") {
        if (matchMode === "exact") {
            return normalizedText.includes(normalizedTerm) ? [searchTerm] : [];
        }
        return [searchTerm];
    }

    // Fuzzy ->
    const words = text.split(/\s+/);
    const matches: string[] = [];

    // Allow 1 error for every 4 characters (approx)
    const maxErrors = Math.floor(searchTerm.length / 3) + 1;

    words.forEach(word => {
        const cleanWord = word.replace(/[^\w]/g, ""); // Remove punctuation
        if (cleanWord.length < 2) return;

        const dist = getLevenshteinDistance(cleanWord.toLowerCase(), normalizedTerm);

        // If distance is low (high similarity) OR it contains the substring
        if (dist <= maxErrors || cleanWord.toLowerCase().includes(normalizedTerm)) {
            matches.push(word);
        }
    });

    matches.push(searchTerm);

    // removing duplicates here
    return Array.from(new Set(matches));
};