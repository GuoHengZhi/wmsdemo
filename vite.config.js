import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: '0.0.0.0'
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // 依赖分包：vendor 与 element-plus 单独成 chunk，提升浏览器缓存命中率
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia', 'vue-i18n'],
          'element-plus': ['element-plus', '@element-plus/icons-vue']
        }
      }
    }
  }
})
