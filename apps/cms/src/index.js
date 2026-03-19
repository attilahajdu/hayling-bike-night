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

module.exports = {
  register() {},
  async bootstrap({ strapi }) {
    try {
      await seedEvents(strapi);
      await seedPetition(strapi);
    } catch (e) {
      strapi.log.warn("Event seed skipped or failed", e);
    }
  },
};
