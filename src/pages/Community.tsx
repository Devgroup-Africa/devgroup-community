import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import {
  Users, Heart, Shield, Sparkles, MessageSquare, Code2,
  Globe2, HandHeart, AlertTriangle, BookOpen, Award,
} from "lucide-react";

const VALUES = [
  { icon: HandHeart, title: "Bienveillance", text: "On se parle comme on aimerait qu'on nous parle. Pas de condescendance, pas de moquerie." },
  { icon: Sparkles, title: "Curiosité", text: "Aucune question n'est bête. Chaque débutant d'aujourd'hui est un mentor de demain." },
  { icon: Globe2, title: "Diversité", text: "Africains, Européens, juniors, seniors, autodidactes ou diplômés — tout le monde a sa place." },
  { icon: Code2, title: "Excellence", text: "On valorise la qualité du code, la clarté des explications et la rigueur des réponses." },
];

const RULES = [
  { ok: true, text: "Posez des questions claires avec contexte, code et ce que vous avez essayé." },
  { ok: true, text: "Répondez avec respect, même quand la question vous paraît évidente." },
  { ok: true, text: "Citez vos sources, vos articles, vos repos. Donnez du crédit." },
  { ok: true, text: "Utilisez le format Markdown et les blocs de code pour rester lisible." },
  { ok: false, text: "Pas d'attaques personnelles, de propos racistes, sexistes, homophobes." },
  { ok: false, text: "Pas de spam, pas d'auto-promotion sans valeur ajoutée." },
  { ok: false, text: "Pas de plagiat. Pas de partage de code propriétaire sans autorisation." },
  { ok: false, text: "Pas de contenu illégal, de piratage, de cracks." },
];

const Community = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Hero */}
        <section className="text-center py-10 border-b border-border">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-mono text-primary mb-4">
            <Users className="h-3 w-3" /> Communauté
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-mono text-foreground mb-3">
            Bienvenue chez <span className="text-primary">DevGroup Community</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Un espace pensé pour les développeurs qui veulent apprendre, partager et grandir ensemble — sans
            jugement, sans gatekeeping, sans toxicité.
          </p>
        </section>

        {/* Valeurs */}
        <section className="py-10">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold font-mono text-foreground">Nos valeurs</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">{title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Code de conduite */}
        <section className="py-10 border-t border-border">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold font-mono text-foreground">Code de conduite</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            En participant à DevGroup Community, vous vous engagez à respecter les règles suivantes.
            Tout manquement peut entraîner la suppression du contenu, un avertissement, ou un bannissement.
          </p>
          <ul className="space-y-2">
            {RULES.map((r, i) => (
              <li
                key={i}
                className={`flex items-start gap-3 rounded-md border p-3 ${
                  r.ok ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                    r.ok ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                  }`}
                >
                  {r.ok ? "✓" : "✕"}
                </span>
                <span className="text-sm text-foreground">{r.text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Comment contribuer */}
        <section className="py-10 border-t border-border">
          <div className="flex items-center gap-2 mb-6">
            <Award className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold font-mono text-foreground">Comment contribuer</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/ask" className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors">
              <MessageSquare className="h-5 w-5 text-primary mb-2" />
              <h3 className="text-sm font-bold text-foreground mb-1">Posez vos questions</h3>
              <p className="text-xs text-muted-foreground">Bloqué sur un bug ? Partagez-le, la communauté répond.</p>
            </Link>
            <Link to="/" className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors">
              <BookOpen className="h-5 w-5 text-primary mb-2" />
              <h3 className="text-sm font-bold text-foreground mb-1">Répondez aux autres</h3>
              <p className="text-xs text-muted-foreground">Partagez votre expérience, gagnez de la réputation.</p>
            </Link>
            <Link to="/users" className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors">
              <Users className="h-5 w-5 text-primary mb-2" />
              <h3 className="text-sm font-bold text-foreground mb-1">Rencontrez les membres</h3>
              <p className="text-xs text-muted-foreground">Suivez les profils qui vous inspirent.</p>
            </Link>
          </div>
        </section>

        {/* Signalement */}
        <section className="py-10 border-t border-border">
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">Vous voyez un comportement inapproprié ?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Utilisez le bouton « Signaler » sur la publication concernée. L'équipe de modération examine
                  chaque signalement dans les meilleurs délais.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer note */}
        <section className="py-8 text-center border-t border-border">
          <p className="text-xs text-muted-foreground">
            Une initiative de{" "}
            <a href="https://devgroup.ga" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              DevGroup Africa
            </a>
            {" "}— construit pour les développeurs d'Afrique et d'ailleurs.
          </p>
        </section>
      </div>
    </Layout>
  );
};

export default Community;
