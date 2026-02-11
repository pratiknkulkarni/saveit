import {beforeEach} from 'vitest';
import {prisma} from '../lib/prisma';
import {execSync} from 'child_process';

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

// resetting db due to those key constraint errors
beforeEach(async () => {
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
});