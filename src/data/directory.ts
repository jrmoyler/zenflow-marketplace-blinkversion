import type { AegisDeclaration, DirectoryInfo, Product, Publisher } from '../types/marketplace';

/**
 * Division services: the live offers each Collective AI division publishes on
 * its own site (repo collective-ai-divisions, build/divisions/<slug>.js).
 *
 * Every field traces to that division's published copy. Where the copy says
 * nothing about governance for an offer, `aegis` is null (not assessed).
 * Pricing follows the price string on the page: "Monthly" with no amount,
 * "Quoted", "Early access" and "Published at launch" are all `quote`.
 *
 * These are the services. The agents the divisions run internally are in
 * catalog.ts and are not repeated here.
 */

export const DIVISIONS_BASE = 'https://collective-ai-divisions-brown.vercel.app';

/** Division slugs, as in collective-ai-divisions build/registry.js. */
export const DIVISION_SLUGS: Record<Publisher, string> = {
  ZenFlow: 'zenflow',
  'The Collective': 'the-collective',
  'Hybrid Living': 'hybrid-living',
  'Nexus Labs': 'nexus-labs',
  'Binary Loom': 'binary-loom',
  'Obsidian Arc': 'obsidian-arc',
  'Quantum Ledger': 'quantum-ledger',
  'Juris Guard': 'juris-guard',
  'Signal Velocity': 'signal-velocity',
};

/** Most recent commit touching each division file (git log -1 --format=%cs). */
const LISTED = '2026-11-07';

function page(publisher: Publisher, file: string, status: DirectoryInfo['status']): DirectoryInfo {
  return { url: `${DIVISIONS_BASE}/${DIVISION_SLUGS[publisher]}/${file}`, status };
}

type Draft = Omit<Product, 'source' | 'deployedIn' | 'version' | 'updated' | 'changelog'> & {
  publisher: Publisher;
};

function listing(d: Draft): Product {
  return {
    ...d,
    source: 'directory',
    deployedIn: `Offered on the ${d.publisher} site`,
    version: '1.0.0',
    updated: LISTED,
    changelog: [{ version: '1.0.0', date: LISTED, note: `Listed from the ${d.publisher} site.` }],
  };
}

// ZenFlow services.html, "What every build includes" and decision-log.html:
// every agent writes a plain-language decision log; anything that spends money,
// signs or deletes waits for a person; each build has a written brief of the
// jobs it is not allowed to do. Inspectability of prompts is not stated.
const zenflowBuild: AegisDeclaration = {
  refusals: [
    "Never spends money, signs or deletes without a person's approval",
    'Does not take on jobs its written brief says it is not allowed to do',
  ],
  escalations: [
    'Payments, contracts and deletions always wait for someone on your team to sign off',
    'Anything the agent flags in the decision log for a person to review',
  ],
  auditLog: true,
  humanInLoop: true,
  inspectable: false,
};

// Quantum Ledger principles.html and site legal line. Applies to every product.
const quantumLedger: AegisDeclaration = {
  refusals: [
    'Not investment, tax or legal advice, and not an offer to buy or sell any security or digital asset',
    'Never promises or projects a return',
  ],
  escalations: ['The final call on your money stays with you; every AI suggestion shows why it was made'],
  auditLog: false,
  humanInLoop: true,
  inspectable: false,
};

// Juris Guard scope.html, "What it does not do", and the site legal line.
const jurisGuard: AegisDeclaration = {
  refusals: [
    'Not legal advice, and does not form an attorney-client relationship or replace a licensed attorney',
    'Does not make final decisions on contracts or compliance; a person does',
  ],
  escalations: ['Final decisions on contracts and compliance go to a person'],
  auditLog: false,
  humanInLoop: true,
  inspectable: false,
};

export const directory: Product[] = [
  // ─── ZenFlow ───────────────────────────────────────────────────────────────
  listing({
    id: 'rent-an-agent',
    title: 'Rent an agent',
    summary: 'A configured agent for one job, such as inbox triage, lead follow-up, scheduling or research, with a prompt library, setup and optional ongoing management.',
    audience: 'Small teams who need the role covered now.',
    category: 'agents',
    publisher: 'ZenFlow',
    capabilities: [
      'Covers one job: inbox triage, lead follow-up, scheduling or research',
      'Prompt library and setup included',
      'Optional ongoing management',
      'Plain-language decision log for every action',
    ],
    inputs: ['The job you want covered', 'Access to the tools that job runs in'],
    outputs: ['A configured agent doing that job', 'Decision log entries for each action'],
    integrations: [],
    scopes: ['email', 'crm', 'calendar', 'public-web'],
    pricing: { model: 'quote', amount: 0 },
    aegis: zenflowBuild,
    directory: page('ZenFlow', 'services.html', 'available'),
    tags: ['agent rental', 'inbox triage', 'lead follow-up', 'scheduling', 'research'],
  }),
  listing({
    id: 'ai-employee-setup',
    title: 'AI Employee Setup',
    summary: 'A role-based assistant built around your tools, with workflow prompts, basic automations and an operating guide your team can follow.',
    audience: 'Solo operators and small businesses.',
    category: 'agents',
    publisher: 'ZenFlow',
    capabilities: [
      'Role-based assistant built around your existing tools',
      'Workflow prompts for the role',
      'Basic automations',
      'Operating guide for your team',
    ],
    inputs: ['The role you want covered', 'The tools you already use'],
    outputs: ['A role-based assistant', 'Workflow prompts', 'Basic automations', 'An operating guide'],
    integrations: [],
    scopes: [],
    pricing: { model: 'one-time', amount: 997 },
    aegis: zenflowBuild,
    directory: page('ZenFlow', 'services.html', 'available'),
    tags: ['ai assistant', 'setup', 'small business', 'operating guide'],
  }),
  listing({
    id: 'custom-agent-build',
    title: 'Custom agent build',
    summary: 'Agents designed around your systems, with memory, tool access and handoffs between agents, scoped after a call.',
    audience: 'Companies with a defined process.',
    category: 'agents',
    publisher: 'ZenFlow',
    capabilities: ['Agents designed around your systems', 'Memory', 'Tool access', 'Handoffs between agents'],
    inputs: ['Your defined process', 'Access to your systems', 'A scoping call'],
    outputs: ['One or more agents running in your systems', 'Decision log', 'Handoff guide'],
    integrations: [],
    scopes: [],
    pricing: { model: 'quote', amount: 0 },
    aegis: zenflowBuild,
    directory: page('ZenFlow', 'services.html', 'available'),
    tags: ['custom build', 'multi-agent', 'memory', 'tool use'],
  }),
  listing({
    id: 'agent-foundry',
    title: 'Agent Foundry',
    summary: 'Tools and APIs to build, deploy and manage your own agents, with memory, tool use and agent-to-agent handoff.',
    audience: 'Developers and technical founders.',
    category: 'agents',
    publisher: 'ZenFlow',
    capabilities: ['Build, deploy and manage your own agents', 'Memory', 'Tool use', 'Agent-to-agent handoff'],
    inputs: ['Your agent designs'],
    outputs: ['Agents you build and run yourself'],
    integrations: [],
    scopes: ['code'],
    pricing: { model: 'quote', amount: 0 },
    // The build guarantees cover ZenFlow-built agents; nothing is stated for agents you build on Foundry.
    aegis: null,
    directory: page('ZenFlow', 'services.html', 'in-the-lab'),
    tags: ['developer tools', 'api', 'platform', 'early access'],
  }),

  // ─── The Collective ────────────────────────────────────────────────────────
  listing({
    id: 'ai-business-integration-package',
    title: 'AI Business Integration Package',
    summary: 'Sets AI into the tools you already use, with prompts and workflows matched to how your team works.',
    audience: 'Small businesses and solo founders who want fixed-price work with the price stated up front.',
    category: 'workflows',
    publisher: 'The Collective',
    capabilities: ['AI set into your existing tools', 'Prompts matched to your team', 'Workflows matched to how your team works'],
    inputs: ['The tools you already use', 'How your team works today'],
    outputs: ['Prompts and workflows inside your tools'],
    integrations: [],
    scopes: [],
    pricing: { model: 'one-time', amount: 1000 },
    aegis: null,
    directory: page('The Collective', 'services.html', 'available'),
    tags: ['integration', 'prompts', 'workflows', 'fixed price'],
  }),
  listing({
    id: 'done-for-you-automation',
    title: 'Done-For-You Automation',
    summary: 'A working automation for repetitive admin, lead follow-up or reporting, connected, tested, documented and handed off.',
    audience: 'Small businesses and solo founders who want fixed-price work with the price stated up front.',
    category: 'automations',
    publisher: 'The Collective',
    capabilities: ['Automates repetitive admin, lead follow-up or reporting', 'Connected and tested', 'Documented', 'Handed off to your team'],
    inputs: ['The repetitive task', 'Access to the tools it runs in'],
    outputs: ['A working automation', 'Documentation and handoff'],
    integrations: [],
    scopes: ['crm'],
    pricing: { model: 'one-time', amount: 1997 },
    aegis: null,
    directory: page('The Collective', 'services.html', 'available'),
    tags: ['automation', 'admin', 'lead follow-up', 'reporting', 'fixed price'],
  }),

  // ─── Hybrid Living ─────────────────────────────────────────────────────────
  listing({
    id: 'peteer-ai-tutor',
    title: 'P.E.T.E.E.R.',
    summary: 'An AI tutor being built to adjust to how you learn, used in Hybrid Living lessons.',
    audience: 'Learners on Hybrid Living tracks.',
    category: 'agents',
    publisher: 'Hybrid Living',
    capabilities: ['Adjusts to how you learn'],
    inputs: ['Your lessons and exercises'],
    outputs: ['Tutoring that adapts to you'],
    integrations: [],
    scopes: [],
    pricing: { model: 'quote', amount: 0 },
    aegis: null,
    directory: page('Hybrid Living', 'tracks.html', 'in-the-lab'),
    tags: ['tutor', 'education', 'learning', 'early access'],
  }),

  // ─── Nexus Labs ────────────────────────────────────────────────────────────
  listing({
    id: 'creator-nexus',
    title: 'Creator Nexus',
    summary: 'A platform for independent creators with an AI co-pilot, monetization tools and a community, in development.',
    audience: 'Independent creators.',
    category: 'agents',
    publisher: 'Nexus Labs',
    capabilities: ['AI co-pilot for creators', 'Monetization tools', 'Creator community'],
    inputs: ['Your creator work'],
    outputs: ['Co-pilot help', 'Monetization tools'],
    integrations: [],
    scopes: [],
    pricing: { model: 'quote', amount: 0 },
    aegis: null,
    directory: page('Nexus Labs', 'studio.html', 'in-the-lab'),
    tags: ['creators', 'co-pilot', 'monetization', 'early access'],
  }),

  // ─── Quantum Ledger ────────────────────────────────────────────────────────
  listing({
    id: 'quantum-wealth',
    title: 'Quantum Wealth',
    summary: 'AI-assisted portfolio building, options strategy tools, tax-aware planning and a way to follow strategies others share.',
    audience: 'Individuals.',
    category: 'agents',
    publisher: 'Quantum Ledger',
    capabilities: ['AI-assisted portfolio building', 'Options strategy tools', 'Tax-aware planning', 'Follow strategies others share'],
    inputs: ['Your portfolio and goals'],
    outputs: ['Portfolio and strategy suggestions, each with the reason it was made'],
    integrations: [],
    scopes: ['payments'],
    pricing: { model: 'quote', amount: 0 },
    aegis: quantumLedger,
    directory: page('Quantum Ledger', 'products.html', 'in-the-lab'),
    tags: ['investing', 'portfolio', 'options', 'personal finance'],
  }),
  listing({
    id: 'quantum-business',
    title: 'Quantum Business',
    summary: 'Cash flow, forecasting and treasury in one place, with AI that explains what the numbers mean.',
    audience: 'Small businesses.',
    category: 'agents',
    publisher: 'Quantum Ledger',
    capabilities: ['Cash flow', 'Forecasting', 'Treasury', 'Plain explanations of what the numbers mean'],
    inputs: ['Your business financials'],
    outputs: ['Cash flow and forecasts', 'Explanations of the numbers'],
    integrations: [],
    scopes: ['payments'],
    pricing: { model: 'quote', amount: 0 },
    aegis: quantumLedger,
    directory: page('Quantum Ledger', 'products.html', 'in-the-lab'),
    tags: ['cash flow', 'forecasting', 'treasury', 'small business finance'],
  }),
  listing({
    id: 'quantum-alpha',
    title: 'Quantum Alpha',
    summary: 'Algorithmic trading research and execution tools for professional desks.',
    audience: 'Institutions.',
    category: 'automations',
    publisher: 'Quantum Ledger',
    capabilities: ['Algorithmic trading research', 'Execution tools'],
    inputs: ['Trading strategies and market data'],
    outputs: ['Research results', 'Executions'],
    integrations: [],
    scopes: ['payments'],
    pricing: { model: 'quote', amount: 0 },
    aegis: quantumLedger,
    directory: page('Quantum Ledger', 'products.html', 'in-the-lab'),
    tags: ['algorithmic trading', 'institutional', 'execution', 'research'],
  }),

  // ─── Juris Guard ───────────────────────────────────────────────────────────
  listing({
    id: 'regpulse',
    title: 'RegPulse',
    summary: 'A live feed of AI-related regulation across the jurisdictions you choose, with plain-language summaries and alerts routed to the person responsible.',
    audience: 'Legal and compliance teams keeping up with AI rules.',
    category: 'automations',
    publisher: 'Juris Guard',
    capabilities: [
      'Live feed of AI-related regulation in the jurisdictions you choose',
      'Plain-language summary of each change and who it affects',
      'Alerts routed to the person responsible for that area',
      'Every summary links to the source text',
    ],
    inputs: ['The jurisdictions you choose', 'Who is responsible for each area'],
    outputs: ['Regulation change summaries', 'Routed alerts'],
    integrations: [],
    scopes: ['public-web'],
    pricing: { model: 'quote', amount: 0 },
    aegis: jurisGuard,
    directory: page('Juris Guard', 'platform.html', 'in-the-lab'),
    tags: ['regulation', 'monitoring', 'compliance', 'ai rules'],
  }),
  listing({
    id: 'jurisiq',
    title: 'JurisIQ',
    summary: 'Audit trails and bias reporting for the AI models and tools your company uses, mapped to the EU AI Act risk categories.',
    audience: 'Legal and compliance teams keeping up with AI rules.',
    category: 'automations',
    publisher: 'Juris Guard',
    capabilities: [
      'Audit trails for the AI models and tools your company uses',
      'Bias reporting your compliance team can act on',
      'Mapping of your AI systems to EU AI Act risk categories',
    ],
    inputs: ['The AI models and tools your company uses'],
    outputs: ['Audit trails', 'Bias reports', 'EU AI Act risk mapping'],
    integrations: [],
    scopes: [],
    pricing: { model: 'quote', amount: 0 },
    aegis: jurisGuard,
    directory: page('Juris Guard', 'platform.html', 'in-the-lab'),
    tags: ['ai governance', 'audit trail', 'bias', 'eu ai act'],
  }),
  listing({
    id: 'contractforge',
    title: 'ContractForge',
    summary: 'Clause-level risk scoring on incoming contracts, with suggested redlines and the reason for each.',
    audience: 'Legal and compliance teams keeping up with AI rules.',
    category: 'agents',
    publisher: 'Juris Guard',
    capabilities: ['Clause-level risk scoring on incoming contracts', 'Suggested redlines, with the reason for each'],
    inputs: ['Incoming contracts'],
    outputs: ['Clause risk scores', 'Suggested redlines with reasons'],
    integrations: ['DocuSign', 'Salesforce', 'HubSpot'],
    scopes: ['files', 'crm'],
    pricing: { model: 'quote', amount: 0 },
    aegis: jurisGuard,
    directory: page('Juris Guard', 'platform.html', 'in-the-lab'),
    tags: ['contracts', 'contract review', 'redlines', 'legal'],
  }),
  listing({
    id: 'sentinel-shield',
    title: 'Sentinel Shield',
    summary: 'Compliance status across the company in one report, with board-ready summaries on a schedule you set.',
    audience: 'Enterprise legal and compliance teams.',
    category: 'workflows',
    publisher: 'Juris Guard',
    capabilities: ['Company-wide compliance status in one report', 'Board-ready summaries on a schedule you set'],
    inputs: ['Compliance status across the company', 'Your reporting schedule'],
    outputs: ['Compliance report', 'Scheduled board summaries'],
    integrations: [],
    scopes: [],
    pricing: { model: 'quote', amount: 0 },
    aegis: jurisGuard,
    directory: page('Juris Guard', 'platform.html', 'in-the-lab'),
    tags: ['compliance', 'board reporting', 'enterprise'],
  }),

  // ─── Signal Velocity ───────────────────────────────────────────────────────
  listing({
    id: 'adforge',
    title: 'AdForge',
    summary: 'AI-built ad creative and media buying, with human review before launch.',
    audience: 'Businesses turning ad spend and traffic into customers.',
    category: 'agents',
    publisher: 'Signal Velocity',
    capabilities: ['AI-built ad creative', 'Media buying', 'Human review before launch'],
    inputs: ['Your offer and audience', 'Ad budget'],
    outputs: ['Ad creative', 'Media buys, after human review'],
    integrations: [],
    scopes: ['payments'],
    pricing: { model: 'quote', amount: 0 },
    // services.html: "with human review before launch"; index.html: ad work is
    // "reviewed by a person before anything goes live".
    aegis: {
      refusals: ['Does not launch ad creative or media buys before a person reviews them'],
      escalations: ['Every ad and media buy goes to a person for review before it goes live'],
      auditLog: false,
      humanInLoop: true,
      inspectable: false,
    },
    directory: page('Signal Velocity', 'services.html', 'in-the-lab'),
    tags: ['ads', 'ad creative', 'media buying', 'paid media'],
  }),
  listing({
    id: 'signalboard',
    title: 'SignalBoard',
    summary: 'Multi-touch attribution across your ad channels.',
    audience: 'Businesses turning ad spend and traffic into customers.',
    category: 'automations',
    publisher: 'Signal Velocity',
    capabilities: ['Multi-touch attribution across ad channels'],
    inputs: ['Your ad channel data'],
    outputs: ['Attribution by channel'],
    integrations: [],
    scopes: [],
    pricing: { model: 'quote', amount: 0 },
    aegis: null,
    directory: page('Signal Velocity', 'services.html', 'in-the-lab'),
    tags: ['attribution', 'analytics', 'paid media'],
  }),
  listing({
    id: 'pulsefeed',
    title: 'PulseFeed',
    summary: 'Revenue signals as they happen instead of at the end of the month.',
    audience: 'Businesses turning ad spend and traffic into customers.',
    category: 'automations',
    publisher: 'Signal Velocity',
    capabilities: ['Revenue signals as they happen'],
    inputs: ['Your revenue data'],
    outputs: ['A live feed of revenue signals'],
    integrations: [],
    scopes: [],
    pricing: { model: 'quote', amount: 0 },
    aegis: null,
    directory: page('Signal Velocity', 'services.html', 'in-the-lab'),
    tags: ['revenue', 'signals', 'reporting'],
  }),
];
