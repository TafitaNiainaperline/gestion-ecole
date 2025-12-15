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
  const classesData = [
    {
      nom: '6ème',
      niveau: '6ème',
      effectif: 30,
      salle: 'Salle 101',
      enseignantPrincipal: 'M. Rakoto',
    },
    {
      nom: '5ème',
      niveau: '5ème',
      effectif: 28,
      salle: 'Salle 201',
      enseignantPrincipal: 'Mme Rabe',
    },
    {
      nom: '4ème',
      niveau: '4ème',
      effectif: 32,
      salle: 'Salle 301',
      enseignantPrincipal: 'M. Andria',
    },
    {
      nom: '3ème',
      niveau: '3ème',
      effectif: 25,
      salle: 'Salle 401',
      enseignantPrincipal: 'Mme Rasoa',
    },
  ];

  const classes = await classeModel.insertMany(classesData);
  console.log(`✅ ${classes.length} classes créées\n`);

  // Numéros réels pour les tests SMS
  const realPhoneNumbers = [
    '0344426300',
    '0328548813',
    '0324058027',
    '0347020583',
    '0347656673',
    '0385998648',
    '0349304189',
    '0349652096',
    '0343519534',
    '0383405789',
    '0340929925',
    '0345812967',
    '0347327950',
    '0345098538',
    '0349919902',
    '0341737793',
    '0385872321',
    '0349703629',
    '0341819395',
    '0387786816',
    '0341612616',
    '0340518878',
    '0347990759',
    '0387284725',
    '0380619610',
    '0388152171',
    '0346404486',
  ];

  // Noms malgaches pour les parents
  const parentNames = [
    { firstName: 'Marie', lastName: 'RAKOTO' },
    { firstName: 'Paul', lastName: 'RABE' },
    { firstName: 'Jeanne', lastName: 'ANDRIA' },
    { firstName: 'Pierre', lastName: 'RASOA' },
    { firstName: 'Anne', lastName: 'RANDRIA' },
    { firstName: 'Fara', lastName: 'RASOLOFO' },
    { firstName: 'Jean', lastName: 'RAZAFY' },
    { firstName: 'Sophie', lastName: 'RAJAONA' },
    { firstName: 'Vincent', lastName: 'RATSIMBA' },
    { firstName: 'Nathalie', lastName: 'RAMIANDRISOA' },
    { firstName: 'Jacques', lastName: 'RANDRIANASOLO' },
    { firstName: 'Isabelle', lastName: 'RAKOTOMALALA' },
    { firstName: 'Michel', lastName: 'RAZAFINDRAMIADANA' },
    { firstName: 'Christine', lastName: 'RAMANANTSOA' },
    { firstName: 'François', lastName: 'RATSIVALAKA' },
    { firstName: 'Michèle', lastName: 'RAHARINIRINA' },
    { firstName: 'Philippe', lastName: 'RAZAFIMAHEFA' },
    { firstName: 'Jacqueline', lastName: 'RAKOTONDRABE' },
    { firstName: 'Alain', lastName: 'RANDRIANARISOA' },
    { firstName: 'Monique', lastName: 'RABEMANANJARA' },
    { firstName: 'Robert', lastName: 'RAHARIJAONA' },
    { firstName: 'Claudine', lastName: 'RATSIMANDRESY' },
    { firstName: 'Daniel', lastName: 'RAKOTOZAFY' },
    { firstName: 'Sylvie', lastName: 'RANDRIAMAMPIONONA' },
    { firstName: 'Bernard', lastName: 'RAKOTONIRINA' },
    { firstName: 'Martine', lastName: 'RAFANOMEZANTSOA' },
    { firstName: 'Georges', lastName: 'RASOANAIVO' },
  ];

  // Prénoms pour les étudiants
  const studentFirstNames = [
    'Kazz',
    'Tafita',
    'Mihaja',
    'Lina',
    'Tina',
    'Hery',
    'Nadia',
    'Kevin',
    'Alex',
    'Benjamin',
    'Cédric',
    'Denis',
    'Eric',
    'Fabrice',
    'Gaston',
    'Henri',
    'Isabelle',
    'Jonathan',
    'Karine',
    'Laurent',
    'Marlène',
    'Nicolas',
    'Olivier',
    'Patricia',
    'Quentin',
    'Rachelle',
    'Stéphane',
  ];

  // Fonction pour formater les numéros au format +261...
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\s+/g, ''); // Enlever les espaces
    if (cleaned.startsWith('0')) {
      return `+261${cleaned.substring(1)}`; // Remplacer 0 par +261
    }
    return cleaned;
  };

  // Créer les 27 parents
  console.log('👨‍👩‍👧‍👦 Création de 27 parents avec numéros réels...');
  const parentsData: any[] = [];
  const relations = ['MERE', 'PERE'];

  realPhoneNumbers.forEach((phone, index) => {
    const { firstName, lastName } = parentNames[index];
    const relation = relations[index % 2];
    parentsData.push({
      name: `${firstName} ${lastName}`,
      phone: formatPhoneNumber(phone),
      relation: relation,
    });
  });

  const parents = await parentModel.insertMany(parentsData);
  console.log(`✅ ${parents.length} parents créés\n`);

  // Créer 27 étudiants (1 par parent)
  console.log('👨‍🎓 Création de 27 étudiants...');
  const studentsData: any[] = [];
  const classNames = classesData.map((c) => c.nom);
  const months = ['2024-09', '2024-10', '2024-11', '2024-12'];
  const paymentStatuses = ['PAYE', 'IMPAYE'];

  parents.forEach((parent, index) => {
    const parentLastName = parent.name.split(' ').pop();
    const selectedClass =
      classNames[Math.floor(Math.random() * classNames.length)];
    const niveau = selectedClass.split(' ')[0];
    const ecolageStatus: any = {};

    months.forEach((month) => {
      ecolageStatus[month] =
        paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    });

    studentsData.push({
      matricule: `ET2024${1001 + index}`,
      firstName: studentFirstNames[index % studentFirstNames.length],
      lastName: parentLastName,
      classe: selectedClass,
      niveau: niveau,
      parentId: parent._id,
      status: 'ACTIF',
      ecolageStatus: ecolageStatus,
    });
  });

  const students = await studentModel.insertMany(studentsData);
  console.log(`✅ ${students.length} étudiants créés\n`);

  console.log('🎉 Seeding terminé avec succès!\n');
  console.log('📊 Résumé:');
  console.log(`   - ${classes.length} classes`);
  console.log(`   - ${parents.length} parents (tous avec numéros réels)`);
  console.log(`   - ${students.length} étudiants (1 par parent)`);

  await app.close();
}

bootstrap();
