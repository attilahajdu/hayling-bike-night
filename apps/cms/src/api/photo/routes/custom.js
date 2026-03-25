"use strict";

/** Community image upload for Netlify/serverless (Next cannot write to public/). */
module.exports = {
  routes: [
    {
      method: "POST",
      path: "/photos/community-image",
      handler: "photo.uploadCommunityImage",
      config: {
        auth: false,
      },
    },
  ],
};
