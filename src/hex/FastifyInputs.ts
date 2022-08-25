export class FastifyInputs {
  protected fastify;
  protected req;

  constructor(fastify, req) {
    this.fastify = fastify;
    this.req = req;
  }
}
