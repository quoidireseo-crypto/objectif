import { LifeDomain } from '../types';

// Type d'une ressource « pour aller plus loin ».
//  - 'book' : un livre (titre + auteur), avec éventuellement un lien d'achat/découverte
//  - 'link' : une ressource en ligne (article, podcast, site), toujours avec une URL
//  - 'tip'  : un conseil actionnable, sans lien, juste à lire
export type ResourceType = 'book' | 'link' | 'tip';

export interface Resource {
  type: ResourceType;
  title: string;
  author?: string; // pour les livres
  description?: string; // courte phrase de contexte
  url?: string; // pour les liens (et certains livres)
}

// Bibliothèque curée, rangée par domaine de vie. 100 % statique et locale :
// aucune donnée de l'utilisateur ne sort de l'appareil, fonctionne hors-ligne.
// Les livres cités sont des références reconnues et faciles à trouver.
export const RESOURCES_BY_DOMAIN: Record<LifeDomain, Resource[]> = {
  'Santé & Bien-être': [
    { type: 'book', title: 'Pourquoi nous dormons', author: 'Matthew Walker', description: 'Comprendre le sommeil pour mieux récupérer.' },
    { type: 'book', title: 'Le Miracle Morning', author: 'Hal Elrod', description: 'Construire une routine matinale qui change la journée.' },
    { type: 'tip', title: "Commence petit", description: "5 minutes de marche aujourd'hui valent mieux qu'une heure « un jour »." },
    { type: 'link', title: 'Méditer avec Petit BamBou', url: 'https://www.petitbambou.com', description: 'Séances guidées courtes pour souffler.' },
  ],
  'Projet Personnel': [
    { type: 'book', title: 'Un rien peut tout changer (Atomic Habits)', author: 'James Clear', description: 'La méthode des petites habitudes qui composent de grands résultats.' },
    { type: 'book', title: 'Deep Work', author: 'Cal Newport', description: 'Retrouver la concentration dans un monde de distractions.' },
    { type: 'tip', title: 'La règle des 2 minutes', description: "Si une action prend moins de 2 minutes, fais-la maintenant." },
  ],
  'Relations & Famille': [
    { type: 'book', title: "Les cinq langages de l'amour", author: 'Gary Chapman', description: 'Mieux exprimer et recevoir l\'affection.' },
    { type: 'book', title: 'Les mots sont des fenêtres (Communication NonViolente)', author: 'Marshall Rosenberg', description: 'Désamorcer les tensions et se faire entendre.' },
    { type: 'tip', title: "Un message aujourd'hui", description: "Écris à une personne qui compte, juste pour prendre des nouvelles." },
  ],
  'Apprentissage': [
    { type: 'book', title: "Mets-toi ça dans la tête (Make It Stick)", author: 'Brown, Roediger, McDaniel', description: 'Les techniques d\'apprentissage qui fonctionnent vraiment.' },
    { type: 'book', title: "Changer d'état d'esprit (Mindset)", author: 'Carol Dweck', description: "Cultiver un état d'esprit de développement." },
    { type: 'link', title: 'OpenClassrooms', url: 'https://openclassrooms.com', description: 'Cours en ligne en français, du débutant à l\'expert.' },
  ],
  'Finances': [
    { type: 'book', title: "La Psychologie de l'argent", author: 'Morgan Housel', description: 'Le rapport à l\'argent est avant tout comportemental.' },
    { type: 'book', title: "L'homme le plus riche de Babylone", author: 'George S. Clason', description: 'Les principes intemporels de l\'épargne, en paraboles.' },
    { type: 'tip', title: "Se payer en premier", description: "Mets de côté une petite somme dès que tu reçois un revenu, avant tout le reste." },
  ],
  'Spiritualité': [
    { type: 'book', title: 'Le Pouvoir du moment présent', author: 'Eckhart Tolle', description: "Habiter l'instant plutôt que le mental." },
    { type: 'book', title: 'Méditer, jour après jour', author: 'Christophe André', description: 'Une initiation douce et concrète à la pleine conscience.' },
    { type: 'tip', title: 'Trois respirations', description: "Avant de commencer ta journée, prends trois respirations lentes en conscience." },
  ],
  'Autre': [
    { type: 'book', title: 'Les 7 habitudes des gens efficaces', author: 'Stephen R. Covey', description: 'Un classique pour aligner ses actions et ses valeurs.' },
    { type: 'book', title: "L'effet cumulé", author: 'Darren Hardy', description: 'Comment de petits choix répétés transforment une vie.' },
    { type: 'tip', title: 'Un seul prochain pas', description: "Demande-toi : quelle est la plus petite action qui me rapproche du but ?" },
  ],
};

// Renvoie les ressources associées à un domaine (jamais undefined).
export function getResourcesForDomain(domain: LifeDomain): Resource[] {
  return RESOURCES_BY_DOMAIN[domain] || RESOURCES_BY_DOMAIN['Autre'];
}
