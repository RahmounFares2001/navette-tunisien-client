import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'

async function createServer() {
  const app = express()

  console.log('🚨 SERVER STARTING - DEBUG VERSION')

  // IMPORTANT: Put the SSR handler BEFORE static files
  app.use(/(.*)/, async (req, res, next) => {
    console.log('🚨 === REQUEST RECEIVED ===')
    console.log('🚨 URL:', req.originalUrl)
    console.log('🚨 METHOD:', req.method)
    
    try {
      let template;
      let render;
      
      if (isProduction) {
        console.log('🚨 Reading template...')
        template = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8')
        console.log('🚨 Template length:', template.length)
        
        console.log('🚨 Importing SSR module...')
        const serverEntry = await import('./dist/server/entry-server.js')
        render = serverEntry.render;
        console.log('🚨 SSR module loaded')
      }

      console.log('🚨 Calling render with URL:', req.originalUrl)
      const appHtml = await render(req.originalUrl)
      console.log('🚨 Render completed, length:', appHtml.length)
      
      console.log('🚨 Replacing placeholder...')
      const html = template.replace(`<!--ssr-outlet-->`, appHtml)
      console.log('🚨 Replacement completed')
      
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
      console.log('🚨 Response sent')
      
    } catch (e) {
      console.error('❌ ERROR:', e.message)
      console.error('❌ STACK:', e.stack)
      res.status(500).send(`<h1>SSR Error</h1><pre>${e.stack}</pre>`)
    }
  })

  // Static files should come AFTER SSR handler
  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist/client')))
    console.log('🚨 Static files enabled (as fallback)')
  }

  const PORT = process.env.PORT || 5173
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📦 Mode: ${isProduction ? 'production' : 'development'}`)
  })
}

createServer().catch(console.error)