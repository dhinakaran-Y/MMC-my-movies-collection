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
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    maxAge: 86400, // 24 hours
  }),
);

app.use(express.json());

//routes
app.use("/", apiRoutes);

// listen to server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
