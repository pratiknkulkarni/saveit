import React, {createContext, useContext, useState, ReactNode} from 'react';

type ToggleContextType = {
    isToggled: boolean;
    toggle: () => void;
};

const ToggleContext = createContext<ToggleContextType | undefined>(undefined);

// This is currently a hack because the cache revalidation is not working as expected
// Ideally, cache should be revalidated when a new bookmark is created and the BookmarkList component should display the
// new bookmark without having to refresh the page.
// Since that is not working, this toggle function is getting called on the CreateBookmarkForm component to force a
// revalidation of the cache and refresh of the new bookmarks.
// I may need to make this more customized to ensure only "toggles" happen when a new bookmark is created and not
// any other time.
export const ToggleProvider = ({children}: { children: ReactNode }) => {
    const [isToggled, setIsToggled] = useState(false);

    const toggle = () => {
        setIsToggled(prevState => !prevState);
    };

    return (
        <ToggleContext.Provider value={{isToggled, toggle}}>
            {children}
        </ToggleContext.Provider>
    );
};

export const useToggle = () => {
    const context = useContext(ToggleContext);
    if (context === undefined) {
        throw new Error('useToggle must be used within a ToggleProvider');
    }
    return context;
};