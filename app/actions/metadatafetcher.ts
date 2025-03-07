"use server"

import {load} from 'cheerio';
import axios, {AxiosError} from 'axios';
import {URL} from 'url';
import {performance} from 'perf_hooks';
import {LRUCache} from 'lru-cache';

// Constants
const MAX_CONTENT_SIZE = 5000 * 1024; // 5MB
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36';

interface WebsiteMetadata {
    url: string;
    title: string | null;
    description: string | null;
    preview_image: string | null;
}

class MetadataError extends Error {
    constructor(message: string, public statusCode: number = 500) {
        super(message);
        this.name = 'MetadataError';
    }
}

//TODO: Check if next cache can be used instead of the custom one
const cache = new LRUCache<string, WebsiteMetadata>({
    max: 500, // Maximum number of items
    ttl: 1000 * 60 * 60, // 1 hour
    updateAgeOnGet: true, // Update item age on access
    allowStale: false // Don't serve stale items
});

const loadPage = async (url: string): Promise<string> => {
    const startTime = performance.now();
    let content = Buffer.from('');
    let size = 0;

    const headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Encoding': 'gzip, deflate',
        'Dnt': '1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': DEFAULT_USER_AGENT,
    };

    try {
        const response = await axios.get(url, {
            headers,
            responseType: 'stream',
            timeout: 10000,
        });

        return new Promise((resolve, reject) => {
            response.data.on('data', (chunk: Buffer) => {
                size += chunk.length;
                content = Buffer.concat([content, chunk]);

                const endOfHead = Buffer.from('</head>');
                if (content.includes(endOfHead)) {
                    const headContent = content.slice(0, content.indexOf(endOfHead) + endOfHead.length);
                    response.data.destroy();
                    resolve(headContent.toString('utf-8'));
                }

                if (size > MAX_CONTENT_SIZE) {
                    response.data.destroy();
                    resolve(content.toString('utf-8'));
                }
            });

            response.data.on('end', () => {
                console.debug(`Page load completed in ${performance.now() - startTime}ms`);
                resolve(content.toString('utf-8'));
            });

            response.data.on('error', (err: Error) => {
                reject(new MetadataError(`Error loading page: ${err.message}`));
            });
        });
    } catch (error) {
        throw new MetadataError(`Failed to load page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

const fetchMetadata = async (url: string): Promise<WebsiteMetadata> => {
    const cached = cache.get(url);
    if (cached) {
        // console.log(`this was cache: ${url}`);
        return cached;
    }

    try {
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            throw new MetadataError('Invalid URL protocol. Only HTTP and HTTPS are supported.', 400);
        }

        const startTime = performance.now();
        const pageContent = await loadPage(url);
        console.debug(`Page loaded in ${performance.now() - startTime}ms`);

        const parseStart = performance.now();
        const $ = load(pageContent);

        const title = $('title').text().trim() || null;

        const description = $('meta[name="description"]').attr('content')?.trim() ||
            $('meta[property="og:description"]').attr('content')?.trim() ||
            null;

        let previewImage = $('meta[property="og:image"]').attr('content')?.trim() || null;
        if (previewImage && !previewImage.startsWith('http')) {
            previewImage = new URL(previewImage, url).toString();
        }

        console.debug(`Parsing completed in ${performance.now() - parseStart}ms`);

        const metadata: WebsiteMetadata = {
            url,
            title,
            description,
            preview_image: previewImage
        };

        // Cache the result
        cache.set(url, metadata);

        console.log(metadata);
        return metadata;

    } catch (error) {
        if (error instanceof MetadataError) {
            throw error;
        }

        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            if (axiosError.response) {
                throw new MetadataError(
                    `Failed to fetch URL: ${axiosError.message}`,
                    axiosError.response.status
                );
            } else if (axiosError.request) {
                throw new MetadataError('No response received from server', 503);
            }
        }

        throw new MetadataError('An unexpected error occurred');
    }
}

export {loadPage, fetchMetadata}