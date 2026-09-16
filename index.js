import * as host from './src/host.js';
import * as business from './src/business.js';
export const name = 'huaxue-workbench';
export const inject = ['settings', 'systemPrompt'];
export function apply(ctx) {
  ctx.plugin(host);
  ctx.plugin(business);
}
