import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import session from "express-session";
import { WebSocketServer } from "ws";
import http from "http";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:"],
    },
  },
}));

app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dyad-dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.post("/api/:method", async (req: Request, res: Response, next: NextFunction) => {
  const { method } = req.params;
  const data = req.body;

  try {
    // Route to appropriate handler
    const result = await handleIpcMethod(method, data, req);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    error: err.message || "Internal server error",
  });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const staticPath = path.join(__dirname, "../../dist-web");
  app.use(express.static(staticPath));

  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

// Create HTTP server
const server = http.createServer(app);

// WebSocket server for real-time communication
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws, req) => {
  const channel = req.url?.split("/").pop() || "default";
  console.log(`WebSocket client connected to channel: ${channel}`);

  ws.on("message", (message) => {
    console.log(`Received message on ${channel}:`, message.toString());
    // Handle WebSocket messages
  });

  ws.on("close", () => {
    console.log(`WebSocket client disconnected from channel: ${channel}`);
  });

  ws.on("error", (error) => {
    console.error(`WebSocket error on ${channel}:`, error);
  });
});

/**
 * Handle IPC method calls from web clients
 */
async function handleIpcMethod(method: string, data: any, _req: Request): Promise<any> {
  console.log(`IPC method called: ${method}`);

  // Route to appropriate handler based on method name
  switch (method) {
    // Database operations
    case "db:initialize":
      return { success: true };

    case "db:query":
      return handleDbQuery(data);

    case "db:execute":
      return handleDbExecute(data);

    case "db:get":
      return handleDbGet(data);

    // File system operations
    case "fs:readFile":
      return handleReadFile(data);

    case "fs:writeFile":
      return handleWriteFile(data);

    case "fs:deleteFile":
      return handleDeleteFile(data);

    case "fs:exists":
      return handleExists(data);

    case "fs:readDir":
      return handleReadDir(data);

    case "fs:createDir":
      return handleCreateDir(data);

    case "fs:deleteDir":
      return handleDeleteDir(data);

    // Add more handlers as needed
    default:
      throw new Error(`Unknown IPC method: ${method}`);
  }
}

// Placeholder handlers (implement actual logic)
async function handleDbQuery(_data: any) {
  // TODO: Implement database query logic
  return [];
}

async function handleDbExecute(_data: any) {
  // TODO: Implement database execute logic
  return { success: true };
}

async function handleDbGet(_data: any) {
  // TODO: Implement database get logic
  return null;
}

async function handleReadFile(_data: any) {
  // TODO: Implement file read logic
  throw new Error("File operations require server-side storage setup");
}

async function handleWriteFile(_data: any) {
  // TODO: Implement file write logic
  throw new Error("File operations require server-side storage setup");
}

async function handleDeleteFile(_data: any) {
  // TODO: Implement file delete logic
  throw new Error("File operations require server-side storage setup");
}

async function handleExists(_data: any) {
  // TODO: Implement file exists check
  return false;
}

async function handleReadDir(_data: any) {
  // TODO: Implement directory read logic
  return [];
}

async function handleCreateDir(_data: any) {
  // TODO: Implement directory create logic
  throw new Error("Directory operations require server-side storage setup");
}

async function handleDeleteDir(_data: any) {
  // TODO: Implement directory delete logic
  throw new Error("Directory operations require server-side storage setup");
}

// Start server
server.listen(PORT, () => {
  console.log(`Dyad Web Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
