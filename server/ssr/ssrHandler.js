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

    console.log(`=== SSR DEBUG for: ${req.url} ===`);

    const distPath = path.join(__dirname, "../../client/dist");
    const htmlPath = path.join(distPath, "index.html");
    console.log("Dist directory:", distPath);
    console.log("Dist contents:", fs.existsSync(distPath) ? fs.readdirSync(distPath) : "Directory not found");
    console.log("Attempting to read index.html from:", htmlPath);

    let html;
    if (fs.existsSync(htmlPath)) {
      html = fs.readFileSync(htmlPath, "utf8");
    } else {
      console.error("index.html not found at:", htmlPath);
      return res.status(500).send("Server Error: index.html not found. Please run `npm run build` in the client directory.");
    }

    let appMarkup = "";
    const serverAppPath = path.join(__dirname, "../../client/dist/ssr/ServerApp.js");
    console.log("ServerApp path:", serverAppPath);
    console.log("ServerApp exists:", fs.existsSync(serverAppPath));

    if (fs.existsSync(serverAppPath)) {
      try {
        console.log("Attempting to import ServerApp...");
        const module = await import(`${serverAppPath}?t=${Date.now()}`);
        console.log("Imported module keys:", Object.keys(module));

        const ServerApp = module.default || module.ServerApp;
        console.log("ServerApp component:", ServerApp ? "Function found" : "Not found");

        if (ServerApp && typeof ServerApp === "function") {
          console.log("Attempting to render...");
          appMarkup = renderToString(React.createElement(ServerApp, { url: req.url }));
          console.log(`Render successful! Content length: ${appMarkup.length}`);
          console.log("First 200 chars:", appMarkup.substring(0, 200));
        } else {
          console.error("ServerApp component not found or not a function");
        }
      } catch (ssrError) {
        console.error("=== SSR IMPORT/RENDER ERROR ===");
        console.error("Error message:", ssrError.message);
        console.error("Error stack:", ssrError.stack);
      }
    } else {
      console.error("ServerApp.js file not found!");
      const ssrDir = path.join(__dirname, "../../client/dist/ssr/");
      console.log("SSR directory contents:", fs.existsSync(ssrDir) ? fs.readdirSync(ssrDir) : "Directory not found");
    }

    // Use fallback if no markup
    if (!appMarkup) {
      console.log("Using fallback content");
      appMarkup = "<div><h1>Navette Tunisie</h1><p>Loading application...</p></div>";
    }

    html = html.replace('<div id="root"></div>', `<div id="root">${appMarkup}</div>`);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error("SSR Handler Error:", error);
    res.status(500).send("Server Error: Unable to render page. Please check server logs.");
  }
};

export default ssrHandler;