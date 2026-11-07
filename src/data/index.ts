import type { Product } from '../types/marketplace';
import { catalog as collective } from './catalog';
import { openSource } from './openSource';

/** Every listing in the registry: division-run agents, then open-source projects. */
export const catalog: Product[] = [...collective, ...openSource];

export { collective, openSource };
