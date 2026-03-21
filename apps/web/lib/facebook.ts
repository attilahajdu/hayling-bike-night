export type FacebookFeedItem = {
  id: string;
  message: string | null;
  createdTime: string;
  permalinkUrl: string;
  mediaType: "image" | "video" | "none";
  mediaUrl: string | null;
};

type GraphPost = {
  id: string;
  message?: string;
  created_time: string;
  permalink_url: string;
  attachments?: {
    data?: Array<{
      media_type?: string;
      media?: { image?: { src?: string } };
      subattachments?: {
        data?: Array<{
          media_type?: string;
          media?: { image?: { src?: string } };
        }>;
      };
    }>;
  };
};

type GraphResponse = { data?: GraphPost[] };

function resolveMedia(post: GraphPost): { mediaType: FacebookFeedItem["mediaType"]; mediaUrl: string | null } {
  const first = post.attachments?.data?.[0];
  if (!first) return { mediaType: "none", mediaUrl: null };

  if (first.media_type === "video") {
    return {
      mediaType: "video",
      mediaUrl: first.media?.image?.src ?? null,
    };
  }

  if (first.media?.image?.src) {
    return { mediaType: "image", mediaUrl: first.media.image.src };
  }

  const sub = first.subattachments?.data?.[0];
  if (sub?.media?.image?.src) {
    return {
      mediaType: sub.media_type === "video" ? "video" : "image",
      mediaUrl: sub.media.image.src,
    };
  }

  return { mediaType: "none", mediaUrl: null };
}

export async function getFacebookFeed(limit = 6): Promise<FacebookFeedItem[]> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) return [];

  const fields = [
    "id",
    "message",
    "created_time",
    "permalink_url",
    "attachments{media_type,media,subattachments{media_type,media}}",
  ].join(",");

  const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(pageId)}/posts?fields=${encodeURIComponent(fields)}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = (await res.json()) as GraphResponse;
    const list = json.data ?? [];

    return list.map((post) => {
      const media = resolveMedia(post);
      return {
        id: post.id,
        message: post.message ?? null,
        createdTime: post.created_time,
        permalinkUrl: post.permalink_url,
        mediaType: media.mediaType,
        mediaUrl: media.mediaUrl,
      };
    });
  } catch {
    return [];
  }
}

export async function getFacebookMedia(limit = 12): Promise<string[]> {
  const posts = await getFacebookFeed(limit);
  return posts
    .map((post) => post.mediaUrl)
    .filter((url): url is string => Boolean(url));
}
