import { ConfigsModule, ConfigsService } from '../configs';
import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigsModule,
    MongooseModule.forRootAsync({
      imports: [ConfigsModule],
      useFactory: (configsService: ConfigsService) => {
        const uri = configsService.get('database.mongo.uri');
        Logger.log(`Connecting to MongoDB at ${uri}`);
        return {
          uri,
          serverApi: {
            version: '1',
            strict: false,
            deprecationErrors: true,
          },
        };
      },
      inject: [ConfigsService],
    }),
  ],
})
export class MongodbProviderModule {}
