import DefaultDTO from './DefaultDTO';

class RoleDTO extends DefaultDTO {
  value: string;
  canDeleteEdit: boolean;

  constructor(model: any) {
    super(model);
    this.value = model.value;
    this.canDeleteEdit = model.canDeleteEdit;
  }
}

export default RoleDTO;
