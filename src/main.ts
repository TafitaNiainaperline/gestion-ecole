import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // API prefix
  app.setGlobalPrefix('api');

  // CORS configuration
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
    exposedHeaders: 'Authorization',
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
    .setDescription("Système de gestion d'école")
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) => {
      const method = methodKey
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');
      return method;
    },
  });

  SwaggerModule.setup('ecole/api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    },
  });

  app.getHttpAdapter().get('/ecole/api-docs.json', (_req, res) => {
    res.json(document);
  });

  const port = process.env.APP_PORT || 6012;
  await app.listen(port);
  console.log(` API Documentation: http://localhost:${port}/ecole/api-docs`);
}

bootstrap();
