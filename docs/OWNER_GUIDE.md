# Owner quick guide (tablet)

## Approve photos

1. Ask your developer to add your **email** to `OWNER_EMAILS` on the live site.
2. Sign in with **Google** or **Facebook** on `/auth/signin`.
3. Open **`/owner/moderation`**.
4. For each photo: tap **Approve** (goes live) or **Reject**.

## Edit text (dates, news, petitions)

Use **Strapi Admin** (your developer will send the link). You do **not** need to use Strapi for the daily photo queue — use the moderation page above.

## Photographer thumbnails (buy on their site)

In Strapi → **Photo**: set **Thumbnail URL**, **Source page URL**, and **Purchase URL** if they sell prints. The public gallery shows a **Photographer** badge and a **Buy / full gallery** link that opens their website.

## Help riders find themselves

When publishing or approving shots, fill **Subject keywords** (e.g. `blue R1, black jacket, plate AB12`). Riders search these on the **Gallery** page.
