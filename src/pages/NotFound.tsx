import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { FileQuestion } from "lucide-react";

const NotFound = () => {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-5xl font-bold font-mono text-foreground mb-2">404</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link
          to="/"
          className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    </Layout>
  );
};

export default NotFound;
