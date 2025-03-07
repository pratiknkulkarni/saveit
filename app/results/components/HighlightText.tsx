const HighlightText = (text: string, matchedTerms: string[]) => {
    if (!matchedTerms.length) return text;
    const pattern = new RegExp(`(${matchedTerms.join("|")})`, "gi");
    const parts = text.split(pattern);

    return parts.map((part, index) =>
        matchedTerms.some((term) => term.toLowerCase() === part.toLowerCase()) ? (
            <strong key={index} className="bg-yellow-200 font-semibold">
                {part}
            </strong>
        ) : (
            part
        )
    );
};

export default HighlightText