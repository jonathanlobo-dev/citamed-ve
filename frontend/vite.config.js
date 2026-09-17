import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

let commitHash = 'f7ab5f4'
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim()
} catch (e) {
  // fallback
}

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify('0.4.0'),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  }
})