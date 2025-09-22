import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'

async function createServer() {
  const app = express()

  // In production, serve static files from dist/client
  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist/client')))
  }

  let vite;
  if (!isProduction) {
    // Development: Use Vite dev server
    const { createServer } = await import('vite')
    vite = await createServer({
      server: { middlewareMode: true },
      appType: 'custom'
    })
    app.use(vite.middlewares)
  }

  app.use(/(.*)/, async (req, res, next) => {
    const url = req.originalUrl
    console.log('=== SSR REQUEST START ===')
    console.log('Processing URL:', url)
  
    try {
      let template;
      let render;
      
      if (isProduction) {
        // PRODUCTION: Use built files
        template = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8')
        console.log('📄 Template loaded, length:', template.length)
        
        // DEBUG: Check template content around the root div
        const rootDivIndex = template.indexOf('<div id="root">');
        if (rootDivIndex !== -1) {
          const rootSection = template.substring(rootDivIndex, rootDivIndex + 100);
          console.log('🔍 Root div section:', rootSection);
        }
        
        console.log('🔍 Template contains <!--ssr-outlet-->:', template.includes('<!--ssr-outlet-->'));
        console.log('🔍 Template contains <div id="root"></div>:', template.includes('<div id="root"></div>'));
        
        // Import the production SSR bundle
        const serverEntry = await import('./dist/server/entry-server.js')
        render = serverEntry.render;
        console.log('✅ SSR module loaded')
      } else {
        // DEVELOPMENT: Use Vite dev server
        template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        const serverModule = await vite.ssrLoadModule('/src/entry-server.tsx')
        render = serverModule.render;
      }

      // Render the app HTML
      const appHtml = await render(url)
      console.log('✅ SSR render completed, HTML length:', appHtml.length)
      console.log('📝 First 200 chars of SSR content:', appHtml.substring(0, 200))

      // Replace the placeholder - MULTIPLE METHODS TRIED
      let html = template;
      
      // Method 1: Direct replacement
      if (template.includes('<!--ssr-outlet-->')) {
        html = template.replace('<!--ssr-outlet-->', appHtml);
        console.log('🔄 Used method 1: <!--ssr-outlet--> replacement');
      }
      // Method 2: Root div replacement
      else if (template.includes('<div id="root"></div>')) {
        html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
        console.log('🔄 Used method 2: <div id="root"></div> replacement');
      }
      // Method 3: Regex replacement
      else {
        html = template.replace(/<div id="root"><\/div>/, `<div id="root">${appHtml}</div>`);
        console.log('🔄 Used method 3: Regex replacement');
      }

      console.log('✅ Template replacement completed');
      console.log('📊 Final HTML length:', html.length);
      console.log('🔍 Final HTML contains SSR content:', html.includes(appHtml.substring(0, 50)));
      
      // Send the rendered HTML back
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
      console.log('✅ Response sent successfully');
      
    } catch (e) {
      console.error('❌ SSR Error details:', e)
      
      // Fallback: serve basic HTML if SSR fails
      try {
        const fallbackHtml = isProduction 
          ? fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8')
          : fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
        console.log('🔄 Serving fallback HTML')
        res.status(200).set({ 'Content-Type': 'text/html' }).end(fallbackHtml)
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
        next(e)
      }
    }
    
    console.log('=== SSR REQUEST END ===')
  })

  const PORT = process.env.PORT || 5173
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📦 Mode: ${isProduction ? 'production' : 'development'}`)
  })
}

createServer().catch(console.error)