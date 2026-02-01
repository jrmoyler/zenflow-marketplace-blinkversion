import { Product, ProductCategory, ComplexityLevel, CategoryRail } from '../types/marketplace';

const titles = {
  agents: [
    'AI Customer Service Agent',
    'Sales Assistant Pro',
    'Email Responder AI',
    'Marketing Copy Generator',
    'Data Analysis Agent',
    'Chatbot Builder',
    'Lead Qualifier AI',
    'Social Media Manager',
    'Content Creation Bot',
    'Research Assistant',
    'Booking Agent',
    'Support Ticket Resolver',
    'Compliance Checker',
    'Invoice Processing AI',
    'Document Summarizer'
  ],
  workflows: [
    'Lead Generation Workflow',
    'Customer Onboarding Flow',
    'Order Processing Automation',
    'Data Sync Workflow',
    'Email Campaign Sequence',
    'Report Generation Flow',
    'Backup Automation',
    'Task Approval Process',
    'Invoice Validation Workflow',
    'Content Publishing Pipeline',
    'Customer Feedback Loop',
    'Inventory Management Flow',
    'Payment Processing Automation',
    'HR Onboarding Workflow',
    'Project Handoff Process'
  ],
  automations: [
    'Auto Email Responder',
    'Social Media Scheduler',
    'Data Backup Automation',
    'File Sync Tool',
    'Invoice Generator',
    'Report Scheduler',
    'Notification Bot',
    'Task Creator',
    'Calendar Integration',
    'CRM Data Sync',
    'Automated Testing Suite',
    'Deployment Pipeline',
    'Log Rotation Automation',
    'Security Scanner',
    'API Rate Limit Monitor'
  ],
  bots: [
    'Discord Community Bot',
    'Slack Notification Bot',
    'Telegram Trading Bot',
    'WhatsApp Business Bot',
    'Twitter Auto-Poster',
    'Reddit Engagement Bot',
    'Instagram DM Responder',
    'Customer Support Bot',
    'Survey Bot',
    'Lead Collection Bot',
    'Appointment Booking Bot',
    'Feedback Collection Bot',
    'Event Coordination Bot',
    'Newsletter Subscription Bot',
    'Product Inquiry Bot'
  ]
};

const descriptions = [
  'Automate your workflow with this powerful solution that integrates seamlessly with your existing tools.',
  'Boost productivity by 300% with AI-powered automation handles repetitive tasks effortlessly.',
  'Streamline your business processes with intelligent automation reduces manual work significantly.',
  'Transform your operations with this cutting-edge solution designed for modern businesses.',
  'Save hours every week with smart automation that learns and adapts to your needs.',
  'Eliminate manual errors and increase efficiency with our robust automation platform.',
  'Scale your business faster with AI-driven workflows that handle complex operations.',
  'Experience the future of automation with our next-generation solution built for speed.',
  'Optimize your resources and reduce costs with intelligent process automation.',
  'Stay ahead of the competition with AI-powered tools that deliver results.',
  'Supercharge your team with automation that handles the mundane so you can focus on strategy.',
  'Deploy in minutes and see results instantly with our pre-configured workflows.',
  'Built for scale, reliability, and performance - ready for enterprise deployment.',
  'Customizable and flexible solution that adapts to your unique business requirements.',
  'Industry-leading automation trusted by thousands of businesses worldwide.'
];

const complexities: ComplexityLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const tagsMap = {
  agents: ['AI', 'Chatbot', 'NLP', 'Customer Service', 'Automation', 'Support', 'Sales', 'Marketing'],
  workflows: ['Automation', 'Integration', 'Business Logic', 'API', 'Data', 'Process', 'Pipeline', 'Efficiency'],
  automations: ['Script', 'Scheduling', 'Tasks', 'Backend', 'Integration', 'Monitoring', 'Alerts', 'Productivity'],
  bots: ['Chat', 'Social', 'Messaging', 'Community', 'Engagement', 'Support', 'Marketing', 'Automation']
};

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateImageUrl(category: ProductCategory, index: number): string {
  const colors = ['indigo', 'emerald', 'purple', 'cyan', 'blue', 'rose'];
  const color = colors[index % colors.length];
  return `https://via.placeholder.com/400x300/6366f1/ffffff?text=${category}-${index}`;
}

function generateProduct(
  id: string,
  category: ProductCategory,
  index: number
): Product {
  const complexity = getRandomElement(complexities);
  const price = category === 'agents' ? 49 + Math.random() * 450 : 
                category === 'workflows' ? 29 + Math.random() * 200 :
                category === 'automations' ? 19 + Math.random() * 150 : 39 + Math.random() * 300;
  
  return {
    id,
    title: `${getRandomElement(titles[category])} ${index + 1}`,
    description: getRandomElement(descriptions),
    category,
    price: Math.round(price),
    rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
    complexity,
    tags: getRandomElements(tagsMap[category], 4),
    imageUrl: generateImageUrl(category, index),
    featured: Math.random() > 0.85,
    sales: Math.floor(Math.random() * 5000)
  };
}

function generateCategoryItems(category: ProductCategory, count: number): Product[] {
  const products: Product[] = [];
  for (let i = 0; i < count; i++) {
    products.push(generateProduct(`${category}-${i}`, category, i));
  }
  return products;
}

export function generateMockData(): Record<ProductCategory, Product[]> {
  return {
    agents: generateCategoryItems('agents', 250),
    workflows: generateCategoryItems('workflows', 250),
    automations: generateCategoryItems('automations', 250),
    bots: generateCategoryItems('bots', 250)
  };
}

export function getCategoryRails(data: Record<ProductCategory, Product[]>): CategoryRail[] {
  const allProducts = [
    ...data.agents,
    ...data.workflows,
    ...data.automations,
    ...data.bots
  ];

  return [
    {
      title: 'Trending Now',
      items: allProducts.filter(p => p.sales && p.sales > 3000).slice(0, 12)
    },
    {
      title: 'Featured AI Agents',
      items: data.agents.filter(p => p.featured).slice(0, 12)
    },
    {
      title: 'Top Rated Workflows',
      items: data.workflows.filter(p => p.rating >= 4.5).slice(0, 12)
    },
    {
      title: 'Popular Automations',
      items: data.automations.filter(p => p.sales && p.sales > 2000).slice(0, 12)
    },
    {
      title: 'New Releases',
      items: allProducts.filter(p => p.sales && p.sales < 500).slice(0, 12)
    },
    {
      title: 'Bestselling Bots',
      items: data.bots.filter(p => p.sales && p.sales > 4000).slice(0, 12)
    }
  ];
}