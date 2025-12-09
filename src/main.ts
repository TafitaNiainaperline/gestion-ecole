import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  BadRequestException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth/guards/auth.guard';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const jwtService = app.get(JwtService);
  const reflector = app.get(Reflector);

  // API prefix
  app.setGlobalPrefix('api');

  // CORS configuration
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
  });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const message = errors[0].constraints
          ? Object.values(errors[0].constraints)[0]
          : 'Validation failed';
        return new BadRequestException(message);
      },
    }),
  );

  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gestion Ecole API')
    .setDescription('Système de gestion d\'école')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) => {
      const method = methodKey.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
      return method;
    },
  });

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  app.getHttpAdapter().get('/api-docs.json', (req, res) => {
    res.json(document);
  });

  // Global authentication guard
  app.useGlobalGuards(new AuthGuard(jwtService, reflector));

  const port = process.env.APP_PORT || 6012;
  await app.listen(port);
  console.log(` API Documentation: http://localhost:${port}/api-docs`);
}

bootstrap();
