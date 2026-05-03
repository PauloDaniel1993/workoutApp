import express from "express"
import cors from "cors"

import healthRouter from "./routes/health"
import authRouter from "./routes/auth"
import workoutsRouter from "./routes/workouts"
import usersRouter from "./routes/users"
import trainerRouter from "./routes/trainer"
import adminRouter from "./routes/admin"

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json())

app.use("/api", healthRouter)
app.use("/api/auth", authRouter)
app.use("/api/workouts", workoutsRouter)
app.use("/api/users", usersRouter)
app.use("/api/trainer", trainerRouter)
app.use("/api/admin", adminRouter)

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})

server.on("error", (err: Error) => {
  console.error("Server error:", err)
  process.exit(1)
})
