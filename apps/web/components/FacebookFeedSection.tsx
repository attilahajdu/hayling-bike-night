/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { getFacebookFeed } from "@/lib/facebook";

function shortText(value: string | null, max = 220) {
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}...`;
}

export async function FacebookFeedSection() {
  const posts = await getFacebookFeed(6);
  const pageUrl = "https://www.facebook.com/profile.php?id=100066942760761";
  const pluginUrl =
    "https://www.facebook.com/plugins/page.php?" +
    "href=" +
    encodeURIComponent(pageUrl) +
    "&tabs=timeline&width=1200&height=760&small_header=false&adapt_container_width=false&hide_cover=false&show_facepile=true";

  return (
    <section className="w-full bg-white py-20 dark:bg-zinc-950">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="section-title">Live From Facebook</h2>
          <Link href={pageUrl} target="_blank" className="text-sm text-ink">
            Open full Facebook page →
          </Link>
        </div>

        {!posts.length ? (
          <div className="space-y-4">
            <div className="card overflow-hidden p-0">
              <iframe
                title="Hayling Bike Night Facebook timeline"
                src={pluginUrl}
                className="h-[760px] w-full border-0"
                style={{ width: "100%" }}
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
            </div>
            <div className="card p-4 text-sm text-zinc-700 dark:text-zinc-300">
              <p className="font-display font-bold text-2xl uppercase text-ink">Facebook feed linked underneath</p>
              <div className="mt-2 flex flex-wrap gap-4">
                <Link href={pageUrl} target="_blank" className="text-accent">
                  Open Hayling Bike Night on Facebook →
                </Link>
                <Link href={pluginUrl} target="_blank" className="text-accent">
                  Open timeline feed →
                </Link>
              </div>
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              API cards appear automatically when admin token access is available.
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article key={post.id} className="card overflow-hidden">
                  {post.mediaUrl ? (
                    <div className="relative aspect-[16/10] bg-zinc-100 dark:bg-zinc-800">
                      <img src={post.mediaUrl} alt="Facebook post media" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                      <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2.5 py-1 text-xs uppercase text-zinc-200">
                        {post.mediaType === "video" ? "Video" : "Image"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex aspect-[16/10] items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      Text post
                    </div>
                  )}

                  <div className="p-4">
                    <p className="text-xs uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
                      {new Date(post.createdTime).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {shortText(post.message, 220) || "No text content on this post."}
                    </p>
                    <Link href={post.permalinkUrl} target="_blank" className="mt-3 inline-block text-sm text-accent">
                      View on Facebook →
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="card p-4 text-sm text-zinc-700 dark:text-zinc-300">
              <p className="font-display font-bold text-2xl uppercase text-ink">More from the page</p>
              <div className="mt-2 flex flex-wrap gap-4">
                <Link href={pageUrl} target="_blank" className="text-accent">
                  Hayling Bike Night Facebook page →
                </Link>
                <Link href={pluginUrl} target="_blank" className="text-accent">
                  Open timeline feed →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
