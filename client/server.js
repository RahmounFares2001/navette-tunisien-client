import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { createServer as createViteServer } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'

async function createServer() {
  const app = express()

  console.log('Server starting - DEBUG VERSION')

  let template, render, vite;

  if (isProduction) {
    console.log('Reading template...')
    template = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8')
    console.log('Template length:', template.length)
    
    console.log('Importing SSR module...')
    const serverEntry = await import('./dist/server/entry-server.js')
    render = serverEntry.render
    console.log('SSR module loaded')
  } else {
    // Development mode: Use Vite's dev server
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    })
    app.use(vite.middlewares)
    template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
    
    // Correct render function for development
    render = async (url) => {
      try {
        const { render: ssrRender } = await vite.ssrLoadModule('/src/entry-server.tsx');
        return await ssrRender(url);
      } catch (error) {
        vite.ssrFixStacktrace(error);
        throw error;
      }
    }
  }

  // SSR handler
  app.use(/(.*)/, async (req, res, next) => {
    console.log('=== REQUEST RECEIVED ===')
    console.log('URL:', req.originalUrl)
    console.log('METHOD:', req.method)
    
    try {
      console.log('Calling render with URL:', req.originalUrl)
      const appHtml = await render(req.originalUrl)
      console.log('Render completed, length:', appHtml.length)
      
      let html;
      if (isProduction) {
        console.log('Replacing placeholder...')
        html = template.replace(`<!--ssr-outlet-->`, appHtml)
      } else {
        // In development, transform the HTML with Vite
        html = await vite.transformIndexHtml(req.originalUrl, template.replace(`<!--ssr-outlet-->`, appHtml))
      }
      
      console.log('HTML preparation completed')
      
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
      console.log('Response sent')
      
    } catch (e) {
      if (!isProduction && vite) {
        vite.ssrFixStacktrace(e)
      }
      console.error('ERROR:', e.message)
      console.error('STACK:', e.stack)
      res.status(500).send(`<h1>SSR Error</h1><pre>${e.stack}</pre>`)
    }
  })

  // Static files for production
  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist/client')))
    console.log('Static files enabled')
  }

  const PORT = process.env.PORT || 5173
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`Mode: ${isProduction ? 'production' : 'development'}`)
  })
}

createServer().catch(console.error)