import { ProductsPageView } from '../ProductsPageView';

interface CategoryProductsPageProps {
  params: {
    categorySlug: string;
  };
}

export default function CategoryProductsPage({ params }: CategoryProductsPageProps) {
  return <ProductsPageView initialCategorySlug={params.categorySlug} />;
}
