import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// PartialType makes every field from CreateUserDto optional for partial updates
// OmitType removes 'password' — password changes go through a dedicated endpoint
// inherits all validators (@IsEmail, @IsString, etc.) from CreateUserDto automatically
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}
