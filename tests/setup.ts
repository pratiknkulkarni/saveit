import {beforeEach} from 'vitest';
import {prisma} from '@/lib/prisma';
import {execSync} from 'child_process';
import {createRequire} from 'module';

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

// `migrate deploy`, not `db push`: this is the same path containers take on
// boot, so the tests also prove the committed migrations apply cleanly and
// that pg_trgm exists. The beforeEach TRUNCATE already skips _prisma_migrations.
//
// Resolve the CLI entry rather than shelling `npx`, which is not on PATH under
// every runner (the Docker entrypoint invokes the same build/index.js).
const prismaCli = createRequire(import.meta.url).resolve('prisma/build/index.js');

try {
    execSync(`node ${JSON.stringify(prismaCli)} migrate deploy --schema=./prisma/schema.prisma`, {
        env: process.env, // this is where the vitest.config.mts injects that variable
        stdio: 'pipe'
    });
} catch (e) {
    // Do not swallow this. Without a migrated schema every DB-backed suite fails
    // with a confusing "table does not exist" cascade; one clear error is better.
    const {stderr, stdout} = e as { stderr?: Buffer; stdout?: Buffer };
    throw new Error(
        `Failed to migrate the test database. Is TEST_DATABASE_URL reachable?\n` +
        `${stderr?.toString() || ''}${stdout?.toString() || ''}`
    );
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
