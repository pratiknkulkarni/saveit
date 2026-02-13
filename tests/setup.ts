import {beforeEach} from 'vitest';
import {prisma} from '@/lib/prisma';
import {execSync} from 'child_process';

try {
    execSync('npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss', {
        env: process.env, // this is where the vitest.config.mts injects that variable
        stdio: 'ignore'
    });
} catch (e) {
    console.error("Failed to sync test database schema", e);
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
