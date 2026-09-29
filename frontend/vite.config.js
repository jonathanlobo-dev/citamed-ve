import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

let commitHash = 'f7ab5f4'
// Rama del build: Cloudflare Pages la entrega en CF_PAGES_BRANCH; en local se toma de git
let buildBranch = process.env.CF_PAGES_BRANCH || ''
if (!buildBranch) {
  try {
    buildBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
  } catch (e) {
    buildBranch = 'local'
  }
}
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
    __BUILD_BRANCH__: JSON.stringify(buildBranch),
  }
})