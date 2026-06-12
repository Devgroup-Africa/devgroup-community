import { useEffect } from "react";
import { getSiteUrl } from "@/lib/seo";

type JsonLd = Record<string, unknown> | Record<string, unknown>[];

type SeoProps = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
  jsonLd?: JsonLd;
};

const SITE_NAME = "DevGroup Community";

const setMeta = (selector: string, attribute: "name" | "property", key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

const toAbsoluteUrl = (value: string) => {
  try {
    return new URL(value, `${getSiteUrl()}/`).toString();
  } catch {
    return getSiteUrl();
  }
};

const Seo = ({
  title,
  description,
  path,
  image = "/logo-vert.png",
  type = "website",
  noIndex = false,
  jsonLd,
}: SeoProps) => {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const canonicalUrl = toAbsoluteUrl(path || window.location.pathname);
    const imageUrl = toAbsoluteUrl(image);

    document.title = fullTitle;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[name="robots"]', "name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:type"]', "property", "og:type", type);
    setMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    setMeta('meta[property="og:image"]', "property", "og:image", imageUrl);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", imageUrl);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    const scriptId = "page-json-ld";
    document.getElementById(scriptId)?.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [description, image, jsonLd, noIndex, path, title, type]);

  return null;
};

export default Seo;
