class DefaultDTO {
  id: string;

  constructor(model: any) {
    this.id = model._id || model.id;
  }
}

export default DefaultDTO;
