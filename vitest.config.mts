import {defineConfig} from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import {loadEnv} from "vite";

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '');

    // if all else fails, try local. However, is this even a recommended approach? I'll have to check this
    const fallbackURL = "postgresql://admin:password@localhost:5432/saveit?schema=public";
    const testDbUrl = process.env.TEST_DATABASE_URL || env.TEST_DATABASE_URL || fallbackURL;

    return {
        plugins: [react(), tsconfigPaths()],
        test: {
            environment: 'jsdom',
            setupFiles: ['./tests/setup.ts'],
            globals: true,
            env: {
                ...env,
                DATABASE_URL: testDbUrl, // override the database url to the test one which goes in the setup.ts file
            },
            fileParallelism: false,
        },
    }
})