import { Controller } from 'egg';

export default class PunchController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.redirect('/public/punch.html');
  }

  async nodes() {
    const { ctx } = this;
    ctx.body = ctx.service.punch.getNodes();
  }

  async start() {
    const { ctx } = this;
    const { nodeId, probePort, retryInterval, timeout } = ctx.request.body;
    const result = await ctx.service.punch.start(nodeId, probePort, retryInterval, timeout);
    ctx.body = result;
  }

  async stop() {
    const { ctx } = this;
    ctx.service.punch.stop();
    ctx.body = { success: true };
  }

  async status() {
    const { ctx } = this;
    ctx.body = { status: ctx.service.punch.getStatus() };
  }
}
