import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  {
    name: 'Fresh Fruits',
    slug: 'fresh-fruits',
    description: 'Farm-fresh organic fruits and seasonal picks',
    image: '/category/fresh_fruits.jpg',
    bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  },
  {
    name: 'Fresh Vegetables',
    slug: 'vegetables',
    description: 'Crisp, nutritious vegetables straight from organic farms',
    image: '/category/fresh_fruits.jpg',
    bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  },
  {
    name: 'Fast Food',
    slug: 'fast-food',
    description: 'Burgers, pizzas, tacos, and quick bites',
    image: '/category/fast_food.jpg',
    bgColor: 'bg-amber-50 text-amber-800 border-amber-100',
  },
  {
    name: 'Gadgets & Tech',
    slug: 'gadgets',
    description: 'Smartphones, accessories, and modern electronics',
    image: '/category/gadgets_tech.jpg',
    bgColor: 'bg-indigo-50 text-indigo-800 border-indigo-100',
  },
  {
    name: 'Clothing & Apparel',
    slug: 'clothing',
    description: "Men's, women's, and kids' trendy everyday fashion",
    image: '/category/clothing_apparel.jpg',
    bgColor: 'bg-violet-50 text-violet-800 border-violet-100',
  },
  {
    name: 'Beauty & Personal Care',
    slug: 'beauty-care',
    description: 'Skincare, cosmetics, and self-care essentials',
    image: '/category/beauty_personal_care.jpg',
    bgColor: 'bg-rose-50 text-rose-800 border-rose-100',
  },
  {
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Home decor, kitchenware, and furniture pieces',
    image: '/category/home-living.avif',
    bgColor: 'bg-teal-50 text-teal-800 border-teal-100',
  },
  {
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    description: 'Workout gear, equipment, and sportswear',
    image: '/category/sports_fitness.jpg',
    bgColor: 'bg-sky-50 text-sky-800 border-sky-100',
  },
  {
    name: 'Books & Stationery',
    slug: 'books-stationery',
    description: 'Best-selling novels, journals, and office supplies',
    image: '/category/books_stationery.jpg',
    bgColor: 'bg-amber-100/60 text-amber-900 border-amber-200',
  },
];

const coupons = [
  {
    code: 'FRESH2026',
    discountPercentage: 15,
    minSpend: 20,
    description: '15% OFF on all fresh organic produce orders over $20',
  },
  {
    code: 'VEGIST10',
    discountPercentage: 10,
    minSpend: 0,
    description: '10% OFF welcome coupon for new shoppers',
  },
  {
    code: 'ORGANIC20',
    discountPercentage: 20,
    minSpend: 50,
    description: '20% OFF mega savings on orders over $50',
  },
];

const sampleProducts = [
  {
    name: 'Fresh Red Organic Tomatoes',
    slug: 'fresh-red-organic-tomatoes',
    price: 3.50,
    originalPrice: 4.80,
    discount: 27,
    images: [
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?q=80&w=1170&auto=format&fit=crop&q=80',
    ],
    categorySlug: 'vegetables',
    rating: 4.9,
    reviewsCount: 38,
    stock: 85,
    sold: 142,
    unit: '500g',
    description: 'Hand-picked farm fresh organic red tomatoes, rich in lycopene and vitamin C.',
    shortDescription: 'Plump, juicy organic tomatoes directly harvested from local farms.',
    isTrending: true,
    isFeatured: true,
    badge: 'Bestseller',
  },
  {
    name: 'Organic Crisp Fuji Apples',
    slug: 'organic-crisp-fuji-apples',
    price: 4.20,
    originalPrice: 5.50,
    discount: 23,
    images: [
      'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&auto=format&fit=crop&q=80',
    ],
    categorySlug: 'fresh-fruits',
    rating: 4.8,
    reviewsCount: 52,
    stock: 60,
    sold: 110,
    unit: '1 kg',
    description: 'Sweet and crunchy organic Fuji apples packed with dietary fiber and antioxidants.',
    shortDescription: 'Sweet, crisp and pesticide-free fresh orchard apples.',
    isTrending: true,
    isFeatured: true,
    badge: 'Trending',
  },
  {
    name: 'Fresh Green Broccoli Crowns',
    slug: 'fresh-green-broccoli-crowns',
    price: 2.80,
    originalPrice: 3.50,
    discount: 20,
    images: [
      'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&auto=format&fit=crop&q=80',
    ],
    categorySlug: 'vegetables',
    rating: 4.7,
    reviewsCount: 29,
    stock: 45,
    sold: 78,
    unit: 'Each',
    description: 'Tender florets with thick stalks, rich in Vitamin C, K and essential dietary fiber.',
    shortDescription: 'Nutrient-rich, vibrant broccoli heads harvested daily.',
    isTrending: false,
    isFeatured: true,
    badge: 'Popular',
  },
  {
    name: 'Tropical Organic Cavendish Bananas',
    slug: 'tropical-organic-cavendish-bananas',
    price: 1.99,
    originalPrice: 2.50,
    discount: 20,
    images: [
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
    ],
    categorySlug: 'fresh-fruits',
    rating: 4.9,
    reviewsCount: 64,
    stock: 120,
    sold: 215,
    unit: '1 bunch (approx 1kg)',
    description: 'Naturally ripened, sweet and creamy Cavendish bananas packed with potassium.',
    shortDescription: 'Naturally sweet bananas, perfect energy snack for anytime.',
    isTrending: true,
    isFeatured: true,
    badge: 'Hot Deal',
  },
  {
    name: 'Wireless Noise Canceling Headphones',
    slug: 'wireless-noise-canceling-headphones',
    price: 89.99,
    originalPrice: 129.99,
    discount: 30,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    ],
    categorySlug: 'gadgets',
    rating: 4.9,
    reviewsCount: 88,
    stock: 30,
    sold: 95,
    unit: '1 unit',
    description: 'High fidelity audio with 35 hours of active battery life and deep bass.',
    shortDescription: 'Immersive sound with active ambient noise cancellation.',
    isTrending: true,
    isFeatured: true,
    badge: 'Bestseller',
  },
  {
    name: 'Casual Minimalist Cotton Hoodie',
    slug: 'casual-minimalist-cotton-hoodie',
    price: 34.50,
    originalPrice: 45.00,
    discount: 23,
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
    ],
    categorySlug: 'clothing',
    rating: 4.6,
    reviewsCount: 42,
    stock: 55,
    sold: 63,
    unit: '1 pc',
    description: 'Ultra-soft fleece brushed cotton hoodie with relaxed modern tailoring.',
    shortDescription: '100% combed organic cotton pullover hoodie.',
    isTrending: false,
    isFeatured: true,
    badge: 'Trending',
  },
];

async function main() {
  console.log('🌱 Starting Neon PostgreSQL database seed...');

  // Upsert categories
  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        image: cat.image,
        bgColor: cat.bgColor,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        bgColor: cat.bgColor,
      },
    });
    categoryMap.set(cat.slug, record.id);
  }
  console.log(`✅ Upserted ${categories.length} categories.`);

  // Upsert coupons
  for (const cp of coupons) {
    await prisma.coupon.upsert({
      where: { code: cp.code },
      update: {
        discountPercentage: cp.discountPercentage,
        minSpend: cp.minSpend,
        description: cp.description,
        isActive: true,
      },
      create: {
        code: cp.code,
        discountPercentage: cp.discountPercentage,
        minSpend: cp.minSpend,
        description: cp.description,
        isActive: true,
      },
    });
  }
  console.log(`✅ Upserted ${coupons.length} coupons.`);

  // Upsert products
  for (const prod of sampleProducts) {
    const categoryId = categoryMap.get(prod.categorySlug);
    if (!categoryId) continue;

    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        name: prod.name,
        price: prod.price,
        originalPrice: prod.originalPrice,
        discount: prod.discount,
        images: prod.images,
        categoryId,
        rating: prod.rating,
        reviewsCount: prod.reviewsCount,
        stock: prod.stock,
        sold: prod.sold,
        unit: prod.unit,
        description: prod.description,
        shortDescription: prod.shortDescription,
        isTrending: prod.isTrending,
        isFeatured: prod.isFeatured,
        badge: prod.badge,
      },
      create: {
        name: prod.name,
        slug: prod.slug,
        price: prod.price,
        originalPrice: prod.originalPrice,
        discount: prod.discount,
        images: prod.images,
        categoryId,
        rating: prod.rating,
        reviewsCount: prod.reviewsCount,
        stock: prod.stock,
        sold: prod.sold,
        unit: prod.unit,
        description: prod.description,
        shortDescription: prod.shortDescription,
        isTrending: prod.isTrending,
        isFeatured: prod.isFeatured,
        badge: prod.badge,
      },
    });
  }
  console.log(`✅ Upserted ${sampleProducts.length} products.`);
  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
