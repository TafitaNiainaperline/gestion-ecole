import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvVar } from './configuration';
import { RootKeys, RootKeyType } from '../commons/types/config';

@Injectable()
export class ConfigsService {
  constructor(private configService: ConfigService) {}

  get<T extends RootKeys<EnvVar>>(propertyPath: T): RootKeyType<EnvVar, T> {
    return this.configService.get(propertyPath) as RootKeyType<EnvVar, T>;
  }
}
