export class CreateStudentDto {
  matricule: string;
  firstName: string;
  lastName: string;
  classe: string;
  niveau: string;
  parentId: string;
  status?: string;
}
