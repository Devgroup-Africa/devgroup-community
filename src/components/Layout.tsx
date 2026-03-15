import { Link, useLocation, useNavigate } from "react-router-dom";
import { Code2, MessageSquare, Plus, Search, TrendingUp, Users, Menu, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/");
    }
  }, [searchQuery, navigate]);

  const navLinks = [
    { to: "/", icon: MessageSquare, label: "Questions", match: "/" },
    { to: "/tags", icon: TrendingUp, label: "Tags", match: "/tags" },
    { to: "/users", icon: Users, label: "Utilisateurs", match: "/users" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Code2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-mono text-lg font-bold text-foreground hidden sm:inline">
              DevFlow
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher des questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-muted pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </form>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, icon: Icon, label, match }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  location.pathname === match
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <Link
            to="/ask"
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Poser une question</span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card p-3 animate-fade-in">
            <nav className="flex flex-col gap-1">
              {navLinks.map(({ to, icon: Icon, label, match }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === match
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="container py-6">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="container py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <Code2 className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-mono text-sm font-bold text-foreground">DevFlow</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">Questions</Link>
              <Link to="/tags" className="hover:text-foreground transition-colors">Tags</Link>
              <Link to="/users" className="hover:text-foreground transition-colors">Utilisateurs</Link>
              <span>© 2025 DevFlow</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
