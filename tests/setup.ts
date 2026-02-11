import {beforeEach} from 'vitest';
import {prisma} from '../lib/prisma';
import {execSync} from 'child_process';

// push all changes before running any test in the test database
try {
    execSync('npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss', {
        env: {
            ...process.env,
            DATABASE_URL: "file:./test.db"
        },
        stdio: 'ignore'
    });
} catch (e) {
    console.error("Failed to sync test database schema", e);
}

beforeEach(async () => {
    // this is required because the out of order executions don't work, which is okay for a test
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF;");

    const tablenames = await prisma.$queryRaw<Array<{ name: string }>>`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
          AND name NOT LIKE '_prisma_migrations';
    `;

    for (const {name} of tablenames) {
        try {
            await prisma.$executeRawUnsafe(`DELETE
                                            FROM "${name}";`);
        } catch (error) {
            console.log(`Error cleaning table ${name}`, error);
        }
    }

    // revert
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON;");
});
