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
    console.log('🚨 === NEW REQUEST RECEIVED ===')
    console.log('🚨 URL:', url)
    console.log('🚨 PATH:', req.path)
    console.log('🚨 HEADERS:', req.headers)
    
    try {
      let template;
      let render;
      
      if (isProduction) {
        console.log('🚨 Reading template file...')
        template = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8')
        console.log('🚨 Template length:', template.length)
        
        console.log('🚨 Importing SSR module...')
        const serverEntry = await import('./dist/server/entry-server.js')
        render = serverEntry.render;
        console.log('🚨 SSR module loaded')
      }
  
      console.log('🚨 Calling render function with URL:', url)
      const appHtml = await render(url)
      console.log('🚨 Render completed, HTML length:', appHtml.length)
      
      console.log('🚨 Replacing template placeholder...')
      const html = template.replace(`<!--ssr-outlet-->`, appHtml)
      console.log('🚨 Template replacement completed')
      
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
      console.log('🚨 Response sent successfully')
      
    } catch (e) {
      console.error('❌ SSR Error:', e)
      console.error('❌ Error stack:', e.stack)
      
      // Return error to browser for debugging
      res.status(500).send(`
        <h1>SSR Error Debug</h1>
        <h2>Error:</h2>
        <pre>${e.message}</pre>
        <h2>Stack:</h2>
        <pre>${e.stack}</pre>
      `)
    }
  })

  const PORT = process.env.PORT || 5173
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📦 Mode: ${isProduction ? 'production' : 'development'}`)
  })
}

createServer().catch(console.error)