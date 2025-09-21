import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { renderToString } from "react-dom/server";
import React from "react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ssrHandler = async (req, res, next) => {
  try {
    // Skip SSR for API routes and static assets
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/public") ||
      req.path.includes(".js") ||
      req.path.includes(".css") ||
      req.path.includes(".png") ||
      req.path.includes(".jpg") ||
      req.path.includes(".jpeg") ||
      req.path.includes(".gif") ||
      req.path.includes(".svg") ||
      req.path.includes(".ico") ||
      req.path.includes(".woff") ||
      req.path.includes(".ttf") ||
      req.path === "/favicon.ico"
    ) {
      return next();
    }

    // Path to the pre-built client HTML
    const htmlPath = path.join(__dirname, "../../client/dist/index.html");
    if (!fs.existsSync(htmlPath)) {
      console.error("HTML template not found at:", htmlPath);
      return res.status(500).send("HTML template not found");
    }

    // Read the HTML template
    let html = fs.readFileSync(htmlPath, "utf8");
    let appMarkup = "";

    // Try to perform SSR
    try {
      const serverAppPath = path.join(__dirname, "../../client/dist/ssr/ServerApp.js");
      
      if (fs.existsSync(serverAppPath)) {
        // Dynamic import with proper error handling
        const { default: ServerApp } = await import(serverAppPath);
        
        if (ServerApp) {
          appMarkup = renderToString(React.createElement(ServerApp, { url: req.url }));
          console.log("SSR rendered successfully for:", req.url);
        }
      } else {
        console.warn("ServerApp.js not found, falling back to client-side rendering");
      }
    } catch (ssrError) {
      console.error("SSR rendering failed:", ssrError.message);
      console.log("Falling back to client-side rendering for:", req.url);
    }

    // Inject the rendered app into the HTML template (or serve empty root for CSR)
    if (appMarkup) {
      html = html.replace('<div id="root"></div>', `<div id="root">${appMarkup}</div>`);
    }

    // Add SSR indicator in development
    if (process.env.NODE_ENV === 'development') {
      html = html.replace('</head>', `
        <script>
          window.__SSR_ENABLED__ = ${!!appMarkup};
          console.log('SSR Status:', window.__SSR_ENABLED__ ? 'Server-side rendered' : 'Client-side rendered');
        </script>
        </head>`);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error("SSR Handler Error:", error);
    
    // Final fallback - serve static HTML
    try {
      const htmlPath = path.join(__dirname, "../../client/dist/index.html");
      const html = fs.readFileSync(htmlPath, "utf8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError);
      res.status(500).send("Internal Server Error");
    }
  }
};

export default ssrHandler;