import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'

dotenv.config()

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

const YOUTUBE: Record<string, string> = {
  'Bench Press': 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
  Squat: 'https://www.youtube.com/watch?v=ultWZbUMPL8',
  Deadlift: 'https://www.youtube.com/watch?v=op9kVnS6Qk',
  'Shoulder Press': 'https://www.youtube.com/watch?v=qEwKCR5JCog',
  'Bicep Curl': 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
  'Lat Pulldown': 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
  'Leg Press': 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
  Plank: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
  'Running (treadmill)': 'https://www.youtube.com/watch?v=brFHyOtTwH4',
  Lunges: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
}

interface ExerciseSeed {
  name: string
  sets: number
  reps: number
  weight: number
}

function ex(name: string, sets: number, reps: number, weight: number): ExerciseSeed {
  return { name, sets, reps, weight }
}

const TEMPLATES: Record<string, ExerciseSeed[]> = {
  'Upper Body': [
    ex('Bench Press', 4, 8, 60),
    ex('Shoulder Press', 3, 10, 30),
    ex('Lat Pulldown', 3, 12, 45),
    ex('Bicep Curl', 3, 12, 12),
  ],
  'Leg Day': [
    ex('Squat', 4, 8, 80),
    ex('Leg Press', 4, 10, 120),
    ex('Lunges', 3, 12, 20),
    ex('Plank', 3, 1, 0),
  ],
  Cardio: [
    ex('Running (treadmill)', 1, 1, 0),
    ex('Plank', 3, 1, 0),
    ex('Lunges', 3, 15, 0),
  ],
  'Pull Day': [
    ex('Deadlift', 4, 6, 100),
    ex('Lat Pulldown', 4, 10, 50),
    ex('Bicep Curl', 3, 12, 14),
  ],
  'Push Day': [
    ex('Bench Press', 4, 8, 65),
    ex('Shoulder Press', 4, 10, 32),
    ex('Plank', 3, 1, 0),
  ],
  'Full Body': [
    ex('Squat', 3, 10, 70),
    ex('Bench Press', 3, 10, 55),
    ex('Deadlift', 3, 8, 90),
    ex('Plank', 3, 1, 0),
  ],
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function isoDate(d: Date): string {
  const x = startOfDay(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDays(x, diff)
}

interface WeekPlan {
  offsetWeeks: number
  schedule: Array<{ dayOffset: number; name: keyof typeof TEMPLATES; outcome: 'done' | 'missed' | 'future' }>
}

function buildPlans(todayOffset: number): WeekPlan[] {
  const past = [
    { name: 'Push Day' as const, outcome: 'done' as const },
    { name: 'Pull Day' as const, outcome: 'missed' as const },
    { name: 'Cardio' as const, outcome: 'done' as const },
  ]
  const future = [
    { name: 'Leg Day' as const, outcome: 'future' as const },
    { name: 'Upper Body' as const, outcome: 'future' as const },
  ]

  const currentSchedule: WeekPlan['schedule'] = []
  let pastIdx = 0
  for (let d = 0; d < todayOffset; d++) {
    if (d % 2 === 0 && pastIdx < past.length) {
      currentSchedule.push({ dayOffset: d, ...past[pastIdx++] })
    }
  }
  currentSchedule.push({ dayOffset: todayOffset, name: 'Full Body', outcome: 'done' })
  let futureIdx = 0
  for (let d = todayOffset + 1; d < 7; d++) {
    if (d % 2 === (todayOffset + 1) % 2 && futureIdx < future.length) {
      currentSchedule.push({ dayOffset: d, ...future[futureIdx++] })
    }
  }

  return [
    {
      offsetWeeks: -1,
      schedule: [
        { dayOffset: 0, name: 'Upper Body', outcome: 'done' },
        { dayOffset: 2, name: 'Leg Day', outcome: 'missed' },
        { dayOffset: 4, name: 'Cardio', outcome: 'done' },
      ],
    },
    { offsetWeeks: 0, schedule: currentSchedule },
    {
      offsetWeeks: 1,
      schedule: [
        { dayOffset: 0, name: 'Push Day', outcome: 'future' },
        { dayOffset: 2, name: 'Pull Day', outcome: 'future' },
        { dayOffset: 4, name: 'Leg Day', outcome: 'future' },
        { dayOffset: 6, name: 'Full Body', outcome: 'future' },
      ],
    },
  ]
}

async function main() {
  console.log('Seeding database...')

  const SEED_PASSWORD = 'password123'
  const passwordHash = bcrypt.hashSync(SEED_PASSWORD, 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'admin',
      passwordHash,
    },
  })

  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@test.com' },
    update: {},
    create: {
      email: 'trainer@test.com',
      name: 'Trainer User',
      role: 'trainer',
      passwordHash,
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {},
    create: {
      email: 'user@test.com',
      name: 'John Doe',
      role: 'user',
      passwordHash,
    },
  })

  console.log(`Seeded users: admin=${admin.id}, trainer=${trainer.id}, user=${user.id}`)

  await prisma.trainerAssignment.upsert({
    where: {
      trainerId_userId: {
        trainerId: trainer.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      trainerId: trainer.id,
      userId: user.id,
    },
  })

  console.log('Seeded trainer assignment')

  const today = startOfDay(new Date())
  const thisWeekStart = startOfWeek(today)
  const todayOffset = Math.round(
    (today.getTime() - thisWeekStart.getTime()) / (24 * 60 * 60 * 1000)
  )
  const plans = buildPlans(todayOffset)

  let workoutCount = 0
  for (const plan of plans) {
    const weekStart = addDays(thisWeekStart, plan.offsetWeeks * 7)
    for (const item of plan.schedule) {
      const date = addDays(weekStart, item.dayOffset)
      const allCompleted = item.outcome === 'done'
      const template = TEMPLATES[item.name]
      await prisma.workout.create({
        data: {
          userId: user.id,
          date: isoDate(date),
          name: item.name,
          exercises: {
            create: template.map((t, i) => ({
              name: t.name,
              sets: t.sets,
              reps: t.reps,
              weight: t.weight,
              youtubeUrl: YOUTUBE[t.name] ?? '',
              completed: allCompleted ? true : i < Math.floor(template.length / 2),
            })),
          },
        },
      })
      workoutCount++
    }
  }

  console.log(`Seeded ${workoutCount} workouts with exercises`)

  const now = Date.now()
  await prisma.workoutChangeRequest.createMany({
    data: [
      {
        userId: user.id,
        reason: 'increase_difficulty',
        message: 'Squats feel too easy at this weight — can we bump it up?',
        status: 'pending',
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
      },
      {
        userId: user.id,
        reason: 'change_schedule',
        message: 'Could we move leg day to Saturday going forward?',
        status: 'approved',
        createdAt: new Date(now - 1000 * 60 * 60 * 6),
      },
    ],
  })

  console.log('Seeded 2 workout change requests')
  console.log('Seeding complete!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
