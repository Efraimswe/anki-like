export interface PublicUser {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: Date;
}

export interface UserCredentials extends PublicUser {
  passwordHash: string;
}

export abstract class UsersRepository {
  abstract create(email: string, passwordHash: string): Promise<PublicUser>;
  abstract findByEmail(email: string): Promise<UserCredentials | null>;
  abstract findById(id: string): Promise<PublicUser | null>;
  abstract update(id: string, data: { displayName?: string }): Promise<PublicUser>;
}
