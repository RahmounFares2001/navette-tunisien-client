import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'

async function createServer() {
  const app = express()

  console.log('🚨 SERVER.JS STARTED - DEBUG VERSION LOADED!')
  console.log('🚨 Current directory:', __dirname)
  console.log('🚨 Production mode:', isProduction)

  // In production, serve static files from dist/client
  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist/client')))
    console.log('🚨 Static files served from:', path.resolve(__dirname, 'dist/client'))
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
    console.log('🚨 === NEW REQUEST - DEBUG VERSION ===')
    console.log('🚨 URL:', req.originalUrl)
    console.log('🚨 This proves the updated server.js is running!')
  
    try {
      let template;
      let render;
      
      if (isProduction) {
        // PRODUCTION: Use built files
        const templatePath = path.resolve(__dirname, 'dist/client/index.html')
        console.log('🚨 Reading template from:', templatePath)
        
        template = fs.readFileSync(templatePath, 'utf-8')
        console.log('📄 Template loaded, length:', template.length)
        
        // DEBUG: Check template content
        console.log('🔍 Template contains <!--ssr-outlet-->:', template.includes('<!--ssr-outlet-->'))
        console.log('🔍 Template contains <div id="root"></div>:', template.includes('<div id="root"></div>'))
        
        // Show exact content around root div
        const rootDivIndex = template.indexOf('id="root"')
        if (rootDivIndex !== -1) {
          const rootSection = template.substring(rootDivIndex - 20, rootDivIndex + 50)
          console.log('🔍 Root div area:', rootSection)
        }
        
        // Import the production SSR bundle
        const serverEntryPath = './dist/server/entry-server.js'
        console.log('🚨 Importing SSR bundle from:', serverEntryPath)
        const serverEntry = await import(serverEntryPath)
        render = serverEntry.render
        console.log('✅ SSR module loaded')
      }

      console.log('🚨 Calling render function...')
      const appHtml = await render(url)
      console.log('✅ SSR render completed, HTML length:', appHtml.length)
      console.log('📝 First 300 chars of SSR content:')
      console.log(appHtml.substring(0, 300))

      // Replace the placeholder
      let html = template
      let replacementMethod = 'none'
      
      if (template.includes('<!--ssr-outlet-->')) {
        html = template.replace('<!--ssr-outlet-->', appHtml)
        replacementMethod = 'comment'
        console.log('🔄 Used method: <!--ssr-outlet--> replacement')
      } else if (template.includes('<div id="root"></div>')) {
        html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
        replacementMethod = 'empty-div'
        console.log('🔄 Used method: <div id="root"></div> replacement')
      } else {
        // Try to find and replace the root div with content
        const rootDivRegex = /<div id="root">([\s\S]*?)<\/div>/
        if (rootDivRegex.test(template)) {
          html = template.replace(rootDivRegex, `<div id="root">${appHtml}</div>`)
          replacementMethod = 'regex'
          console.log('🔄 Used method: Regex replacement')
        } else {
          // Last resort: simple string replacement
          html = template.replace('<div id="root">', `<div id="root">${appHtml}`)
          replacementMethod = 'simple'
          console.log('🔄 Used method: Simple replacement')
        }
      }

      console.log('✅ Template replacement completed, method:', replacementMethod)
      console.log('📊 Final HTML length:', html.length)
      console.log('🔍 Final HTML contains SSR content:', html.includes(appHtml.substring(0, 100)))
      
      // Send the rendered HTML back
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
      console.log('✅ Response sent successfully')
      
    } catch (e) {
      console.error('❌ SSR Error details:', e)
      console.error('❌ Error stack:', e.stack)
      
      // Fallback: serve basic HTML if SSR fails
      try {
        const fallbackPath = isProduction 
          ? path.resolve(__dirname, 'dist/client/index.html')
          : path.resolve(__dirname, 'index.html')
        console.log('🔄 Serving fallback HTML from:', fallbackPath)
        const fallbackHtml = fs.readFileSync(fallbackPath, 'utf-8')
        res.status(200).set({ 'Content-Type': 'text/html' }).end(fallbackHtml)
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
        next(e)
      }
    }
    
    console.log('🚨 === REQUEST COMPLETE ===')
  })

  const PORT = process.env.PORT || 5173
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📦 Mode: ${isProduction ? 'production' : 'development'}`)
    console.log('🚨 DEBUG VERSION - If you see this, the new server.js is running!')
  })
}

createServer().catch(console.error)