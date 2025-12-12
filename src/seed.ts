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
  const niveaux = ['6ème', '5ème', '4ème', '3ème'];
  const salles = ['Salle 101', 'Salle 102', 'Salle 103', 'Salle 201', 'Salle 202', 'Salle 203', 'Salle 301', 'Salle 302', 'Salle 303', 'Salle 401', 'Salle 402', 'Salle 403'];
  const enseignants = ['M. Rakoto', 'Mme Rabe', 'M. Andria', 'Mme Rasoa', 'M. Randria', 'Mme Rasolofo', 'M. Razafy', 'Mme Rajaona', 'M. Randrianampoinimerina', 'Mme Andrianampoinimerina', 'M. Ratsimihafotsahavola', 'Mme Razafindratsimandroso'];
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  const classesData: any[] = [];
  let salle_idx = 0;
  let teacher_idx = 0;

  for (const niveau of niveaux) {
    for (let i = 0; i < 6; i++) {
      classesData.push({
        nom: `${niveau} ${letters[i]}`,
        niveau: niveau,
        effectif: Math.floor(Math.random() * 10) + 25,
        salle: salles[salle_idx % salles.length],
        enseignantPrincipal: enseignants[teacher_idx % enseignants.length],
      });
      salle_idx++;
      teacher_idx++;
    }
  }

  const classes = await classeModel.insertMany(classesData);
  console.log(` ${classes.length} classes créées\n`);

  // Créer les parents
  console.log(' Création des parents...');
  const firstNames = ['Marie', 'Paul', 'Jeanne', 'Pierre', 'Anne', 'Fara', 'Jean', 'Sophie', 'Vincent', 'Nathalie', 'Jacques', 'Isabelle', 'Michel', 'Christine', 'François', 'Michèle', 'Philippe', 'Jacqueline', 'Alain', 'Monique'];
  const lastNames = ['RAKOTO', 'RABE', 'ANDRIA', 'RASOA', 'RANDRIA', 'RASOLOFO', 'RAZAFY', 'RAJAONA', 'RANDRIANAMPOINIMERINA', 'ANDRIANAMPOINIMERINA', 'RATSIMIHAFOTSAHAVOLA', 'RAZAFINDRATSIMANDROSO', 'RATSIMBA', 'RAMIANDRISOA', 'RANDRIANASOLO', 'RATSIFANDRIHAMANANA', 'RAKOTOMALALA', 'RAZAFINDRAMIADANA', 'RAMANANTSOA', 'RATSIVALAKA'];
  const relations = ['MERE', 'PERE'];

  const parentsData: any[] = [];
  for (let i = 0; i < 500; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const phone = `+261${Math.floor(Math.random() * 9) + 3}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
    parentsData.push({
      name: `${firstName} ${lastName}`,
      phone: phone,
      relation: relations[Math.floor(Math.random() * relations.length)],
    });
  }

  const parents = await parentModel.insertMany(parentsData);
  console.log(` ${parents.length} parents créés\n`);

  // Créer les étudiants
  console.log('👨‍🎓 Création des étudiants...');
  const studentFirstNames = ['Kazz', 'Tafita', 'Mihaja', 'Lina', 'Tina', 'Hery', 'Nadia', 'Kevin', 'Alex', 'Benjamin', 'Cédric', 'Denis', 'Eric', 'Fabrice', 'Gaston', 'Henri', 'Isabelle', 'Jonathan', 'Karine', 'Laurent', 'Marlène', 'Nicolas', 'Olivier', 'Patricia', 'Quentin', 'Rachelle', 'Stéphane', 'Thérèse', 'Ulric', 'Valérie'];
  const studentLastNames = ['RAKOTO', 'RABE', 'ANDRIA', 'RASOA', 'RANDRIA', 'RASOLOFO', 'RAZAFY', 'RAJAONA', 'RANDRIANAMPOINIMERINA', 'ANDRIANAMPOINIMERINA', 'RATSIMIHAFOTSAHAVOLA', 'RAZAFINDRATSIMANDROSO', 'RATSIMBA', 'RAMIANDRISOA', 'RANDRIANASOLO'];
  const classNames = classesData.map(c => c.nom);
  const statuses = ['ACTIF', 'INACTIF', 'SUSPENDU'];
  const months = ['2024-09', '2024-10', '2024-11', '2024-12'];
  const paymentStatuses = ['PAYE', 'IMPAYE'];

  const studentsData: any[] = [];
  for (let i = 0; i < 2000; i++) {
    const selectedClass = classNames[Math.floor(Math.random() * classNames.length)];
    const niveau = selectedClass.split(' ')[0];
    const ecolageStatus: any = {};

    months.forEach(month => {
      ecolageStatus[month] = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    });

    studentsData.push({
      matricule: `ET2024${1000 + i}`,
      firstName: studentFirstNames[Math.floor(Math.random() * studentFirstNames.length)],
      lastName: studentLastNames[Math.floor(Math.random() * studentLastNames.length)],
      classe: selectedClass,
      niveau: niveau,
      parentId: parents[Math.floor(Math.random() * parents.length)]._id,
      status: statuses[Math.floor(Math.random() * 2)],
      ecolageStatus: ecolageStatus,
    });
  }

  const students = await studentModel.insertMany(studentsData);
  console.log(` ${students.length} étudiants créés\n`);

  console.log(' Seeding terminé avec succès!\n');
  console.log(' Résumé:');
  console.log(`   - ${classes.length} classes`);
  console.log(`   - ${parents.length} parents`);
  console.log(`   - ${students.length} étudiants`);

  await app.close();
}

bootstrap();
