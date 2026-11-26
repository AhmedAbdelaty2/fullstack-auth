import {
  Controller, type DynamicModule, Get, Global, Module, ServiceUnavailableException,
} from '@nestjs/common';
import { InjectConnection, MongooseModule } from '@nestjs/mongoose';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { type Connection } from 'mongoose';
import { AuthModule } from './auth/auth.module.js';
import { APP_CONFIG, type AppConfig } from './config.js';

@Global()
@Module({})
class ConfigModule {
  static register(config: AppConfig): DynamicModule {
    return {
      module: ConfigModule,
      providers: [{ provide: APP_CONFIG, useValue: config }],
      exports: [APP_CONFIG],
    };
  }
}

@ApiTags('Health')
@Controller('health')
class HealthController {
  constructor(@InjectConnection() private readonly db: Connection) {}

  @Get()
  @ApiOkResponse({ schema: { example: { status: 'ok' } } })
  health() {
    if (this.db.readyState !== 1) throw new ServiceUnavailableException();
    return { status: 'ok' };
  }
}

@Module({})
export class AppModule {
  static register(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.register(config),
        MongooseModule.forRoot(config.mongoUri, {
          autoIndex: true,
          serverSelectionTimeoutMS: 5_000,
          retryAttempts: 1,
        }),
        AuthModule,
      ],
      controllers: [HealthController],
    };
  }
}
