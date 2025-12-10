import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Parent } from './modules/parent/schemas/parent.schema';
import { Student } from './modules/student/schemas/student.schema';
import { Classe } from './modules/classe/schemas/classe.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const parentModel = app.get<Model<Parent>>(getModelToken(Parent.name));
  const studentModel = app.get<Model<Student>>(getModelToken(Student.name));
  const classeModel = app.get<Model<Classe>>(getModelToken(Classe.name));

  console.log('🌱 Début du seeding...\n');

  // Nettoyer les collections
  console.log('🧹 Nettoyage des collections...');
  await parentModel.deleteMany({});
  await studentModel.deleteMany({});
  await classeModel.deleteMany({});
  console.log('✅ Collections nettoyées\n');

  // Créer les classes
  console.log('📚 Création des classes...');
  const classes = await classeModel.insertMany([
    {
      nom: '6ème A',
      niveau: '6ème',
      effectif: 30,
      salle: 'Salle 101',
      enseignantPrincipal: 'M. Rakoto',
    },
    {
      nom: '6ème B',
      niveau: '6ème',
      effectif: 28,
      salle: 'Salle 102',
      enseignantPrincipal: 'Mme Rabe',
    },
    {
      nom: '5ème A',
      niveau: '5ème',
      effectif: 25,
      salle: 'Salle 201',
      enseignantPrincipal: 'M. Andria',
    },
    {
      nom: '5ème B',
      niveau: '5ème',
      effectif: 31,
      salle: 'Salle 202',
      enseignantPrincipal: 'Mme Rasoa',
    },
    {
      nom: '4ème A',
      niveau: '4ème',
      effectif: 30,
      salle: 'Salle 301',
      enseignantPrincipal: 'M. Randria',
    },
    {
      nom: '4ème B',
      niveau: '4ème',
      effectif: 27,
      salle: 'Salle 302',
      enseignantPrincipal: 'Mme Rasolofo',
    },
    {
      nom: '3ème A',
      niveau: '3ème',
      effectif: 32,
      salle: 'Salle 401',
      enseignantPrincipal: 'M. Razafy',
    },
    {
      nom: '3ème B',
      niveau: '3ème',
      effectif: 29,
      salle: 'Salle 402',
      enseignantPrincipal: 'Mme Rajaona',
    },
  ]);
  console.log(`✅ ${classes.length} classes créées\n`);

  // Créer les parents
  console.log('👨‍👩‍👧‍👦 Création des parents...');
  const parents = await parentModel.insertMany([
    { name: 'Marie RAKOTO', phone: '+261344426300', relation: 'MERE' },
    { name: 'Paul RABE', phone: '+261347020583', relation: 'PERE' },
    { name: 'Jeanne ANDRIA', phone: '+261349304189', relation: 'MERE' },
    { name: 'Pierre RASOA', phone: '+261340012345', relation: 'PERE' },
    { name: 'Anne RANDRIA', phone: '+261340012349', relation: 'MERE' },
    { name: 'Fara RASOLOFO', phone: '+261331234567', relation: 'MERE' },
    { name: 'Jean RAZAFY', phone: '+261349876543', relation: 'PERE' },
    { name: 'Sophie RAJAONA', phone: '+261340987654', relation: 'MERE' },
  ]);
  console.log(`✅ ${parents.length} parents créés\n`);

  // Créer les étudiants
  console.log('👨‍🎓 Création des étudiants...');
  const students = await studentModel.insertMany([
    {
      matricule: 'ET2024156',
      firstName: 'Kazz',
      lastName: 'RAKOTO',
      classe: '6ème A',
      niveau: '6ème',
      parentId: parents[0]._id,
      status: 'ACTIF',
      ecolageStatus: {
        '2024-09': 'PAYE',
        '2024-10': 'PAYE',
        '2024-11': 'PAYE',
        '2024-12': 'IMPAYE',
      },
    },
    {
      matricule: 'ET2024157',
      firstName: 'Tafita',
      lastName: 'RABE',
      classe: '6ème A',
      niveau: '6ème',
      parentId: parents[1]._id,
      status: 'ACTIF',
      ecolageStatus: {
        '2024-09': 'PAYE',
        '2024-10': 'PAYE',
        '2024-11': 'PAYE',
        '2024-12': 'PAYE',
      },
    },
    {
      matricule: 'ET2024158',
      firstName: 'Mihaja',
      lastName: 'ANDRIA',
      classe: '6ème A',
      niveau: '6ème',
      parentId: parents[2]._id,
      status: 'ACTIF',
      ecolageStatus: {
        '2024-09': 'PAYE',
        '2024-10': 'IMPAYE',
        '2024-11': 'IMPAYE',
        '2024-12': 'IMPAYE',
      },
    },
    {
      matricule: 'ET2024159',
      firstName: 'Lina',
      lastName: 'RASOA',
      classe: '4ème A',
      niveau: '4ème',
      parentId: parents[3]._id,
      status: 'ACTIF',
      ecolageStatus: {
        '2024-09': 'PAYE',
        '2024-10': 'PAYE',
        '2024-11': 'PAYE',
        '2024-12': 'IMPAYE',
      },
    },
    {
      matricule: 'ET2024160',
      firstName: 'Tina',
      lastName: 'RANDRIA',
      classe: '3ème A',
      niveau: '3ème',
      parentId: parents[4]._id,
      status: 'ACTIF',
      ecolageStatus: {
        '2024-09': 'PAYE',
        '2024-10': 'PAYE',
        '2024-11': 'PAYE',
        '2024-12': 'PAYE',
      },
    },
    {
      matricule: 'ET2024161',
      firstName: 'Hery',
      lastName: 'RASOLOFO',
      classe: '6ème B',
      niveau: '6ème',
      parentId: parents[5]._id,
      status: 'ACTIF',
      ecolageStatus: {
        '2024-09': 'IMPAYE',
        '2024-10': 'IMPAYE',
        '2024-11': 'IMPAYE',
        '2024-12': 'IMPAYE',
      },
    },
    {
      matricule: 'ET2024162',
      firstName: 'Nadia',
      lastName: 'RAZAFY',
      classe: '5ème A',
      niveau: '5ème',
      parentId: parents[6]._id,
      status: 'ACTIF',
      ecolageStatus: {
        '2024-09': 'PAYE',
        '2024-10': 'PAYE',
        '2024-11': 'IMPAYE',
        '2024-12': 'IMPAYE',
      },
    },
    {
      matricule: 'ET2024163',
      firstName: 'Kevin',
      lastName: 'RAJAONA',
      classe: '5ème B',
      niveau: '5ème',
      parentId: parents[7]._id,
      status: 'ACTIF',
      ecolageStatus: {
        '2024-09': 'PAYE',
        '2024-10': 'PAYE',
        '2024-11': 'PAYE',
        '2024-12': 'PAYE',
      },
    },
  ]);
  console.log(`✅ ${students.length} étudiants créés\n`);

  console.log('🎉 Seeding terminé avec succès!\n');
  console.log('📊 Résumé:');
  console.log(`   - ${classes.length} classes`);
  console.log(`   - ${parents.length} parents`);
  console.log(`   - ${students.length} étudiants`);

  await app.close();
}

bootstrap();
