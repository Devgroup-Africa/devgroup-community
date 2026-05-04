import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { username: username || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Compte créé ! Vous êtes connecté.");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connecté !");
        navigate("/");
      }
    } catch (err: any) {
      const msg = err?.message || "Une erreur est survenue";
      if (msg.includes("Invalid login")) setError("Email ou mot de passe incorrect.");
      else if (msg.includes("already registered")) setError("Ce compte existe déjà. Connectez-vous.");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <img src="/logo-vert.png" alt="DevGroup Community" className="h-9 w-auto" />
          <span className="font-mono text-xl font-bold text-foreground">DevGroup Community</span>
        </Link>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1 mb-5">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); }}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                mode === "signin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); }}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Inscription
            </button>
          </div>

          <h1 className="text-lg font-bold font-mono text-foreground mb-1">
            {mode === "signin" ? "Bon retour !" : "Rejoindre DevGroup Community"}
          </h1>
          <p className="text-xs text-muted-foreground mb-5">
            {mode === "signin"
              ? "Connectez-vous pour poser des questions et voter."
              : "Créez votre compte pour participer à la communauté."}
          </p>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Pseudo</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="dev_master"
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_]+"
                  required
                  className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {mode === "signup" && (
                <p className="text-[10px] text-muted-foreground mt-1">Au moins 6 caractères</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Patientez…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>
        </div>

        <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors">
          ← Retour aux questions
        </Link>
      </div>
    </div>
  );
};

export default Auth;
