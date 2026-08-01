"use server"

import {load} from 'cheerio';
import axios from 'axios';
import {URL} from 'url';
import {performance} from 'perf_hooks';
import {LRUCache} from 'lru-cache';
import {logger} from "@/lib/logger";
import {metadataSchema} from "@/app/actions/schema/metadata";

const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Compatible; SaveItBot/1.0)';

interface WebsiteMetadata {
    url: string;
    title: string | null;
    description: string | null;
    preview_image: string | null;
}

const cache = new LRUCache<string, WebsiteMetadata>({
    max: 500, // total items to cache
    ttl: 1000 * 60 * 60, // 1 hour
    updateAgeOnGet: true,
    allowStale: false
});

/**
 * Checks if a URL hostname looks like a local/private address.
 * This is a basic "sanity check" layer. This is to avoid the SSRF.
 */
const isUnsafeUrl = (url: string): boolean => {
    try {
        const {hostname} = new URL(url);
        if (hostname === 'localhost') return true;
        if (hostname.startsWith('127.')) return true;
        if (hostname.startsWith('192.168.')) return true;
        if (hostname.startsWith('10.')) return true;
        if (hostname.startsWith('169.254.')) return true;
        return false;
    } catch {
        return true;
    }
};

const loadPage = async (url: string): Promise<string> => {
    const startTime = performance.now();
    let content = Buffer.from('');
    let size = 0;

    const headers = {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': DEFAULT_USER_AGENT,
        'Accept-Encoding': 'gzip, deflate',
    };

    try {
        const response = await axios.get(url, {
            headers,
            responseType: 'stream',
            timeout: 8000, // 8s
            maxRedirects: 3,
        });

        return new Promise((resolve, reject) => {
            const stream = response.data;

            stream.on('data', (chunk: Buffer) => {
                size += chunk.length;
                content = Buffer.concat([content, chunk]);

                // Optimization: Stop if we found the closing head tag
                const endOfHead = Buffer.from('</head>');
                if (content.includes(endOfHead)) {
                    stream.destroy();
                    const headContent = content.slice(0, content.indexOf(endOfHead) + endOfHead.length);
                    resolve(headContent.toString('utf-8'));
                }

                if (size > MAX_CONTENT_SIZE) {
                    stream.destroy();
                    logger.warn({url}, "Metadata Fetch: Content exceeded size limit");
                    resolve(content.toString('utf-8'));
                }
            });

            stream.on('end', () => {
                logger.debug({url, duration: performance.now() - startTime}, "Page Load Completed");
                resolve(content.toString('utf-8'));
            });

            stream.on('error', (err: Error) => {
                reject(err);
            });
        });
    } catch (error) {
        throw error;
    }
}

export const fetchMetadata = async (url: string): Promise<WebsiteMetadata | null> => {
    const validated = metadataSchema.safeParse({url});
    if (!validated.success) {
        logger.warn({url, error: "Invalid URL Format"}, "Metadata Fetch: Rejected");
        throw new Error("Invalid URL");
    }

    if (isUnsafeUrl(url)) {
        logger.warn({url}, "Metadata Fetch: Blocked Potentially Unsafe URL");
        throw new Error("URL not allowed");
    }

    const cached = cache.get(url);
    if (cached) {
        return cached;
    }

    try {
        const pageContent = await loadPage(url);

        const $ = load(pageContent);
        const title = $('title').text().trim() || null;
        const description = $('meta[name="description"]').attr('content')?.trim() ||
            $('meta[property="og:description"]').attr('content')?.trim() ||
            null;

        let previewImage = $('meta[property="og:image"]').attr('content')?.trim() || null;

        if (previewImage && !previewImage.startsWith('http')) {
            try {
                previewImage = new URL(previewImage, url).toString();
            } catch {
                previewImage = null;
            }
        }

        const metadata: WebsiteMetadata = {
            url,
            title,
            description,
            preview_image: previewImage
        };

        cache.set(url, metadata);
        logger.info({url, hasTitle: !!title}, "Metadata Fetched Successfully");

        return metadata;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            logger.warn({url, status: error.response?.status}, "Metadata Fetch: External Request Failed");
        } else {
            logger.error({url, err: error}, "Metadata Fetch: Unknown Error");
        }
        return {url, title: null, description: null, preview_image: null};
    }
}