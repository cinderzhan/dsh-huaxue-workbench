import { apply as applyBusiness } from './src/business.js';
export const name = 'huaxue-desktop-workbench';
export const inject = ['settings', 'systemPrompt', 'desktopWorkbenchOwnership'];
export function apply(ctx) {
  applyBusiness(ctx, { readOwnership: () => ctx.desktopWorkbenchOwnership.read() });
}
