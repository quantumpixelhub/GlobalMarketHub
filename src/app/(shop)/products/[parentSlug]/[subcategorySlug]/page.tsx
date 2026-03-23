import { ProductsPageView } from '../../ProductsPageView';

interface SubcategoryProductsPageProps {
  params: {
    parentSlug: string;
    subcategorySlug: string;
  };
}

export default function SubcategoryProductsPage({ params }: SubcategoryProductsPageProps) {
  return <ProductsPageView initialCategorySlug={params.subcategorySlug} />;
}
