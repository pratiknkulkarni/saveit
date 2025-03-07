import {SearchResult} from "minisearch";

export const getMatchedTerms = (result: SearchResult, field: string) => {
    return Object.entries(result.match || {})
        .filter(([, fields]) => fields.includes(field))
        .map(([term]) => term);
};
