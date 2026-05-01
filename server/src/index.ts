import express from "express"
import cors from "cors"

import healthRouter from "./routes/health"
import authRouter from "./routes/auth"
import workoutsRouter from "./routes/workouts"

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json())

app.use("/api", healthRouter)
app.use("/api/auth", authRouter)
app.use("/api/workouts", workoutsRouter)

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
