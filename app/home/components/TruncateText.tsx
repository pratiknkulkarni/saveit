import React from 'react'
import {useIsMobile} from "@/hooks/use-mobile";

interface TruncateTextProps {
    text: string
    mobileWordLimit: number
    desktopWordLimit: number
}

const TruncateText = ({text, mobileWordLimit, desktopWordLimit}: TruncateTextProps) => {
    const isMobile = useIsMobile()

    const truncateWords = (str: string, numWords: number) => {
        const words = str.split(' ')
        if (words.length > numWords) {
            return words.slice(0, numWords).join(' ') + '...'
        }
        return str
    }

    const wordLimit = isMobile ? mobileWordLimit : desktopWordLimit

    return <>{truncateWords(text, wordLimit)}</>
}

export default TruncateText