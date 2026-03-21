"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    /*
     * The Strapi upload plugin depends on `sharp` for image processing.
     * Your local Node environment currently can’t build `sharp`,
     * so we disable upload for local boot/unblocking.
     *
     * In production, re-enable once you run Strapi on Node 20+.
     */
    upload: {
        enabled: false,
    },
});
