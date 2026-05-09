import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Workout App API',
      version: '1.0.0',
      description: 'REST API for the Workout App',
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        PublicUser: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['user', 'trainer', 'admin'] },
          },
        },
        Exercise: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            sets: { type: 'integer' },
            reps: { type: 'integer' },
            weight: { type: 'number' },
            youtubeUrl: { type: 'string' },
            completed: { type: 'boolean' },
          },
        },
        ExerciseInput: {
          type: 'object',
          required: ['name', 'sets', 'reps', 'weight', 'youtubeUrl'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            sets: { type: 'integer' },
            reps: { type: 'integer' },
            weight: { type: 'number' },
            youtubeUrl: { type: 'string' },
          },
        },
        Workout: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            date: { type: 'string', format: 'date' },
            exercises: {
              type: 'array',
              items: { $ref: '#/components/schemas/Exercise' },
            },
          },
        },
        WorkoutChangeRequest: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            reason: {
              type: 'string',
              enum: ['too_easy', 'too_hard', 'injury', 'schedule', 'other'],
            },
            message: { type: 'string' },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected'],
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)
