import {beforeEach} from 'vitest';
import {prisma} from '@/lib/prisma';
import {execSync} from 'child_process';

// jsdom implements neither of these, but cmdk (the Command palette behind
// TagInput) and several Radix primitives call them on mount and throw without
// them. Guarded so a real implementation always wins.
if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class ResizeObserver {
        observe() {
        }

        unobserve() {
        }

        disconnect() {
        }
    };
}

if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function scrollIntoView() {
    };
}

if (typeof window !== 'undefined' && !window.matchMedia) {
    window.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {
        },
        removeListener: () => {
        },
        addEventListener: () => {
        },
        removeEventListener: () => {
        },
        dispatchEvent: () => false,
    }) as MediaQueryList;
}

try {
    // `migrate deploy`, not `db push`: this is the same path containers take on
    // boot, so the tests also prove the committed migrations apply cleanly and
    // that pg_trgm exists. The beforeEach TRUNCATE already skips _prisma_migrations.
    execSync('npx prisma migrate deploy --schema=./prisma/schema.prisma', {
        env: process.env, // this is where the vitest.config.mts injects that variable
        stdio: 'ignore'
    });
} catch (e) {
    console.error("Failed to migrate test database schema", e);
}

beforeEach(async () => {
    const result = await prisma.$queryRaw<Array<{ current_schema: string }>>`
        SELECT current_schema()
    `;
    const currentSchema = result[0]?.current_schema || 'public';

    const tablenames = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = '${currentSchema}'
    `);

    const tables = tablenames
        .map(({tablename}) => tablename)
        .filter((name) => name !== '_prisma_migrations')
        .map((name) => `"${currentSchema}"."${name}"`)
        .join(', ');

    try {
        if (tables.length > 0) {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
        }
    } catch (error) {
        console.log({error});
    }
});
