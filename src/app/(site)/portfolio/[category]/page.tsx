import { CategoryPage } from "./CategoryPage";

export default async function PortfolioCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  return <CategoryPage category={category} />;
}
