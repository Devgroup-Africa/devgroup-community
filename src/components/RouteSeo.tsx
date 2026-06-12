import { useLocation } from "react-router-dom";
import Seo from "@/components/Seo";
import { getSiteUrl } from "@/lib/seo";

const DEFAULT_DESCRIPTION =
  "DevGroup Community est un espace ouvert pour poser des questions, partager des idées, découvrir des projets et échanger avec une communauté curieuse et engagée.";

const ROUTE_SEO: Record<string, { title: string; description: string; noIndex?: boolean }> = {
  "/": {
    title: "DevGroup Community — Partagez, échangez, progressez",
    description: DEFAULT_DESCRIPTION,
  },
  "/community": {
    title: "À propos de la communauté",
    description: "Découvrez les valeurs, les règles et les différentes façons de contribuer à DevGroup Community.",
  },
  "/communities": {
    title: "Communautés thématiques",
    description: "Explorez et rejoignez des communautés thématiques pour partager vos idées et rencontrer leurs membres.",
  },
  "/tags": {
    title: "Sujets et tags",
    description: "Explorez les publications de DevGroup Community par sujet et trouvez rapidement les échanges qui vous intéressent.",
  },
  "/users": {
    title: "Membres de la communauté",
    description: "Découvrez les membres de DevGroup Community, leurs expériences et leurs contributions.",
  },
  "/badges": {
    title: "Badges et contributions",
    description: "Découvrez les badges qui récompensent la participation et les contributions sur DevGroup Community.",
  },
  "/auth": {
    title: "Connexion",
    description: "Connectez-vous ou créez votre compte DevGroup Community.",
    noIndex: true,
  },
  "/ask": {
    title: "Créer une publication",
    description: "Créez une question, une discussion ou une actualité sur DevGroup Community.",
    noIndex: true,
  },
};

const RouteSeo = () => {
  const { pathname, search } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  const isDynamicPublicRoute =
    pathname.startsWith("/question/") || pathname.startsWith("/communities/") || pathname.startsWith("/user/");
  const route = ROUTE_SEO[pathname];

  if (isDynamicPublicRoute) return null;
  if (isAdmin || !route) {
    return (
      <Seo
        title={isAdmin ? "Administration" : "Page introuvable"}
        description={isAdmin ? "Espace d'administration DevGroup Community." : "Cette page est introuvable."}
        path={pathname}
        noIndex
      />
    );
  }

  const isFilteredHome = pathname === "/" && Boolean(search);
  const origin = getSiteUrl();
  const jsonLd =
    pathname === "/"
      ? [
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "DevGroup Community",
            url: origin,
            description: DEFAULT_DESCRIPTION,
            potentialAction: {
              "@type": "SearchAction",
              target: `${origin}/?search={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "DevGroup Community",
            url: origin,
            logo: `${origin}/logo-vert.png`,
            parentOrganization: {
              "@type": "Organization",
              name: "DevGroup Africa",
              url: "https://devgroup.ga",
            },
          },
        ]
      : undefined;

  return (
    <Seo
      title={route.title}
      description={route.description}
      path={pathname}
      noIndex={route.noIndex || isFilteredHome}
      jsonLd={jsonLd}
    />
  );
};

export default RouteSeo;
