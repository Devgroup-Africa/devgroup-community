export const getSiteUrl = () => (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/+$/, "");
