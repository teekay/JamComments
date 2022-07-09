import { AccountController } from './account.controller'
import { AccountsModule } from '../shared/accounts/account.module'
import { AccountsModule as AccountsModuleWeb } from './accounts/accounts.module'
import { AuthModule } from '../shared/auth/auth.module'
import { Client } from 'pg'
import { CommentsModule } from '../shared/comments/comments.module'
import { ConfigModule } from '../shared/config/config.module'
import { DashboardModule } from './dashboard/dashboard.module'
import { EmailsModule } from '../shared/emails/emails.module'
import { HomeModule } from './home/home.module'
import { Inject, Module, OnApplicationShutdown } from '@nestjs/common'
import { Logger } from 'nestjs-pino'
import { loggerConfig } from '../shared/logging/logging-setup'
import { LoggerModule } from 'nestjs-pino'
import { PersistenceModule } from '../shared/persistence/persistence.module'
import PgBoss from 'pg-boss'
import { PgBossQueueModule } from '../shared/queue/pgboss/pg-boss-queue.module'

//console.log(pinoColada())
@Module({
  imports: [
    AccountsModule,
    AccountsModuleWeb,
    AuthModule,
    ConfigModule,
    EmailsModule,
    HomeModule,
    CommentsModule,
    DashboardModule,
    PersistenceModule,
    PgBossQueueModule,
    LoggerModule.forRoot(loggerConfig()),
  ],
  controllers: [AccountController],
})
export class WebModule implements OnApplicationShutdown {
  constructor(
    @Inject('PG_CLIENT') private client: Client,
    @Inject('PG_BOSS') private boss: PgBoss,
    private readonly logger: Logger
  ) {}

  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.log(`Application exiting with code ${signal}`)
    await this.boss.stop()
    await this.client.end()
    this.logger.log('JamComments web stopped')
  }
}
