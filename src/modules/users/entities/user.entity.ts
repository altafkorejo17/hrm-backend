import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

// four roles allowed in the system — stored as MySQL ENUM column
export enum UserRole {
  ADMIN = 'admin',
  HR = 'hr',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

// maps this class to the 'users' table in the database
@Entity('users')
export class User {
  // auto-generates a UUID primary key e.g. "a3f1c2d4-..."
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // unique constraint at DB level — no two users can share an email
  @Column({ unique: true, length: 255 })
  email: string;

  // @Exclude() hides this field from all API responses via ClassSerializerInterceptor
  @Exclude()
  @Column({ length: 255 })
  password: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  // MySQL ENUM column — only accepts the four UserRole values at DB level
  @Column({ type: 'enum', enum: UserRole, default: UserRole.EMPLOYEE })
  role: UserRole;

  // new users are active by default — set false on soft delete
  @Column({ default: true })
  isActive: boolean;

  // null until the user logs in for the first time — updated by AuthService on login
  @Column({ type: 'datetime', nullable: true })
  lastLoginAt: Date | null;

  // TypeORM sets this automatically on INSERT — never set manually
  @CreateDateColumn()
  createdAt: Date;

  // TypeORM updates this automatically on every UPDATE — never set manually
  @UpdateDateColumn()
  updatedAt: Date;

  // soft delete column — softDelete() sets this instead of removing the row
  // all queries automatically exclude rows where deletedAt IS NOT NULL
  @DeleteDateColumn()
  deletedAt: Date | null;
}
