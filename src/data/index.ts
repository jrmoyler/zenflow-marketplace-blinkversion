import type { Product } from '../types/marketplace';
import { catalog as collective } from './catalog';
import { openSource } from './openSource';
import inventoryJson from './inventory.json';

/** Every listing in the registry: division-run agents, the runtime inventory, then open-source projects. */
/** The ZenFlow Master Inventory: 399 agents, workflows, bots and databases on the runtime API. */
export const inventory = inventoryJson as unknown as Product[];

export const catalog: Product[] = [...collective, ...inventory, ...openSource];

export { collective, openSource };
