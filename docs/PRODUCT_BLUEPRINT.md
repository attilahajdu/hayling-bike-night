# Hayling Bike Night Product Blueprint

## Wireframes

### Home
```text
+--------------------------------------------------------------+
| Logo                    Events Gallery Upload News Petitions |
+--------------------------------------------------------------+
| HERO IMAGE / VIDEO + overlay                                |
| Every Thursday, Apr-Sep, 5pm-late                           |
| [This week's gallery] [Upload your shots] [Add to calendar] |
+--------------------------------------------------------------+
| Latest Gallery (6-8 thumbs) | New photos count | Photogs    |
+--------------------------------------------------------------+
| Next 4 events                | Latest news | petition card  |
+--------------------------------------------------------------+
```

### Gallery Hub
```text
+-------------------------------------------+
| Search bar                                |
+-------------------------------------------+
| Gallery Entry Card | Gallery Entry Card   |
| date, title, tags  | date, title, tags    |
+-------------------------------------------+
```

### Gallery Entry
```text
+-------------------------------------------------+
| Date/title | Gallery live timestamp | total     |
+-------------------------------------------------+
| [All] [Official] [Community]  Search/filter     |
+-------------------------------------------------+
| Official Albums cards                            |
+-------------------------------------------------+
| Large thumbnail grid (lazy-loaded)               |
+-------------------------------------------------+
```

### Upload flow
```text
Upload form -> submit -> pending moderation -> published
```

## Component List
- `SiteHeader`: sticky nav with priority links.
- `Hero`: photo-led homepage banner and CTA area.
- `GalleryGrid`: lazy thumbnail grid, outbound links for pro photos.
- `ModerationClient`: approve/reject photos and official albums.
- Card pattern for `GalleryEntry`, `OfficialAlbum`, `News`, `Petition`.

## Data Schema (Strapi)
- `Event`: title, slug, dateStart/dateEnd, location, note, galleryEntries, officialAlbums.
- `GalleryEntry`: title, slug, galleryLiveAt, tagline, tags, event, photos, officialAlbums.
- `Photographer`: name, bio, website/shop/feed, photos, officialAlbums.
- `Photo`: imageUrl/thumbnailUrl, status, isExternal, subjectKeywords, uploaderHandle, bike fields, consent, moderationReason, event, galleryEntry, photographer.
- `OfficialAlbum`: title, slug, albumUrl, coverImageUrl, photoCount, status, submitter fields, event, galleryEntry, photographer.
- Existing `NewsPost` and `Petition` retained.

## User Flows
1. Community upload
   - User opens `/upload`.
   - Selects latest meet, enters photo URL and consent.
   - System stores as `pending`.
   - Admin approves in moderation queue.
2. Photographer album submission
   - Photographer opens `/submit-album`.
   - Submits album metadata URL.
   - Admin approves/rejects in same queue.
   - Approved entries appear in `Official Albums` on gallery entry page.
3. Browse/search
   - User opens `/gallery` then specific meet entry.
   - Uses source toggles and search for tags/handle/plate fragment.
4. Moderation
   - Organiser signs in and opens `/owner/moderation`.
   - Reviews pending photos and albums with one-tap approve/reject.

## Phased Delivery
- Phase 1: IA pages, gallery entry model, official album model, hub UI.
- Phase 2: Public submission endpoints, moderation queue expansion.
- Phase 3: richer search facets, notifications, CDN tuning, featured modules.
