export default () =>
  ({
    nodeEnv: process.env.NODE_ENV,
    app: {
      name: process.env.APP_NAME,
      version: process.env.APP_VERSION,
      port: Number(process.env.APP_PORT),
    },
    node: {
      env: process.env.NODE_ENV,
    },
    database: {
      mongo: {
        uri: process.env.DATABASE_MONGO_URI,
      },
    },
    url: {
      base: process.env.BACKEND_BASE_URL,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
    email: {
      token: process.env.EMAIL_TOKEN,
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      from: process.env.EMAIL_FROM,
    },
  }) as const;

export type EnvVar = ReturnType<typeof import('./configuration').default>;
