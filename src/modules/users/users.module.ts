import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  // forFeature registers the User entity repository for injection via @InjectRepository(User)
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  // exports UsersService so AuthModule can inject it without re-declaring it
  exports: [UsersService],
})
export class UsersModule {}
