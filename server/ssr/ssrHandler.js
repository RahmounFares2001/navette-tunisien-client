import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { renderToString } from "react-dom/server";
import React from "react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ssrHandler = async (req, res, next) => {
  try {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/public") ||
      req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|ttf|map)$/i)
    ) {
      return next();
    }

    console.log(`SSR for: ${req.url}`);

    const htmlPath = path.join(__dirname, "../../client/dist/index.html");
    let html = fs.readFileSync(htmlPath, "utf8");
    let appMarkup = "";

    // Try to render with ServerApp (your real React app)
    try {
      const serverAppPath = path.join(__dirname, "../../client/dist/ssr/ServerApp.js");
      
      if (fs.existsSync(serverAppPath)) {
        console.log("Rendering real React app...");
        const module = await import(serverAppPath);
        const ServerApp = module.default || module.ServerApp;
        
        if (ServerApp) {
          appMarkup = renderToString(React.createElement(ServerApp, { url: req.url }));
          console.log(`SSR success for ${req.url}, content length: ${appMarkup.length}`);
        }
      } else {
        console.warn("ServerApp.js not found");
      }
    } catch (ssrError) {
      console.error("SSR failed:", ssrError.message);
      console.error("Full error:", ssrError);
    }

    // Only use minimal fallback if SSR completely fails
    if (!appMarkup) {
      console.log("Using minimal fallback");
      appMarkup = "<div>Loading Navette Tunisie...</div>";
    }

    html = html.replace('<div id="root"></div>', `<div id="root">${appMarkup}</div>`);
    
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);

  } catch (error) {
    console.error("SSR Handler Error:", error);
    next();
  }
};

export default ssrHandler;