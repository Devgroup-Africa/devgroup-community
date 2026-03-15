export interface Question {
  id: string;
  title: string;
  body: string;
  tags: string[];
  votes: number;
  answers: Answer[];
  author: string;
  authorAvatar: string;
  createdAt: string;
  views: number;
}

export interface Answer {
  id: string;
  body: string;
  votes: number;
  author: string;
  authorAvatar: string;
  createdAt: string;
  accepted: boolean;
}

export const allTags = [
  "javascript", "typescript", "react", "python", "css", "html",
  "node.js", "git", "docker", "sql", "rust", "go", "api",
  "devops", "testing", "performance", "security", "graphql"
];

export const questions: Question[] = [
  {
    id: "1",
    title: "Comment gérer l'état global dans une app React sans Redux ?",
    body: `Je travaille sur une application React de taille moyenne et je cherche des alternatives à Redux pour gérer l'état global.\n\nJ'ai entendu parler de Zustand, Jotai, et du Context API natif de React. Quels sont les avantages et inconvénients de chaque approche ?\n\n\`\`\`tsx\n// Exemple avec Context\nconst AppContext = createContext<AppState | null>(null);\n\`\`\`\n\nMerci pour vos retours !`,
    tags: ["react", "typescript", "javascript"],
    votes: 42,
    views: 1250,
    author: "Marie_Dev",
    authorAvatar: "MD",
    createdAt: "il y a 2 heures",
    answers: [
      {
        id: "a1",
        body: "Zustand est excellent pour les apps de taille moyenne. Il est léger, simple à utiliser et ne nécessite pas de Provider.\n\n```tsx\nimport { create } from 'zustand';\n\nconst useStore = create((set) => ({\n  count: 0,\n  increment: () => set((state) => ({ count: state.count + 1 })),\n}));\n```\n\nJe le recommande fortement par rapport à Redux pour la majorité des cas d'usage.",
        votes: 28,
        author: "Alex_JS",
        authorAvatar: "AJ",
        createdAt: "il y a 1 heure",
        accepted: true,
      },
      {
        id: "a2",
        body: "Le Context API est suffisant si tu n'as que quelques valeurs globales. Mais attention aux re-renders ! Chaque changement de contexte re-render tous les consommateurs.\n\nPour éviter ça, découpe ton contexte en plusieurs petits contextes spécialisés.",
        votes: 15,
        author: "Sophie_React",
        authorAvatar: "SR",
        createdAt: "il y a 45 min",
        accepted: false,
      },
    ],
  },
  {
    id: "2",
    title: "Docker : optimiser la taille des images pour une app Node.js",
    body: "Mon image Docker pour une simple API Node.js fait 1.2 GB. Comment réduire drastiquement cette taille ? J'utilise actuellement `node:18` comme image de base.",
    tags: ["docker", "node.js", "devops"],
    votes: 35,
    views: 890,
    author: "DevOps_Pierre",
    authorAvatar: "DP",
    createdAt: "il y a 5 heures",
    answers: [
      {
        id: "a3",
        body: "Utilise `node:18-alpine` comme image de base et un multi-stage build :\n\n```dockerfile\nFROM node:18-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\n\nFROM node:18-alpine\nCOPY --from=builder /app/node_modules ./node_modules\nCOPY . .\nCMD [\"node\", \"index.js\"]\n```\n\nTu devrais passer sous les 200 MB facilement.",
        votes: 22,
        author: "Container_Pro",
        authorAvatar: "CP",
        createdAt: "il y a 3 heures",
        accepted: true,
      },
    ],
  },
  {
    id: "3",
    title: "TypeScript : comprendre les types conditionnels avancés",
    body: "Je n'arrive pas à comprendre comment fonctionnent les types conditionnels imbriqués en TypeScript. Quelqu'un peut m'expliquer avec des exemples concrets ?",
    tags: ["typescript", "javascript"],
    votes: 27,
    views: 640,
    author: "Type_Master",
    authorAvatar: "TM",
    createdAt: "il y a 1 jour",
    answers: [],
  },
  {
    id: "4",
    title: "CSS Grid vs Flexbox : quand utiliser l'un plutôt que l'autre ?",
    body: "Je confonds souvent quand utiliser Grid vs Flexbox. Y a-t-il une règle simple pour choisir ?",
    tags: ["css", "html"],
    votes: 56,
    views: 2100,
    author: "CSS_Ninja",
    authorAvatar: "CN",
    createdAt: "il y a 2 jours",
    answers: [
      {
        id: "a4",
        body: "Règle simple :\n- **Flexbox** = layout 1D (une ligne OU une colonne)\n- **Grid** = layout 2D (lignes ET colonnes)\n\nFlexbox pour les navbars, les listes d'items alignés. Grid pour les layouts de page complets, les galeries, les dashboards.",
        votes: 41,
        author: "Layout_Pro",
        authorAvatar: "LP",
        createdAt: "il y a 1 jour",
        accepted: true,
      },
      {
        id: "a5",
        body: "J'ajouterais que Grid est aussi parfait pour les formulaires complexes avec des champs de tailles différentes. Et on peut combiner les deux !",
        votes: 12,
        author: "Frontend_Fan",
        authorAvatar: "FF",
        createdAt: "il y a 20 heures",
        accepted: false,
      },
    ],
  },
  {
    id: "5",
    title: "Rust vs Go pour un microservice haute performance ?",
    body: "Je dois développer un microservice qui traite ~10k requêtes/seconde. Rust ou Go ? Quels sont les trade-offs en termes de performance, DX et maintenabilité ?",
    tags: ["rust", "go", "performance", "api"],
    votes: 89,
    views: 3400,
    author: "Perf_Geek",
    authorAvatar: "PG",
    createdAt: "il y a 3 jours",
    answers: [
      {
        id: "a6",
        body: "Pour 10k req/s, Go est largement suffisant et bien plus rapide à développer. Rust brille au-dessus de 100k req/s ou quand la latence p99 est critique.\n\nGo = productivité + performance très correcte.\nRust = performance maximale + garanties mémoire, mais courbe d'apprentissage raide.",
        votes: 67,
        author: "Systems_Dev",
        authorAvatar: "SD",
        createdAt: "il y a 2 jours",
        accepted: false,
      },
    ],
  },
  {
    id: "6",
    title: "Comment sécuriser une API REST avec JWT correctement ?",
    body: "Je vois beaucoup de tutoriels contradictoires sur l'utilisation de JWT. Quelles sont les bonnes pratiques en 2025 pour sécuriser une API ?",
    tags: ["security", "api", "node.js"],
    votes: 44,
    views: 1800,
    author: "Sec_First",
    authorAvatar: "SF",
    createdAt: "il y a 4 jours",
    answers: [],
  },
];
