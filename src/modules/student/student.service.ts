import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student, StudentDocument } from './schemas/student.schema';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { CreateStudentWithParentDto } from './dto/create-student-with-parent.dto';
import { ParentService } from '../parent/parent.service';

@Injectable()
export class StudentService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @Inject(forwardRef(() => ParentService))
    private parentService: ParentService,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const existingStudent = await this.studentModel.findOne({
      matricule: createStudentDto.matricule,
    });

    if (existingStudent) {
      throw new ConflictException(
        `Student with matricule ${createStudentDto.matricule} already exists`,
      );
    }

    const newStudent = new this.studentModel(createStudentDto);
    return newStudent.save();
  }

  async createWithParent(createStudentWithParentDto: CreateStudentWithParentDto): Promise<Student> {
    const existingStudent = await this.studentModel.findOne({
      matricule: createStudentWithParentDto.matricule,
    });

    if (existingStudent) {
      throw new ConflictException(
        `Student with matricule ${createStudentWithParentDto.matricule} already exists`,
      );
    }

    // Extract niveau from classe (e.g., "6ème A" -> "6ème")
    const niveau = createStudentWithParentDto.classe.split(' ')[0];

    // Create the parent first
    const parent = await this.parentService.create(createStudentWithParentDto.parent);

    // Create the student with the parent's ID
    const newStudent = new this.studentModel({
      matricule: createStudentWithParentDto.matricule,
      firstName: createStudentWithParentDto.firstName,
      lastName: createStudentWithParentDto.lastName,
      classe: createStudentWithParentDto.classe,
      niveau: niveau,
      status: createStudentWithParentDto.status || 'ACTIF',
      parentId: (parent as any)._id,
    });

    const savedStudent = await newStudent.save();
    const populatedStudent = await this.studentModel.findById(savedStudent._id).populate('parentId');

    if (!populatedStudent) {
      throw new Error('Failed to retrieve created student');
    }

    return populatedStudent as Student;
  }

  async findAll(filters?: {
    classe?: string;
    niveau?: string;
    status?: string;
  }): Promise<Student[]> {
    const query: any = { isActive: true };

    if (filters?.classe) query.classe = filters.classe;
    if (filters?.niveau) query.niveau = filters.niveau;
    if (filters?.status) query.status = filters.status;

    return this.studentModel.find(query).populate('parentId');
  }

  async findById(id: string): Promise<Student> {
    const student = await this.studentModel.findById(id).populate('parentId');

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async findByMatricule(matricule: string): Promise<Student> {
    const student = await this.studentModel
      .findOne({ matricule })
      .populate('parentId');

    if (!student) {
      throw new NotFoundException(
        `Student with matricule ${matricule} not found`,
      );
    }

    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    const student = await this.studentModel.findByIdAndUpdate(
      id,
      updateStudentDto,
      { new: true },
    );

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async delete(id: string): Promise<void> {
    const result = await this.studentModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
  }

  async findByClasse(classe: string): Promise<Student[]> {
    return this.studentModel
      .find({ classe, isActive: true })
      .populate('parentId');
  }

  async findByNiveau(niveau: string): Promise<Student[]> {
    return this.studentModel
      .find({ niveau, isActive: true })
      .populate('parentId');
  }

  async updateEcolageStatus(
    id: string,
    month: string,
    status: string,
  ): Promise<Student> {
    const student = await this.studentModel.findById(id);

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    student.ecolageStatus.set(month, status);
    return student.save();
  }
}
