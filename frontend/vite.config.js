import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts'],
          // Feature chunks
          'admin': [
            './src/pages/AdminDashboard',
            './src/components/AnalyticsCharts',
            './src/components/Reports',
            './src/components/StoreInsights'
          ],
          'store': [
            './src/pages/StoreHomepage',
            './src/pages/ProductDetail',
            './src/pages/Cart',
            './src/pages/Checkout'
          ],
          'management': [
            './src/pages/Products',
            './src/pages/ProductForm',
            './src/pages/Orders',
            './src/pages/Inventory'
          ]
        }
      }
    },
    // Optimize build size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Minify (use esbuild for faster builds, terser requires additional setup)
    minify: 'esbuild',
    // For terser, uncomment below and ensure terser is installed
    // minify: 'terser',
    // terserOptions: {
    //   compress: {
    //     drop_console: true, // Remove console.log in production
    //     drop_debugger: true
    //   }
    // }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },
  // Server configuration
  server: {
    port: 3000,
    open: false
  },
  // Preview configuration
  preview: {
    port: 3000
  }
})
