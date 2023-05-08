import RoleDTO from './RoleDTO';
import DefaultDTO from './DefaultDTO';
import { UserStatus } from '../models/User';

class UserDTO extends DefaultDTO {
  email: string;
  roles: string[];
  isConfirmedEmail: boolean;
  phone?: string;
  firstName?: string;
  lastName?: string;
  updatedAt: string;
  createdAt: string;
  avatar?: string;
  status?: string;

  constructor(model: any) {
    super(model)
    this.email = model.email;
    this.isConfirmedEmail = model.isConfirmedEmail;
    this.phone = model.phone;
    this.firstName = model.firstName;
    this.lastName = model.lastName;
    this.updatedAt = model.updatedAt;
    this.createdAt = model.createdAt;
    this.avatar = model.avatar;
    this.status = model.status || UserStatus.ACTIVE;
    this.roles = model.roles.map((it: any) => new RoleDTO(it));
  }
}

export default UserDTO;
