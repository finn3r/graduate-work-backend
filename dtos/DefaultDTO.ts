class DefaultDTO {
  id: string;

  constructor(model: any) {
    this.id = model._id;
  }
}

export default DefaultDTO;
