import { Service } from '../types.js';

export const services: Service[] = [
  // --- Category: Social Media & Video (social) ---
  {
    id: 'insta-post',
    name: 'Instagram Post Design',
    category: 'social',
    mrp: 186,
    launchPrice: 149,
    description: 'Highly engaging, custom-themed static posts designed to boost your brand presence.',
    iconName: 'Instagram',
    unit: 'post',
    imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'carousel-5',
    name: 'Carousel (5 Slides)',
    category: 'social',
    mrp: 311,
    launchPrice: 249,
    description: 'Stunning 5-slide continuous carousels for storytelling and higher audience retention.',
    iconName: 'Layers',
    unit: 'carousel',
    imageUrl: 'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'insta-story',
    name: 'Instagram Story Design',
    category: 'social',
    mrp: 186,
    launchPrice: 149,
    description: 'Creative and interactive story designs to keep your active followers engaged.',
    iconName: 'Sparkles',
    unit: 'story',
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'reel-basic',
    name: 'Reel Editing (Basic)',
    category: 'social',
    mrp: 499,
    launchPrice: 399,
    description: 'Clean transitions, basic color grading, text overlays, and trending audio alignment.',
    iconName: 'Video',
    unit: 'reel',
    imageUrl: 'https://images.unsplash.com/photo-1622737133809-d95047b9e673?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'reel-premium',
    name: 'Reel Editing (Premium)',
    category: 'social',
    mrp: 874,
    launchPrice: 699,
    description: 'Advanced dynamic editing, engaging captions, sound design, special effects, and viral hooks.',
    iconName: 'Film',
    unit: 'reel',
    imageUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'yt-thumbnail',
    name: 'YouTube Thumbnail',
    category: 'social',
    mrp: 249,
    launchPrice: 199,
    description: 'High-CTR, thumb-stopping thumbnails designed to get maximum clicks on your videos.',
    iconName: 'Image',
    unit: 'thumbnail',
    imageUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'yt-banner',
    name: 'YouTube Banner',
    category: 'social',
    mrp: 624,
    launchPrice: 199,
    description: 'Professional channel art optimized for desktop, mobile, and TV screen viewing.',
    iconName: 'Tv',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'content-writing',
    name: 'Content Writing',
    category: 'social',
    mrp: 499,
    launchPrice: 399,
    description: 'High-quality, SEO-friendly articles, blogs, or scripts written by marketing experts.',
    iconName: 'FileText',
    unit: 'article',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'smm-18',
    name: 'Social Media Management (12 Posts + 6 Reels)',
    category: 'social',
    mrp: 3499,
    launchPrice: 2799,
    description: 'Includes graphic designs, professional video editing, caption writing, and hashtag research.',
    iconName: 'Briefcase',
    unit: 'month',
    imageUrl: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'smm-34',
    name: 'Social Media Management (22 Posts + 12 Reels)',
    category: 'social',
    mrp: 6249,
    launchPrice: 4999,
    description: 'Complete monthly package for high-volume content, active audience engagement, and strategy setup.',
    iconName: 'TrendingUp',
    unit: 'month',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'smm-custom',
    name: 'Social Media Management (Custom Plan)',
    category: 'social',
    mrp: 18749,
    launchPrice: 14999,
    description: 'Tailored enterprise level strategy, heavy volume video shoots/editing, dedicated account manager.',
    iconName: 'Award',
    badge: 'NEW',
    unit: 'month',
    imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80'
  },

  // --- Category: Design & Branding (branding) ---
  {
    id: 'logo-design',
    name: 'Logo Design (Logo + Colors + Fonts)',
    category: 'branding',
    mrp: 1249,
    launchPrice: 999,
    description: 'Professional vector logo design with a defined primary brand color palette and typography rules.',
    iconName: 'Feather',
    imageUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'brand-kit',
    name: 'Brand Kit (Logo + Colors + Fonts)',
    category: 'branding',
    mrp: 1249,
    launchPrice: 999,
    description: 'Comprehensive brand identity kit containing social media templates, icons, and logo guidelines.',
    iconName: 'Compass',
    imageUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'poster-banner',
    name: 'Poster / Flyer / Banner',
    category: 'branding',
    mrp: 424,
    launchPrice: 339,
    description: 'Attention-grabbing commercial posters, event flyers, or digital promotion banners.',
    iconName: 'MonitorDot',
    imageUrl: 'https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'business-card',
    name: 'Business Card Design',
    category: 'branding',
    mrp: 224,
    launchPrice: 179,
    description: 'Elegant, modern double-sided business card designs ready for premium quality print.',
    iconName: 'Contact',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'brochure-design',
    name: 'Brochure Design',
    category: 'branding',
    mrp: 624,
    launchPrice: 499,
    description: 'Creative bi-fold or tri-fold brochure designs outlining your company profile, products, and services.',
    iconName: 'BookOpen',
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80'
  },

  // --- Category: Web Development & SEO (web) ---
  {
    id: 'landing-page',
    name: 'Landing Page',
    category: 'web',
    mrp: 2499,
    launchPrice: 1999,
    description: 'High-converting single-page landing page designed with clear CTAs to capture customer leads.',
    iconName: 'FileCode',
    imageUrl: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'business-website',
    name: 'Basic Business Website',
    category: 'web',
    mrp: 6249,
    launchPrice: 4999,
    description: 'Beautiful 5-page responsive business website showcasing your services, portfolio, and contact details.',
    iconName: 'Globe',
    imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'ecommerce-website',
    name: 'E-commerce Website',
    category: 'web',
    mrp: 12499,
    launchPrice: 9999,
    description: 'Fully functional online store complete with dynamic cart, secure payments, and inventory manager.',
    iconName: 'ShoppingCart',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'basic-seo',
    name: 'Basic SEO',
    category: 'web',
    mrp: 3749,
    launchPrice: 2999,
    description: 'On-page SEO setup, speed optimization, and directory link submission to secure search rankings.',
    iconName: 'Search',
    unit: 'month',
    imageUrl: 'https://images.unsplash.com/photo-1571721795195-a2ca2d33e402?auto=format&fit=crop&w=600&q=80'
  },

  // --- Category: Ads & Lead Generation (marketing) ---
  {
    id: 'gbp-setup',
    name: 'Google Business Profile Setup',
    category: 'marketing',
    mrp: 749,
    launchPrice: 599,
    description: 'Complete listing creation, geo-location pinning, keyword optimization, and verification support.',
    iconName: 'MapPin',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'meta-ads',
    name: 'Meta Ads Setup',
    category: 'marketing',
    mrp: 1499,
    launchPrice: 1199,
    description: 'Targeted Facebook & Instagram lead/sales generation campaigns setup (Ad budget extra).',
    iconName: 'Megaphone',
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'google-ads',
    name: 'Google Ads Setup',
    category: 'marketing',
    mrp: 1624,
    launchPrice: 1299,
    description: 'Google Search & Display ads setup targeting buyer intent keywords for maximum ROI (Ad budget extra).',
    iconName: 'MousePointerClick',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'email-marketing',
    name: 'Email Marketing Setup',
    category: 'marketing',
    mrp: 1874,
    launchPrice: 1499,
    description: 'Newsletter automation setup, responsive email templates, list segmentation, and blast scheduling.',
    iconName: 'Mail',
    imageUrl: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'whatsapp-marketing',
    name: 'WhatsApp Marketing Setup',
    category: 'marketing',
    mrp: 1874,
    launchPrice: 1499,
    description: 'Broadcast list managers, automated chatbot responses, and promotional campaign templates setup.',
    iconName: 'MessageSquare',
    imageUrl: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=600&q=80'
  }
];
