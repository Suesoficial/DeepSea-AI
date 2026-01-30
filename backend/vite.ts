// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay()
  ],
  resolve: {
    alias: {
      "@": path2.resolve(process.cwd(), "..", "frontend", "src"), // From backend to frontend/src
      "@shared": path2.resolve(process.cwd(), "shared"), // shared is in backend
      "@assets": path2.resolve(process.cwd(), "..", "attached_assets") // if this exists
    }
  },
  root: path2.resolve(process.cwd(), "..", "frontend"), // From backend to frontend
  build: {
    outDir: path2.resolve(process.cwd(), "dist", "public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app2: any, server: any) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: ['localhost'] as string[]
  };

  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        throw new Error(`Vite error: ${msg}`);
      }
    },
    server: serverOptions,
    appType: "custom"
  });

  app2.use(vite.middlewares);

  app2.use("*", async (req: any, res: any, next: any) => {
    const url = req.originalUrl;
    try {
      // Since you run from backend directory, go up one level to deepsea-ai root, then into frontend
      const clientTemplate = path3.resolve(
        process.cwd(),    // This is backend directory
        "..",             // Go up to deepsea-ai root  
        "frontend",       // Then into frontend
        "index.html"
      );

      console.log(`Current working directory: ${process.cwd()}`);
      console.log(`Looking for template at: ${clientTemplate}`);
      console.log(`File exists: ${fs2.existsSync(clientTemplate)}`);
      
      if (!fs2.existsSync(clientTemplate)) {
        // List what's actually in the expected directory
        const frontendDir = path3.resolve(process.cwd(), "..", "frontend");
        console.log(`Contents of ${frontendDir}:`);
        if (fs2.existsSync(frontendDir)) {
          const files = fs2.readdirSync(frontendDir);
          console.log(files);
        } else {
          console.log("Frontend directory does not exist!");
        }
        
        throw new Error(`Could not find frontend template at: ${clientTemplate}`);
      }

      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e: any) {
      console.error("Vite setup error:", e);
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

export function serveStatic(app2: any) {
  const distPath = path3.resolve(process.cwd(), "dist", "public");
  
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  
  app2.use(express.static(distPath));
  app2.use("*", (_req: any, res: any) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}