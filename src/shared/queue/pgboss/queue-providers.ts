import { ConfigService } from '../../config/config.service'
import { EmailService } from '../../emails/email.service'
import { Logger } from 'nestjs-pino'
import PgBoss from 'pg-boss'
import { PgBossQueue } from './pg-boss-queue'

export const jobQueueProviders = [
  {
    provide: 'PG_BOSS',
    useFactory: boss,
  },
  {
    provide: PgBossQueue,
    useFactory: async (pgBoss: PgBoss, configService: ConfigService, emailService: EmailService, logger: Logger): Promise<PgBossQueue> => {
      return new PgBossQueue(pgBoss, configService, emailService, logger)
    },
    inject: ['PG_BOSS', ConfigService, EmailService, Logger],
  },
]

async function boss(): Promise<PgBoss> {
  const c = {
    host: process.env.PGHOST ?? '127.0.0.1',
    port: (process.env.PGPORT ? Number(process.env.PGPORT) : undefined) ?? 5432,
    user: process.env.PGUSER ?? 'postgres',
    password: process.env.PGPASSWORD ?? 'password',
    database: process.env.PGDATABASE ?? 'postgres',
    ssl: process.env.PGSSLMODE === 'require',
  }
  const connectionString = `postgres://${c.user}:${encodeURIComponent(c.password)}@${c.host}:${c.port}/${c.database}${
    c.ssl ? '?sslmode=require' : ''
  }`
  const queue = new PgBoss(connectionString)
  await queue.start()
  return queue
}
