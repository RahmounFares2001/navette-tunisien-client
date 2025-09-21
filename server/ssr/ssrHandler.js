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

    console.log(`SSR attempt for: ${req.url}`);

    const htmlPath = path.join(__dirname, "../../client/dist/index.html");
    let html = fs.readFileSync(htmlPath, "utf8");
    
    // Create a simple SSR component directly here to avoid complex dependencies
    const getBasicContent = (url) => {
      const routes = {
        '/': { title: 'Navette Tunisie - Service de Transport', content: 'Service de transport et navette en Tunisie' },
        '/transfers': { title: 'Transferts - Navette Tunisie', content: 'Services de transfert aéroport et transport privé' },
        '/excursions': { title: 'Excursions - Navette Tunisie', content: 'Découvrez nos excursions et visites guidées' },
        '/about': { title: 'À propos - Navette Tunisie', content: 'Découvrez notre entreprise de transport' },
        '/contact': { title: 'Contact - Navette Tunisie', content: 'Contactez-nous pour vos besoins de transport' },
        '/blogs': { title: 'Blog - Navette Tunisie', content: 'Actualités et conseils de voyage' }
      };
      
      const route = routes[url] || routes['/'];
      
      return React.createElement('div', { 
        style: { padding: '20px', fontFamily: 'Arial, sans-serif' } 
      }, [
        React.createElement('header', { key: 'header', style: { marginBottom: '20px' } }, [
          React.createElement('h1', { key: 'title' }, route.title),
          React.createElement('nav', { key: 'nav' }, [
            React.createElement('a', { key: 'home', href: '/', style: { marginRight: '15px' } }, 'Accueil'),
            React.createElement('a', { key: 'transfers', href: '/transfers', style: { marginRight: '15px' } }, 'Transferts'),
            React.createElement('a', { key: 'excursions', href: '/excursions', style: { marginRight: '15px' } }, 'Excursions'),
            React.createElement('a', { key: 'about', href: '/about', style: { marginRight: '15px' } }, 'À propos'),
            React.createElement('a', { key: 'contact', href: '/contact' }, 'Contact')
          ])
        ]),
        React.createElement('main', { key: 'main' }, [
          React.createElement('p', { key: 'desc' }, route.content),
          React.createElement('div', { key: 'loading', style: { marginTop: '20px', color: '#666' } }, 'Application en cours de chargement...')
        ])
      ]);
    };

    let appMarkup = "";

    try {
      // Try to use ServerApp first
      const serverAppPath = path.join(__dirname, "../../client/dist/ssr/ServerApp.js");
      
      if (fs.existsSync(serverAppPath)) {
        console.log("ServerApp found, attempting SSR...");
        const module = await import(serverAppPath);
        const ServerApp = module.default || module.ServerApp;
        
        if (ServerApp) {
          appMarkup = renderToString(React.createElement(ServerApp, { url: req.url }));
          console.log("SSR success with ServerApp, length:", appMarkup.length);
        }
      }
    } catch (ssrError) {
      console.error("ServerApp SSR failed:", ssrError.message);
    }

    // Fallback to basic content if ServerApp fails
    if (!appMarkup || appMarkup.length < 100) {
      console.log("Using basic content fallback");
      appMarkup = renderToString(getBasicContent(req.url));
    }

    // Replace the empty root div with our content
    html = html.replace('<div id="root"></div>', `<div id="root">${appMarkup}</div>`);
    
    // Add SSR indicator
    html = html.replace('</head>', `<script>window.__SSR_RENDERED__ = true;</script></head>`);
    
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
    
    console.log(`SSR response sent for: ${req.url}, content length: ${appMarkup.length}`);

  } catch (error) {
    console.error("SSR Handler Error:", error);
    next();
  }
};

export default ssrHandler;