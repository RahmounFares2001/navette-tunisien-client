import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ssrHandler = (req, res, next) => {
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
    const html = fs.readFileSync(htmlPath, "utf8");

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error("SSR Error:", error);
    res.status(500).send("Internal Server Error");
  }
};

export default ssrHandler;