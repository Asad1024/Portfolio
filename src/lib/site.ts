/* Where this site lives. Everything that has to produce an absolute URL —
   Open Graph images, the sitemap, robots — reads it from here, so there is one
   value to set rather than three to keep in sync.

   It comes from the environment because it genuinely differs per environment,
   and it is NEXT_PUBLIC_ because metadata is generated during the build. The
   fallback is localhost rather than a guessed domain: a wrong absolute URL
   produces broken preview cards silently, whereas localhost is obviously
   unset the first time anyone looks. */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
