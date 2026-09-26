import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";
import { mediaStorageKey, uploadObjectFromFile } from "../src/lib/r2";
import { generateUniqueSlug } from "../src/lib/slug";

// Populates the dashboard with realistic demo data: a spread of galleries
// across every category/status/visibility combination, real (placeholder)
// media files backing each one, access logs, and testimonials — so the admin
// UI and public site can be reviewed and screenshotted with real-looking
// content instead of a single empty test gallery.

const WORKSPACE_ROOT = path.resolve(__dirname, "../..");
const SAMPLE_PHOTOS = [
  "bloomura-carousel/Slide-1-Hook.png",
  "bloomura-carousel/Slide-2-Mistakes.png",
  "bloomura-carousel/Slide-2-Striker.png",
  "bloomura-carousel/Slide-3-CTA.png",
  "bloomura-carousel/Slide-3-Goalkeeper.png",
  "bloomura-carousel/Slide-4-Coach.png",
  "bloomura-carousel/Slide-5-CTA.png",
  "bloomura-carousel/SEO-Slide-1.png",
  "bloomura-carousel/SEO-Slide-2.png",
  "bloomura-carousel/SEO-Slide-3.png",
  "bloomura-carousel/SEO-Slide-4.png",
  "bloomura-carousel/SEO-Slide-5.png",
].map((p) => path.join(WORKSPACE_ROOT, p));
const SAMPLE_VIDEO = path.join(WORKSPACE_ROOT, "wedding-invitation/public/assets/0907.mov");

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}
function randomIp() {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(
    Math.random() * 255
  )}.${Math.floor(Math.random() * 255)}`;
}

let photoCursor = 0;
function nextPhoto() {
  const p = SAMPLE_PHOTOS[photoCursor % SAMPLE_PHOTOS.length];
  photoCursor += 1;
  return p;
}

async function addPhoto(galleryId: number, createdAt: Date) {
  const source = nextPhoto();
  const stat = fs.statSync(source);
  const media = await prisma.media.create({
    data: {
      galleryId,
      type: "photo",
      originalFilename: path.basename(source),
      fileSizeBytes: BigInt(stat.size),
      status: "ready",
      createdAt,
    },
  });
  const key = mediaStorageKey(galleryId, media.id, "original.png");
  await uploadObjectFromFile(key, source, "image/png");
  await prisma.mediaRendition.create({
    data: { mediaId: media.id, quality: "original", storageKey: key, status: "ready", fileSizeBytes: BigInt(stat.size) },
  });
}

async function addVideo(galleryId: number, createdAt: Date) {
  const stat = fs.statSync(SAMPLE_VIDEO);
  const media = await prisma.media.create({
    data: {
      galleryId,
      type: "video",
      originalFilename: "highlight-film.mov",
      fileSizeBytes: BigInt(stat.size),
      durationSeconds: 3,
      status: "ready",
      createdAt,
    },
  });
  const key = mediaStorageKey(galleryId, media.id, "original.mov");
  await uploadObjectFromFile(key, SAMPLE_VIDEO, "video/quicktime");
  await prisma.mediaRendition.create({
    data: { mediaId: media.id, quality: "original", storageKey: key, status: "ready", fileSizeBytes: BigInt(stat.size) },
  });
}

async function addAccessLogs(galleryId: number, count: number) {
  const actions: ("viewed" | "downloaded")[] = ["viewed", "viewed", "viewed", "downloaded"];
  const data = Array.from({ length: count }).map((_, i) => ({
    galleryId,
    action: actions[Math.floor(Math.random() * actions.length)],
    ipAddress: randomIp(),
    accessedAt: daysAgo(Math.floor(Math.random() * 30) + i),
  }));
  await prisma.accessLog.createMany({ data });
}

type GalleryPlan = {
  clientName: string;
  category: string;
  visibility: "public" | "private";
  status: "draft" | "ready" | "delivered" | "archived";
  password: string;
  createdDaysAgo: number;
  photos: number;
  video?: boolean;
  logs: number;
  allowPublicDownload?: boolean;
  expiresInDays?: number;
};

const PLAN: GalleryPlan[] = [
  {
    clientName: "Sarah & James",
    category: "wedding",
    visibility: "public",
    status: "delivered",
    password: "sarahjames26",
    createdDaysAgo: 52,
    photos: 3,
    video: true,
    logs: 18,
    allowPublicDownload: true,
    expiresInDays: 120,
  },
  {
    clientName: "Amelia & Noah",
    category: "wedding",
    visibility: "public",
    status: "delivered",
    password: "amelianoah26",
    createdDaysAgo: 30,
    photos: 3,
    video: true,
    logs: 11,
    allowPublicDownload: true,
    expiresInDays: 150,
  },
  {
    clientName: "The Chen Family",
    category: "portrait",
    visibility: "public",
    status: "ready",
    password: "chenfamily26",
    createdDaysAgo: 9,
    photos: 2,
    logs: 4,
    allowPublicDownload: true,
  },
  {
    clientName: "Maya R. — Studio Headshots",
    category: "portrait",
    visibility: "private",
    status: "draft",
    password: "mayaheadshots",
    createdDaysAgo: 2,
    photos: 1,
    logs: 0,
  },
  {
    clientName: "Nova Tech — Launch Party",
    category: "event",
    visibility: "public",
    status: "delivered",
    password: "novatech26",
    createdDaysAgo: 21,
    photos: 3,
    logs: 9,
    allowPublicDownload: true,
    expiresInDays: 60,
  },
  {
    clientName: "Horizon Coffee — Brand Film",
    category: "commercial",
    visibility: "public",
    status: "archived",
    password: "horizoncoffee",
    createdDaysAgo: 95,
    photos: 2,
    logs: 6,
    allowPublicDownload: true,
  },
  {
    clientName: "Priya & Dev",
    category: "wedding",
    visibility: "private",
    status: "ready",
    password: "priyadev26",
    createdDaysAgo: 5,
    photos: 2,
    logs: 1,
  },
];

const COMMENTS: {
  category: string;
  visitorName: string;
  body: string;
  status: "approved" | "pending" | "rejected";
  createdDaysAgo: number;
}[] = [
  {
    category: "wedding",
    visitorName: "Sarah & James",
    body: "We've watched our film probably twenty times now. It genuinely feels like reliving the day, not just watching a video of it.",
    status: "approved",
    createdDaysAgo: 40,
  },
  {
    category: "wedding",
    visitorName: "Amelia & Noah",
    body: "So glad we went with a videographer who actually blended into the background. Zero awkward posed moments, all real.",
    status: "approved",
    createdDaysAgo: 18,
  },
  {
    category: "portrait",
    visitorName: "Linda Chen",
    body: "Our kids do NOT sit still for photos. Somehow every single shot came back looking natural. Still not sure how.",
    status: "approved",
    createdDaysAgo: 6,
  },
  {
    category: "event",
    visitorName: "Marcus @ Nova Tech",
    body: "Turnaround was fast enough that we had a highlight reel ready for our follow-up investor email the next morning.",
    status: "approved",
    createdDaysAgo: 15,
  },
  {
    category: "commercial",
    visitorName: "Horizon Coffee Team",
    body: "The brand film captured exactly the tone we were going for — warm, unpolished in the right way.",
    status: "approved",
    createdDaysAgo: 60,
  },
  {
    category: "wedding",
    visitorName: "Jordan P.",
    body: "Loved working together, would recommend to anyone getting married next year.",
    status: "pending",
    createdDaysAgo: 1,
  },
  {
    category: "portrait",
    visitorName: null as unknown as string,
    body: "great",
    status: "rejected",
    createdDaysAgo: 3,
  },
];

async function main() {
  const photographer = await prisma.photographer.findFirst();
  if (!photographer) throw new Error("Run `npm run db:seed` first to create the admin account.");

  const existing = await prisma.gallery.count({ where: { photographerId: photographer.id } });
  if (existing > 1) {
    console.log(`Found ${existing} existing galleries — skipping (demo data likely already seeded).`);
    console.log("Delete extra galleries from the admin UI first if you want to reseed.");
    return;
  }

  for (const plan of PLAN) {
    const slug = await generateUniqueSlug(plan.clientName);
    const createdAt = daysAgo(plan.createdDaysAgo);

    const gallery = await prisma.gallery.create({
      data: {
        photographerId: photographer.id,
        clientName: plan.clientName,
        slug,
        passwordHash: await hashPassword(plan.password),
        visibility: plan.visibility,
        category: plan.category,
        status: plan.status,
        allowPublicDownload: plan.allowPublicDownload ?? false,
        deliveredAt: plan.status === "delivered" || plan.status === "archived" ? daysAgo(plan.createdDaysAgo - 3) : null,
        archivedAt: plan.status === "archived" ? daysAgo(plan.createdDaysAgo - 10) : null,
        expiryDate: plan.expiresInDays ? daysFromNow(plan.expiresInDays) : null,
        createdAt,
      },
    });

    for (let i = 0; i < plan.photos; i++) {
      await addPhoto(gallery.id, createdAt);
    }
    if (plan.video) {
      await addVideo(gallery.id, createdAt);
    }
    if (plan.logs > 0) {
      await addAccessLogs(gallery.id, plan.logs);
    }

    console.log(`Created gallery: ${plan.clientName} (${plan.status}, ${plan.visibility})`);
  }

  await prisma.comment.createMany({
    data: COMMENTS.map((c) => ({
      category: c.category,
      visitorName: c.visitorName,
      body: c.body,
      status: c.status,
      createdAt: daysAgo(c.createdDaysAgo),
    })),
  });
  console.log(`Created ${COMMENTS.length} comments (${COMMENTS.filter((c) => c.status === "approved").length} approved).`);

  console.log("Demo content seeded.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
