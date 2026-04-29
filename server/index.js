import express from "express";
import "#utils/loadEnvironment";
import cors from "cors";
import apiRoutes from "#routers/index.route";

const PORT = process.env.PORT || 5000;
const app = express();

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://mmc-my-movies-collection.vercel.app",
  "https://mmc-my-movies-collections-frontend.vercel.app",
];

// CORS configuration with proper credential handling
const corsOptions = {
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400,
};

app.use(cors(corsOptions));

// Ensure CORS headers are sent on all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
  }

  if (req.method === "OPTIONS") {
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With",
    );
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

//routes
app.use("/", apiRoutes);

// listen to server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
