import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash } from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  // @InjectRepository(User) tells NestJS DI to inject the TypeORM repository for User entity
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    // check duplicate email before inserting — throws 409 if already exists
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    // cost factor 12 — industry standard, balances security vs performance
    const hashed: string = await hash(dto.password, 12);

    // create() builds the entity object in memory, save() persists it to DB
    const user = this.userRepository.create({ ...dto, password: hashed });
    return this.userRepository.save(user);
  }

  async findAll(pagination: PaginationDto): Promise<[User[], number]> {
    // findAndCount returns [rows, totalCount] in a single query — needed for pagination response
    return this.userRepository.findAndCount({
      skip: pagination.skip, // calculated by PaginationDto getter: (page - 1) * limit
      take: pagination.limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    // throw 404 so the controller and global exception filter return a consistent error shape
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  // returns null instead of throwing — used by AuthService to check credentials safely
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    // findOne throws 404 if user doesn't exist before we attempt update
    const user = await this.findOne(id);
    // Object.assign merges only the fields present in dto onto the existing user object
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    // softDelete sets deletedAt timestamp — row stays in DB but disappears from all normal queries
    await this.userRepository.softDelete(user.id);
  }

  async activate(id: string): Promise<User> {
    // restore clears the deletedAt timestamp so the user reappears in normal queries
    await this.userRepository.restore(id);
    // withDeleted: true needed here to find the user even if restore hasn't propagated yet
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    user.isActive = true;
    return this.userRepository.save(user);
  }
}
