"use client"

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Filter, History, Search, SlidersVertical} from "lucide-react";
import {
    ChangeEvent,
    KeyboardEvent,
    MouseEvent as ReactMouseEvent,
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {useRouter} from "next/navigation";
import {MatchMode, Filter as FilterType} from "@/app/actions/search_enum";

const SearchFilters = [
    {label: "Titles", value: "title"},
    {label: "Description", value: "description"},
    {label: "URL", value: "url"},
    {label: "Tags", value: "tag"},
    {label: "Folders", value: "folder"},
    {label: "All", value: "all"}
];

const SearchModes = [
    {label: "Exact Match (Default)", value: "exact"},
    {label: "Fuzzy Match", value: "fuzzy"},
    {label: "Loose Match", value: "loose"},
    {label: "Starts With", value: "startsWith"},
];

const recentSearches = ["bookmark", "youtube", "react", "programming", "news"];

const SearchComponent = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const desktopContainerRef = useRef<HTMLDivElement>(null);
    const mobileContainerRef = useRef<HTMLDivElement>(null);
    const mobileSearchContentRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [searchFilter, setSearchFilter] = useState<FilterType>("all");
    const [matchMode, setMatchMode] = useState<MatchMode>("exact");

    const handleFocus = () => setShowDropdown(true);

    const handleClickOutside = useCallback((event: globalThis.MouseEvent) => {
        if (!(event.target instanceof Element)) {
            return;
        }

        if (desktopContainerRef.current && inputRef.current) {
            const isClickOutsideDropdown = !desktopContainerRef.current.contains(event.target);
            const isClickOutsideInput = !inputRef.current.contains(event.target);

            if (isClickOutsideDropdown && isClickOutsideInput) {
                setShowDropdown(false);
            }
        }

        const clickedOnMobileBackground =
            mobileContainerRef.current &&
            mobileContainerRef.current.contains(event.target) &&
            mobileSearchContentRef.current &&
            !mobileSearchContentRef.current.contains(event.target);

        if (clickedOnMobileBackground) {
            setIsExpanded(false);
        }
    }, []);


    const handleSearchInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    }

    const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
        setShowDropdown(true);

        if (event.key === "Enter") {
            if (!searchTerm) return;
            performSearch();
        }

        if (event.key === "Escape") {
            setShowDropdown(false);
            setIsExpanded(false);
            setSearchTerm("");

            if (inputRef?.current) {
                inputRef.current.value = "";
                inputRef.current.blur();
            }
        }
    }

    const performSearch = () => {
        if (!searchTerm) return;

        const searchURL = `/results?query=${encodeURIComponent(searchTerm)}&filter=${searchFilter}&matchMode=${matchMode}`;
        router.push(searchURL);

        setShowDropdown(false);
        setIsExpanded(false);
    };

    const handleContentClick = (e: ReactMouseEvent) => {
        e.stopPropagation();
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [handleClickOutside]);

    const handleFilterClick = (filterValue: string) => (e: ReactMouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setSearchFilter((prevFilter) =>
            prevFilter === filterValue ? "all" : (filterValue as FilterType)
        );
        inputRef.current?.focus();
    };

    const handleMatchModeClick = (modeValue: string) => (e: ReactMouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setMatchMode(prevMatchMode =>
            prevMatchMode === modeValue ? "exact" : modeValue as MatchMode
        );
        inputRef.current?.focus();
    };

    const handleRecentSearchClick = (search: string) => (e: ReactMouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setSearchTerm(search);
        inputRef.current?.focus();
    };

    const renderFilterOptions = () => (
        <>
            <div className="flex justify-start items-center gap-2 my-2">
                <Filter height={15} width={15}/>
                <div className="text-sm text-foreground">Filter By</div>
            </div>
            <div className="w-full flex flex-wrap gap-1 p-1">
                {SearchFilters.map((filter) => (
                    <Badge
                        onClick={handleFilterClick(filter.value)}
                        key={filter.label}
                        className="cursor-pointer"
                        variant={searchFilter === filter.value ? "default" : "outline"}
                    >
                        {filter.label}
                    </Badge>
                ))}
            </div>
        </>
    );

    const renderMatchModes = () => (
        <>
            <div className="flex justify-start items-center gap-2 my-2">
                <SlidersVertical height={15} width={15}/>
                <div className="text-sm text-foreground">Match Mode</div>
            </div>
            <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-1">
                {SearchModes.map((mode) => (
                    <Badge
                        onClick={handleMatchModeClick(mode.value)}
                        key={mode.label}
                        className="cursor-pointer"
                        variant={matchMode === mode.value ? "default" : "outline"}
                    >
                        {mode.label}
                    </Badge>
                ))}
            </div>
        </>
    );

    const renderRecentSearches = () => (
        <>
            <div className="flex justify-start items-center gap-2 my-2">
                <History height={15} width={15}/>
                <div className="text-sm text-foreground">Recent Searches</div>
            </div>
            <div className="flex flex-wrap gap-2">
                {recentSearches.map((recentSearch, index) => (
                    <div
                        key={index}
                        onClick={handleRecentSearchClick(recentSearch)}
                        className="text-xs py-1 cursor-pointer rounded-md hover:bg-muted px-2 hover:underline"
                    >
                        {recentSearch}
                    </div>
                ))}
            </div>
        </>
    );

    return (
        <div className="flex items-center w-full">
            {/* Desktop View */}
            <div ref={desktopContainerRef} className="hidden md:flex flex-col items-start w-full max-w-lg relative">
                <div className="flex items-center border rounded-2xl px-3 py-2 shadow-sm w-full relative bg-background">
                    <Input
                        type="text"
                        placeholder={`Search ${searchFilter === 'all' ? 'everything' : searchFilter}...`}
                        className="border-none focus:ring-0 focus:outline-none pr-10 bg-transparent"
                        onFocus={handleFocus}
                        ref={inputRef}
                        onChange={handleSearchInputChange}
                        onKeyDown={handleKeyDown}
                        value={searchTerm}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1"
                        onClick={performSearch}
                    >
                        <Search className="w-5 h-5 text-muted-foreground"/>
                    </Button>
                </div>
                <AnimatePresence>
                    {showDropdown && (
                        <motion.div
                            initial={{opacity: 0, y: -10}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -10}}
                            transition={{duration: 0.2}}
                            className="absolute top-full mt-2 w-full border rounded-2xl shadow-sm bg-background p-3 z-50"
                            onClick={handleContentClick}
                        >
                            {renderFilterOptions()}
                            <Separator className="my-4"/>
                            {renderMatchModes()}
                            <Separator className="my-4"/>
                            {renderRecentSearches()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile View */}
            <div className="md:hidden relative w-full">
                {!isExpanded ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(true)}
                        className="flex items-center justify-center"
                    >
                        <Search className="w-5 h-5 text-gray-700"/>
                    </Button>
                ) : (
                    <div
                        ref={mobileContainerRef}
                        className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 overflow-y-auto"
                    >
                        <div
                            ref={mobileSearchContentRef}
                            className="flex flex-col max-w-md mx-auto gap-4 p-4 mt-4"
                            onClick={handleContentClick}
                        >
                            <div className="flex items-center gap-2 bg-background p-2 rounded-xl shadow-md">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setIsExpanded(false);
                                    }}
                                    className="hover:bg-muted"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round" className="lucide lucide-x">
                                        <path d="M18 6 6 18"></path>
                                        <path d="m6 6 12 12"></path>
                                    </svg>
                                </Button>

                                <div className="flex-1 relative">
                                    <Input
                                        type="text"
                                        placeholder={`Search ${searchFilter === 'all' ? 'everything' : searchFilter}...`}
                                        className="border rounded-xl focus-visible:ring-1 w-full pr-10"
                                        autoFocus
                                        ref={inputRef}
                                        onChange={handleSearchInputChange}
                                        onKeyDown={handleKeyDown}
                                        value={searchTerm}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0"
                                        onClick={performSearch}
                                    >
                                        <Search className="w-5 h-5 text-muted-foreground"/>
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-background rounded-xl border p-4 shadow-sm">
                                {renderFilterOptions()}
                            </div>

                            <div className="bg-background rounded-xl border p-4 shadow-sm">
                                {renderMatchModes()}
                            </div>

                            <div className="bg-background rounded-xl border p-4 shadow-sm">
                                {renderRecentSearches()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SearchComponent;