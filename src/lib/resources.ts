import { Goal, LifeDomain } from '../types';

// Type d'une ressource « pour aller plus loin ».
//  - 'book' : un livre (titre + auteur), avec éventuellement un lien
//  - 'link' : une ressource en ligne (article, podcast, site), toujours avec une URL
//  - 'tip'  : un conseil actionnable, sans lien, juste à lire
export type ResourceType = 'book' | 'link' | 'tip';

export interface Resource {
  type: ResourceType;
  title: string;
  author?: string; // pour les livres
  description?: string; // courte phrase de contexte
  url?: string; // pour les liens
}

// Un thème = un faisceau de mots-clés + ses ressources. La détection se fait sur
// le titre ET le « pourquoi » de l'objectif, ce qui permet de coller au sujet
// réel (« apprendre l'espagnol » → langues) plutôt qu'à la grande catégorie.
// Les mots-clés sont des RACINES normalisées (sans accent) : « medit » attrape
// méditer / méditation, « epargn » attrape épargne / épargner, etc.
interface Theme {
  id: string;
  keywords: string[];
  resources: Resource[];
}

// Ordre du plus spécifique au plus général : le premier thème qui « matche »
// le mieux l'emporte. 100 % statique, local et hors-ligne, aucune IA.
const THEMES: Theme[] = [
  {
    id: 'arret-tabac-addiction',
    keywords: ['fumer', 'fume', 'cigarette', 'tabac', 'clope', 'alcool', 'boire', 'addiction', 'sevrage'],
    resources: [
      { type: 'book', title: 'La méthode simple pour en finir avec la cigarette', author: 'Allen Carr', description: 'La référence pour arrêter sans sensation de manque.' },
      { type: 'tip', title: 'Repérer les déclencheurs', description: "Note les moments où l'envie surgit : tu désamorces avant qu'elle n'arrive." },
    ],
  },
  {
    id: 'langues',
    keywords: ['langue', 'anglais', 'espagnol', 'allemand', 'italien', 'portugais', 'chinois', 'japonais', 'arabe', 'russe', 'bilingue'],
    resources: [
      { type: 'book', title: 'Fluent Forever', author: 'Gabriel Wyner', description: 'Une méthode efficace pour mémoriser et parler vite.' },
      { type: 'link', title: 'Duolingo', url: 'https://www.duolingo.com', description: 'Quelques minutes par jour, en s\'amusant.' },
      { type: 'tip', title: '10 minutes par jour', description: "La régularité bat l'intensité : mieux vaut 10 min chaque jour qu'1 h le dimanche." },
    ],
  },
  {
    id: 'sport-forme',
    keywords: ['sport', 'courir', 'course', 'running', 'jogging', 'muscu', 'musculation', 'fitness', 'remise en forme', 'marche', 'marcher', 'velo', 'natation', 'nager', 'maigrir', 'poids', 'gym'],
    resources: [
      { type: 'book', title: 'Né pour courir (Born to Run)', author: 'Christopher McDougall', description: 'De quoi (re)trouver le plaisir du mouvement.' },
      { type: 'tip', title: 'La barre la plus basse', description: "Vise « mettre mes chaussures et sortir 5 min ». Le reste suit souvent tout seul." },
    ],
  },
  {
    id: 'sommeil',
    keywords: ['dormir', 'sommeil', 'insomnie', 'coucher', 'reveil', 'fatigue', 'sieste'],
    resources: [
      { type: 'book', title: 'Pourquoi nous dormons', author: 'Matthew Walker', description: 'Comprendre le sommeil pour mieux récupérer.' },
      { type: 'tip', title: 'Heure de coucher fixe', description: "Se coucher à heure régulière fait plus que dormir « plus longtemps »." },
    ],
  },
  {
    id: 'meditation-stress',
    keywords: ['medit', 'pleine conscience', 'mindfulness', 'stress', 'anxiet', 'angoisse', 'calme', 'respir', 'serenit', 'lacher prise'],
    resources: [
      { type: 'book', title: 'Méditer, jour après jour', author: 'Christophe André', description: 'Une initiation douce et concrète à la pleine conscience.' },
      { type: 'link', title: 'Petit BamBou', url: 'https://www.petitbambou.com', description: 'Séances guidées courtes pour souffler.' },
      { type: 'tip', title: 'Trois respirations', description: 'Avant de commencer, trois respirations lentes en conscience.' },
    ],
  },
  {
    id: 'finances-argent',
    keywords: ['argent', 'epargn', 'economiser', 'finance', 'budget', 'dette', 'investi', 'bourse', 'placement', 'patrimoine', 'depense'],
    resources: [
      { type: 'book', title: "La Psychologie de l'argent", author: 'Morgan Housel', description: 'Le rapport à l\'argent est avant tout comportemental.' },
      { type: 'book', title: "L'homme le plus riche de Babylone", author: 'George S. Clason', description: 'Les principes intemporels de l\'épargne, en paraboles.' },
      { type: 'tip', title: 'Se payer en premier', description: 'Mets de côté une petite somme dès réception d\'un revenu, avant tout le reste.' },
    ],
  },
  {
    id: 'entrepreneuriat',
    keywords: ['entreprise', 'entrepreneur', 'business', 'startup', 'freelance', 'auto-entrepreneur', 'lancer mon', 'mon activite', 'side project', 'monter une'],
    resources: [
      { type: 'book', title: 'Le Lean Startup', author: 'Eric Ries', description: 'Tester son idée vite et à moindre coût.' },
      { type: 'tip', title: 'Le plus petit pas vendable', description: "Cherche la plus petite version utile que quelqu'un accepterait dès aujourd'hui." },
    ],
  },
  {
    id: 'ecriture',
    keywords: ['ecrire', 'ecritur', 'roman', 'blog', 'redig', 'auteur', 'poesie', 'nouvelle'],
    resources: [
      { type: 'book', title: "Écriture : Mémoires d'un métier", author: 'Stephen King', description: 'Inspirant et concret sur la pratique de l\'écriture.' },
      { type: 'tip', title: 'Les pages du matin', description: 'Écris une page chaque matin, sans te relire. La régularité libère.' },
    ],
  },
  {
    id: 'lecture',
    keywords: ['lire', 'lectur', 'bouquin'],
    resources: [
      { type: 'tip', title: '10 pages par jour', description: "Une habitude minuscule : 10 pages = ~12 livres dans l'année." },
      { type: 'link', title: 'Babelio', url: 'https://www.babelio.com', description: 'Trouver ton prochain livre et suivre tes lectures.' },
    ],
  },
  {
    id: 'cuisine-nutrition',
    keywords: ['cuisin', 'cuisiner', 'nutrition', 'manger sain', 'alimentation', 'recette'],
    resources: [
      { type: 'link', title: 'Marmiton', url: 'https://www.marmiton.org', description: 'Des milliers de recettes simples pour se lancer.' },
      { type: 'tip', title: 'Cuisiner en double', description: 'Prépare deux portions : tu as le repas de demain sans effort.' },
    ],
  },
  {
    id: 'musique-instrument',
    keywords: ['guitare', 'piano', 'instrument', 'chant', 'chanter', 'musique', 'batterie', 'violon'],
    resources: [
      { type: 'tip', title: '15 minutes quotidiennes', description: 'Un peu chaque jour ancre mieux qu\'une longue séance hebdomadaire.' },
      { type: 'link', title: 'YouTube — tutoriels', url: 'https://www.youtube.com', description: 'Des cours gratuits pour presque tous les instruments.' },
    ],
  },
  {
    id: 'couple',
    keywords: ['couple', 'conjoint', 'mari', 'epouse', 'partenaire', 'amoureu', 'relation de couple'],
    resources: [
      { type: 'book', title: "Les cinq langages de l'amour", author: 'Gary Chapman', description: 'Mieux exprimer et recevoir l\'affection.' },
      { type: 'tip', title: 'Un rituel à deux', description: 'Un moment régulier sans écran, même 15 minutes, change beaucoup.' },
    ],
  },
  {
    id: 'parentalite',
    keywords: ['enfant', 'parent', 'parentalit', 'fils', 'fille', 'bebe', 'ado', 'education'],
    resources: [
      { type: 'book', title: 'Parler pour que les enfants écoutent', author: 'Faber & Mazlish', description: 'Des outils concrets de communication au quotidien.' },
      { type: 'tip', title: '10 minutes pleines', description: "Du temps 100 % présent (sans téléphone) vaut plus que des heures distraites." },
    ],
  },
  {
    id: 'relations-social',
    keywords: ['ami', 'social', 'rencontr', 'timide', 'timidit', 'reseau', 'solitude'],
    resources: [
      { type: 'book', title: 'Comment se faire des amis', author: 'Dale Carnegie', description: 'Un classique sur le lien et l\'écoute.' },
      { type: 'tip', title: 'Un message aujourd\'hui', description: "Écris à une personne qui compte, juste pour prendre des nouvelles." },
    ],
  },
  {
    id: 'procrastination-organisation',
    keywords: ['procrastin', 'organis', 'productivit', 'concentr', 'gestion du temps', 'focus', 'distraction', 'scroller'],
    resources: [
      { type: 'book', title: 'Deep Work', author: 'Cal Newport', description: 'Retrouver la concentration dans un monde de distractions.' },
      { type: 'book', title: "S'organiser pour réussir (GTD)", author: 'David Allen', description: 'Une méthode pour vider sa tête et agir.' },
      { type: 'tip', title: 'La règle des 2 minutes', description: 'Si une action prend moins de 2 minutes, fais-la maintenant.' },
    ],
  },
  {
    id: 'habitudes',
    keywords: ['habitude', 'routine', 'discipline', 'regularit', 'arreter de', 'commencer a'],
    resources: [
      { type: 'book', title: 'Un rien peut tout changer (Atomic Habits)', author: 'James Clear', description: 'La méthode des petites habitudes qui composent de grands résultats.' },
      { type: 'book', title: 'Le pouvoir des habitudes', author: 'Charles Duhigg', description: 'Comprendre la mécanique signal → routine → récompense.' },
    ],
  },
  {
    id: 'confiance-developpement',
    keywords: ['confiance', 'estime', 'developpement personnel', 'oser', 'peur', 'croyance', 'motivation'],
    resources: [
      { type: 'book', title: "Changer d'état d'esprit (Mindset)", author: 'Carol Dweck', description: "Cultiver un état d'esprit de développement." },
      { type: 'book', title: 'Les quatre accords toltèques', author: 'Miguel Ruiz', description: 'Quatre principes simples pour s\'alléger.' },
    ],
  },
  {
    id: 'spiritualite',
    keywords: ['spiritualit', 'priere', 'foi', 'gratitude', 'sens de la vie', 'interiorit', 'ame'],
    resources: [
      { type: 'book', title: 'Le Pouvoir du moment présent', author: 'Eckhart Tolle', description: "Habiter l'instant plutôt que le mental." },
      { type: 'book', title: "L'art du bonheur", author: 'Dalaï-Lama', description: 'Un dialogue sur le sens et la sérénité.' },
    ],
  },
  {
    id: 'apprentissage',
    keywords: ['apprendre', 'etudier', 'etude', 'formation', 'competence', 'cours', 'diplome', 'reviser', 'memoire'],
    resources: [
      { type: 'book', title: 'Mets-toi ça dans la tête (Make It Stick)', author: 'Brown, Roediger, McDaniel', description: 'Les techniques d\'apprentissage qui fonctionnent vraiment.' },
      { type: 'link', title: 'OpenClassrooms', url: 'https://openclassrooms.com', description: 'Cours en ligne en français, du débutant à l\'expert.' },
    ],
  },
];

// Ressources génériques de secours, par grand domaine de vie, quand aucun thème
// précis n'est détecté dans le titre/pourquoi de l'objectif.
const RESOURCES_BY_DOMAIN: Record<LifeDomain, Resource[]> = {
  'Santé & Bien-être': [
    { type: 'book', title: 'Le Miracle Morning', author: 'Hal Elrod', description: 'Construire une routine matinale qui change la journée.' },
    { type: 'tip', title: 'Commence petit', description: "5 minutes aujourd'hui valent mieux qu'une heure « un jour »." },
  ],
  'Projet Personnel': [
    { type: 'book', title: 'Un rien peut tout changer (Atomic Habits)', author: 'James Clear', description: 'Les petites habitudes qui composent de grands résultats.' },
    { type: 'tip', title: 'Un seul prochain pas', description: 'Quelle est la plus petite action qui te rapproche du but ?' },
  ],
  'Relations & Famille': [
    { type: 'book', title: "Les cinq langages de l'amour", author: 'Gary Chapman', description: 'Mieux exprimer et recevoir l\'affection.' },
    { type: 'tip', title: "Un message aujourd'hui", description: 'Écris à une personne qui compte, juste pour prendre des nouvelles.' },
  ],
  'Apprentissage': [
    { type: 'book', title: 'Mets-toi ça dans la tête (Make It Stick)', author: 'Brown, Roediger, McDaniel', description: 'Les techniques d\'apprentissage qui fonctionnent vraiment.' },
    { type: 'link', title: 'OpenClassrooms', url: 'https://openclassrooms.com', description: 'Cours en ligne en français.' },
  ],
  'Finances': [
    { type: 'book', title: "La Psychologie de l'argent", author: 'Morgan Housel', description: 'Le rapport à l\'argent est avant tout comportemental.' },
    { type: 'tip', title: 'Se payer en premier', description: 'Mets de côté une petite somme avant toute dépense.' },
  ],
  'Spiritualité': [
    { type: 'book', title: 'Le Pouvoir du moment présent', author: 'Eckhart Tolle', description: "Habiter l'instant plutôt que le mental." },
    { type: 'tip', title: 'Trois respirations', description: 'Avant de commencer ta journée, trois respirations en conscience.' },
  ],
  'Autre': [
    { type: 'book', title: 'Les 7 habitudes des gens efficaces', author: 'Stephen R. Covey', description: 'Aligner ses actions et ses valeurs.' },
    { type: 'tip', title: 'Un seul prochain pas', description: 'Quelle est la plus petite action qui te rapproche du but ?' },
  ],
};

// Enlève les accents et met en minuscules, pour une détection robuste.
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Compte combien de mots-clés (racines) d'un thème apparaissent dans le texte.
// On exige une frontière de mot avant la racine pour éviter les faux positifs
// (ex. « ami » ne doit pas matcher « famille »).
function scoreTheme(theme: Theme, text: string): number {
  let score = 0;
  for (const kw of theme.keywords) {
    const stem = normalize(kw);
    const re = new RegExp(`(^|[^a-z])${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    if (re.test(text)) score++;
  }
  return score;
}

// Renvoie les ressources les plus pertinentes pour un objectif : on cherche le
// thème dont le titre/pourquoi déclenche le plus de mots-clés ; à défaut, on
// retombe sur les ressources génériques du domaine.
export function getResourcesForGoal(goal: Pick<Goal, 'title' | 'why' | 'domain'>): Resource[] {
  const text = normalize(`${goal.title} ${goal.why || ''}`);

  let best: Theme | null = null;
  let bestScore = 0;
  for (const theme of THEMES) {
    const s = scoreTheme(theme, text);
    if (s > bestScore) {
      bestScore = s;
      best = theme;
    }
  }

  if (best && bestScore > 0) return best.resources;
  return RESOURCES_BY_DOMAIN[goal.domain] || RESOURCES_BY_DOMAIN['Autre'];
}
