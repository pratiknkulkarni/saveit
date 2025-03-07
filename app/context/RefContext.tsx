"use client"

import React, {createContext, useContext, useRef, ReactNode} from 'react';

type ScrollRefs = {
    firstRef: React.RefObject<HTMLDivElement | null>;
    secondRef: React.RefObject<HTMLDivElement | null>;
    thirdRef: React.RefObject<HTMLDivElement | null>;
};

type ScrollContextType = {
    refs: ScrollRefs;
    scrollToFirst: () => void;
    scrollToSecond: () => void;
    scrollToThird: () => void;
};

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

export const ScrollProvider = ({children}: { children: ReactNode }) => {
    const firstRef = useRef(null);
    const secondRef = useRef(null);
    const thirdRef = useRef(null);

    const scrollToElement = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (ref.current) {
            ref?.current?.scrollIntoView({
                block: 'start',
            });
        }
    };

    const scrollToFirst = () => scrollToElement(firstRef);
    const scrollToSecond = () => scrollToElement(secondRef);
    const scrollToThird = () => scrollToElement(thirdRef);

    const value = {
        refs: {firstRef, secondRef, thirdRef},
        scrollToFirst,
        scrollToSecond,
        scrollToThird,
    };

    return (
        <ScrollContext.Provider value={value}>
            {children}
        </ScrollContext.Provider>
    );
};

export const useScroll = () => {
    const context = useContext(ScrollContext);
    if (context === undefined) {
        throw new Error('useScroll must be used within a ScrollProvider');
    }
    return context;
};