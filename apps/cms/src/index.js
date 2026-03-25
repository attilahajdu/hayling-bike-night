"use strict";

async function seedEvents(strapi) {
  const existing = await strapi.query("api::event.event").count();
  if (existing > 0) return;

  const seasonYear = new Date().getFullYear();
  const events = [];
  for (let month = 3; month <= 8; month++) {
    const last = new Date(seasonYear, month + 1, 0).getDate();
    for (let day = 1; day <= last; day++) {
      const d = new Date(seasonYear, month, day);
      if (d.getDay() !== 4) continue;
      const slug = `bike-night-${seasonYear}-${month + 1}-${day}`;
      const dateStart = new Date(d);
      dateStart.setHours(17, 0, 0, 0);
      const dateEnd = new Date(d);
      dateEnd.setHours(23, 59, 0, 0);
      events.push({
        title: `Hayling Bike Night — ${d.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}`,
        slug,
        dateStart: dateStart.toISOString(),
        dateEnd: dateEnd.toISOString(),
        location: "John's Café, Hayling Island · PO11 0AS",
        note: "Weekly marshalled meet. Check news for weather or charity ride notes.",
        eventKind: "bike_night",
        publishedAt: new Date(),
      });
    }
  }

  for (const data of events) {
    await strapi.entityService.create("api::event.event", { data });
  }
  strapi.log.info(`Seeded ${events.length} seasonal Bike Night events.`);
}

async function seedPetition(strapi) {
  const n = await strapi.query("api::petition.petition").count();
  if (n > 0) return;
  await strapi.entityService.create("api::petition.petition", {
    data: {
      title: "Support marshalled evening meets on Hayling",
      slug: "support-marshalled-meets",
      description:
        "We support **fully marshalled** Bike Night evenings that keep riders and residents safe.\n\n" +
        "Sign below if you want the council and partners to continue backing organised, insured meets.",
      goalCount: 1000,
      currentCount: 0,
      publishedAt: new Date(),
    },
  });
  strapi.log.info("Seeded sample petition.");
}

async function seedGalleryData(strapi) {
  const photographerCount = await strapi.query("api::photographer.photographer").count();
  const galleryCount = await strapi.query("api::gallery-entry.gallery-entry").count();
  if (photographerCount > 0 || galleryCount > 0) return;

  const events = await strapi.entityService.findMany("api::event.event", {
    fields: ["id", "title", "slug", "dateStart"],
    sort: { dateStart: "desc" },
    limit: 3,
  });
  if (!events.length) return;

  const photographers = [];
  for (const data of [
    {
      name: "Island Moto Shots",
      websiteUrl: "https://example.com/island-moto-shots",
      feedUrl: "https://example.com/island-moto-shots/rss",
    },
    {
      name: "South Coast Bike Lens",
      websiteUrl: "https://example.com/south-coast-bike-lens",
      feedUrl: "https://example.com/south-coast-bike-lens/rss",
    },
  ]) {
    photographers.push(await strapi.entityService.create("api::photographer.photographer", { data: { ...data, publishedAt: new Date() } }));
  }

  for (const [i, event] of events.entries()) {
    const ge = await strapi.entityService.create("api::gallery-entry.gallery-entry", {
      data: {
        title: `Gallery — ${event.title}`,
        slug: `gallery-${event.slug}`,
        galleryLiveAt: new Date(),
        tagline: i === 0 ? "New drop this week" : "Community and pro photographer highlights",
        tags: "yamaha,honda,ducati,night",
        event: event.id,
        publishedAt: new Date(),
      },
    });

    await strapi.entityService.create("api::official-album.official-album", {
      data: {
        title: `Official Album — ${photographers[i % photographers.length].name}`,
        albumUrl: photographers[i % photographers.length].websiteUrl,
        shopUrl: photographers[i % photographers.length].websiteUrl,
        coverImageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&q=70&auto=format&fit=crop",
        photoCount: 120 + i * 20,
        status: "published",
        submittedByName: photographers[i % photographers.length].name,
        submittedByEmail: "hello@example.com",
        galleryEntry: ge.id,
        event: event.id,
        photographer: photographers[i % photographers.length].id,
        publishedAt: new Date(),
      },
    });

    for (let p = 0; p < 8; p++) {
      await strapi.entityService.create("api::photo.photo", {
        data: {
          title: `Community Shot ${p + 1}`,
          caption: "Sample gallery image placeholder",
          status: "published",
          isExternal: p % 2 === 0,
          thumbnailUrl: `https://picsum.photos/seed/hbn-${i}-${p}/800/600`,
          imageUrl: `https://picsum.photos/seed/hbn-${i}-${p}/1600/1200`,
          sourcePageUrl: p % 2 === 0 ? photographers[i % photographers.length].websiteUrl : null,
          purchaseUrl: p % 2 === 0 ? photographers[i % photographers.length].websiteUrl : null,
          subjectKeywords: "r1,black,agv,hayling",
          uploaderHandle: p % 2 === 0 ? null : "community-rider",
          bikeMakeModel: p % 2 === 0 ? "Yamaha R1" : "Honda CBR",
          bikeColour: p % 2 === 0 ? "Black" : "Red",
          consentConfirmed: true,
          event: event.id,
          galleryEntry: ge.id,
          photographer: photographers[i % photographers.length].id,
          submittedBy: p % 2 === 0 ? photographers[i % photographers.length].name : "Community",
        },
      });
    }
  }

  strapi.log.info("Seeded gallery entries, official albums, photographers and photos.");
}

module.exports = {
  register() {},
  async bootstrap({ strapi }) {
    try {
      await seedEvents(strapi);
      await seedPetition(strapi);
      await seedGalleryData(strapi);
    } catch (e) {
      strapi.log.warn("Event seed skipped or failed", e);
    }
  },
};
