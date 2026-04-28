import express from "express";
import "#utils/loadEnvironment";
import cors from "cors";
import apiRoutes from "#routers/index.route"

const PORT = process.env.PORT || 5000;
const app = express();

// app.use(cors());

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

//routes
app.use("/", apiRoutes) 

// listen to server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
