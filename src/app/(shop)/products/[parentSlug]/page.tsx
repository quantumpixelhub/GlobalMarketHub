import { ProductsPageView } from '../ProductsPageView';

interface CategoryProductsPageProps {
  params: {
    parentSlug: string;
  };
}

export default function CategoryProductsPage({ params }: CategoryProductsPageProps) {
  return <ProductsPageView initialCategorySlug={params.parentSlug} />;
}
