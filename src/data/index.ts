import type { Product } from '../types/marketplace';
import { catalog as collective } from './catalog';
import { directory } from './directory';
import { openSource } from './openSource';

/** Every listing in the registry: division-run agents, division services, then open-source projects. */
export const catalog: Product[] = [...collective, ...directory, ...openSource];

export { collective, directory, openSource };
