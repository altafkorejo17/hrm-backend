import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

// groups all routes under the 'Users' section in Swagger UI
@ApiTags('Users')
// base route: /api/v1/users (prefix + versioning applied in main.ts)
@Controller('users')
export class UsersController {
  // NestJS injects UsersService automatically via dependency injection
  constructor(private readonly usersService: UsersService) {}

  // POST /api/v1/users — @Body() validates request body against CreateUserDto
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // GET /api/v1/users?page=1&limit=10 — @Query() maps query params to PaginationDto
  @Get()
  @ApiOperation({ summary: 'Get all users paginated' })
  findAll(@Query() pagination: PaginationDto) {
    return this.usersService.findAll(pagination);
  }

  // GET /api/v1/users/:id — @Param('id') extracts the id segment from the URL
  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // PATCH /api/v1/users/:id — partial update, only send fields you want to change
  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  // DELETE /api/v1/users/:id — 204 No Content is the standard response for deletes
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // PATCH /api/v1/users/:id/activate — restores a soft-deleted user back to active
  @Patch(':id/activate')
  @ApiOperation({ summary: 'Re-activate a deleted user' })
  activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }
}
