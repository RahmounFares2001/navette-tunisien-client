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
  
    try {
      let template;
      let render;
      
      if (isProduction) {
        template = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8')
        const serverEntry = await import('./dist/server/entry-server.js')
        render = serverEntry.render;
      } else {
        template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        const serverModule = await vite.ssrLoadModule('/src/entry-server.tsx')
        render = serverModule.render;
      }
  
      const appHtml = await render(url)
  
      // FIX: Replace the comment placeholder, not the div
      const html = template.replace(`<!--ssr-outlet-->`, appHtml)
  
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      // error handling
    }
  })

  const PORT = process.env.PORT || 5173
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📦 Mode: ${isProduction ? 'production' : 'development'}`)
  })
}

createServer().catch(console.error)