import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/providers/database/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Prisma } from 'generated/prisma/client';
import { User as UserModel } from 'generated/prisma/client';
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserModel> {
    const { email, name, passwordHash, role } = createUserDto;
    try {
      return await this.prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Este e-mail já está cadastrado.');
      }
      console.error(error);
      throw new InternalServerErrorException('Erro ao criar usuário.');
    }
  }

  async findOne(id: string): Promise<Omit<UserModel, 'passwordHash'>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const { passwordHash, ...result } = user;
    return result;
  }

  async findOneByEmail(email: string): Promise<UserModel | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
