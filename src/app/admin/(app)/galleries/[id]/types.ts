import type { GalleryCommentData } from "@/components/GalleryCommentThread";

export type Rendition = {
  id: number;
  quality: string;
  storageKey: string;
  status: string;
  fileSizeBytes: string | null;
};

export type Media = {
  id: number;
  type: "video" | "photo";
  originalFilename: string | null;
  status: string;
  fileSizeBytes: string | null;
  width: number | null;
  height: number | null;
  renditions: Rendition[];
};

export type GalleryDetailData = {
  id: number;
  clientName: string;
  slug: string;
  status: string;
  visibility: string;
  category: string | null;
  brandLogoUrl: string | null;
  brandColor: string | null;
  expiryDate: string | null;
  allowPublicDownload: boolean;
  deliveredAt: string | null;
  archivedAt: string | null;
  media: Media[];
  accessLogs: { id: number; action: string; ipAddress: string | null; accessedAt: string }[];
  galleryComments: GalleryCommentData[];
};
