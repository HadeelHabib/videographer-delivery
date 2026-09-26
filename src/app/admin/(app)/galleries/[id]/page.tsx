import { GalleryDetail } from "./GalleryDetail";

export default async function GalleryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GalleryDetail galleryId={Number(id)} />;
}
