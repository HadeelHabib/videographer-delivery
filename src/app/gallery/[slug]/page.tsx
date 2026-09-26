import { PublicGallery } from "./PublicGallery";

export default async function PublicGalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicGallery slug={slug} />;
}
