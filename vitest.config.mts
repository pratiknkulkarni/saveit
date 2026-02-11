import {defineConfig} from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import {loadEnv} from "vite";

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '')

    return {
        plugins: [react(), tsconfigPaths()],
        test: {
            environment: 'jsdom',
            setupFiles: ['./tests/setup.ts'],
            globals: true,
            env: {
                DATABASE_URL: "file:./test.db",
                ...env
            },
            fileParallelism: false,
        },
    }
})