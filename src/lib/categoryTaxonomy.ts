export type CategoryTaxonomyNode = {
  name: string;
  slug: string;
  children: Array<{ name: string; slug: string }>;
};

export const CATEGORY_TAXONOMY: CategoryTaxonomyNode[] = [
  {
    name: 'Fashion & Apparel',
    slug: 'fashion-apparel',
    children: [
      { name: 'Men', slug: 'fashion-men' },
      { name: 'Shirts T-Shirts Pants Jeans', slug: 'mens-shirts-tshirts-pants-jeans' },
      { name: 'Ethnic Wear Panjabi Kurta', slug: 'mens-ethnic-wear-panjabi-kurta' },
      { name: 'Women', slug: 'fashion-women' },
      { name: 'Dresses Saree Salwar Kameez', slug: 'womens-dresses-saree-salwar-kameez' },
      { name: 'Hijab Abaya', slug: 'hijab-abaya' },
      { name: 'Kids & Baby Clothing', slug: 'kids-baby-clothing' },
      { name: 'Footwear Men Women Kids', slug: 'footwear-men-women-kids' },
      { name: 'Bags & Accessories', slug: 'bags-accessories' },
      { name: 'Jewelry & Watches', slug: 'jewelry-watches' },
    ],
  },
  {
    name: 'Electronics & Gadgets',
    slug: 'electronics-gadgets',
    children: [
      { name: 'Mobile Phones', slug: 'mobile-phones' },
      { name: 'Laptops & Computers', slug: 'laptops-computers' },
      { name: 'Tablets', slug: 'tablets' },
      { name: 'Accessories Chargers Earphones', slug: 'electronics-accessories-chargers-earphones' },
      { name: 'Cameras & Photography', slug: 'cameras-photography' },
      { name: 'Smart Devices Smartwatch IoT', slug: 'smart-devices-smartwatch-iot' },
      { name: 'Gaming Console Accessories', slug: 'gaming-console-accessories' },
    ],
  },
  {
    name: 'Home Furniture & Living',
    slug: 'home-furniture-living',
    children: [
      { name: 'Furniture Sofa Bed Table', slug: 'furniture-sofa-bed-table' },
      { name: 'Home Decor Lighting Wall Art', slug: 'home-decor-lighting-wall-art' },
      { name: 'Kitchen & Dining', slug: 'kitchen-dining' },
      { name: 'Home Appliances Fridge AC Fan', slug: 'home-appliances-fridge-ac-fan' },
      { name: 'Storage & Organization', slug: 'storage-organization' },
    ],
  },
  {
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    children: [
      { name: 'Skincare', slug: 'beauty-skincare' },
      { name: 'Haircare', slug: 'beauty-haircare' },
      { name: 'Makeup', slug: 'beauty-makeup' },
      { name: 'Fragrances', slug: 'beauty-fragrances' },
      { name: 'Grooming Men Women', slug: 'grooming-men-women' },
    ],
  },
  {
    name: 'Food Grocery & Beverages',
    slug: 'food-grocery-beverages',
    children: [
      { name: 'Fresh Food Fruits Vegetables', slug: 'fresh-food-fruits-vegetables' },
      { name: 'Packaged Food', slug: 'packaged-food' },
      { name: 'Snacks & Sweets', slug: 'snacks-sweets' },
      { name: 'Beverages Tea Coffee Juice', slug: 'beverages-tea-coffee-juice' },
      { name: 'Organic & Health Food', slug: 'organic-health-food' },
    ],
  },
  {
    name: 'Health & Wellness',
    slug: 'health-wellness',
    children: [
      { name: 'Medicines OTC', slug: 'medicines-otc' },
      { name: 'Supplements & Vitamins', slug: 'supplements-vitamins' },
      { name: 'Medical Devices', slug: 'medical-devices' },
      { name: 'Fitness Nutrition', slug: 'fitness-nutrition' },
      { name: 'Personal Hygiene', slug: 'personal-hygiene' },
    ],
  },
  {
    name: 'Sports & Outdoor',
    slug: 'sports-outdoor',
    children: [
      { name: 'Fitness Equipment', slug: 'sports-fitness-equipment' },
      { name: 'Outdoor Gear', slug: 'outdoor-gear' },
      { name: 'Cycling', slug: 'cycling' },
      { name: 'Team Sports', slug: 'team-sports' },
      { name: 'Camping & Hiking', slug: 'camping-hiking' },
    ],
  },
  {
    name: 'Toys Kids & Baby',
    slug: 'toys-kids-baby',
    children: [
      { name: 'Toys & Games', slug: 'toys-games' },
      { name: 'Baby Care Diapers Feeding', slug: 'baby-care-diapers-feeding' },
      { name: 'School Supplies', slug: 'kids-school-supplies' },
      { name: 'Kids Furniture', slug: 'kids-furniture' },
    ],
  },
  {
    name: 'Automotive & Tools',
    slug: 'automotive-tools',
    children: [
      { name: 'Car Accessories', slug: 'car-accessories' },
      { name: 'Motorbike Accessories', slug: 'motorbike-accessories' },
      { name: 'Tools & Equipment', slug: 'automotive-tools-equipment' },
      { name: 'Spare Parts', slug: 'spare-parts' },
    ],
  },
  {
    name: 'Pet Supplies',
    slug: 'pet-supplies',
    children: [
      { name: 'Pet Food', slug: 'pet-food' },
      { name: 'Pet Toys', slug: 'pet-toys' },
      { name: 'Pet Grooming', slug: 'pet-grooming' },
      { name: 'Pet Accessories', slug: 'pet-accessories' },
    ],
  },
  {
    name: 'Books Media & Education',
    slug: 'books-media-education',
    children: [
      { name: 'Books Academic Story Islamic', slug: 'books-academic-story-islamic' },
      { name: 'E-books', slug: 'ebooks' },
      { name: 'Stationery', slug: 'stationery' },
      { name: 'Educational Materials', slug: 'educational-materials' },
    ],
  },
  {
    name: 'Tools Hardware & Industrial',
    slug: 'tools-hardware-industrial',
    children: [
      { name: 'Power Tools', slug: 'power-tools' },
      { name: 'Hand Tools', slug: 'hand-tools' },
      { name: 'Construction Materials', slug: 'construction-materials' },
      { name: 'Safety Equipment', slug: 'safety-equipment' },
    ],
  },
  {
    name: 'Office Business & Stationery',
    slug: 'office-business-stationery',
    children: [
      { name: 'Office Supplies', slug: 'office-supplies' },
      { name: 'Printers & Accessories', slug: 'printers-accessories' },
      { name: 'Packaging Materials', slug: 'packaging-materials' },
      { name: 'Business Equipment', slug: 'business-equipment' },
    ],
  },
  {
    name: 'Travel Luggage & Lifestyle',
    slug: 'travel-luggage-lifestyle',
    children: [
      { name: 'Bags & Luggage', slug: 'travel-bags-luggage' },
      { name: 'Travel Accessories', slug: 'travel-accessories' },
      { name: 'Lifestyle Products', slug: 'lifestyle-products' },
    ],
  },
  {
    name: 'Digital Products & Services',
    slug: 'digital-products-services',
    children: [
      { name: 'Software', slug: 'software' },
      { name: 'Online Courses', slug: 'online-courses' },
      { name: 'Subscriptions', slug: 'subscriptions' },
      { name: 'Digital Downloads', slug: 'digital-downloads' },
    ],
  },
];

export const CATEGORY_TAXONOMY_SLUG_SET = new Set(
  CATEGORY_TAXONOMY.flatMap((parent) => [
    parent.slug,
    ...parent.children.map((child) => child.slug),
  ]),
);
