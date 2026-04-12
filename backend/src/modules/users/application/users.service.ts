import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../domain/ports/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(email: string, passwordHash: string) {
    return this.usersRepository.create(email, passwordHash);
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string) {
    return this.usersRepository.findById(id);
  }

  async update(id: string, data: { displayName?: string }) {
    return this.usersRepository.update(id, data);
  }
}
