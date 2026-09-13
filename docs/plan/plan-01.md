# Plan R1 — tâches B-01 à B-04

## Périmètre

Ce plan couvre uniquement le premier incrément demandé dans `SPRINT-01.md` : le carcan minimal de l’application, la carte du détroit de Douvres, un seul navire de démonstration et sa fiche au clic. Il ne prépare ni serveur, ni source de données externe, ni bouton de chargement, ni tests, ni emplacements pour les tâches ultérieures.

## B-01 — Carcan de l’application
Objectif : créer le socle minimal de l’application.

Travail prévu :
- Créer le projet minimal Next.js + React + TypeScript en mode `strict` dans le dépôt, avec Node.js 24 comme référence.
- Ajouter uniquement les éléments nécessaires à B-01–B-04 : scripts de développement, dépendances du socle Next.js/React/TypeScript et Leaflet, `.gitignore` Node/Next et fichier lock.
- Remplacer la page d’exemple par une page de départ minimale, sans exemples `create-next-app` ni abstractions destinées aux fonctionnalités ultérieures.
- Documenter brièvement la commande de lancement et les limites de cette étape dans `CLAUDE.md`, sans décrire les exigences des tâches suivantes.

À ne pas faire :
ne pas ajouter de bouton de chargement des données réelles ;
ne pas préparer de serveur ou d’intégration AISStream ;
ne pas créer de dossiers ou d’abstractions « pour plus tard » ;
ne pas conserver les exemples inutiles de create-next-app.

**Vérification de fin :** depuis une installation propre des dépendances, `npm run dev` démarre l’application sur `http://localhost:3000` et la page de départ s’affiche ; le manifeste des dépendances ne contient pas de bibliothèque supplémentaire au-delà du stack défini dans `SPRINT-01.md`.

## B-02 — Carte du détroit de Douvres
Objectif : afficher automatiquement la carte du détroit de Douvres.

Travail prévu :
- Ajouter la carte Leaflet  1.9.x. uniquement côté client afin d’éviter l’accès à `window` pendant le rendu serveur.
- Utiliser le fond OpenStreetMap Standard avec l’URL de tuiles et l’attribution prévues dans le sprint.
- Centraliser dans une configuration unique (stocker les paramètres de zone et de vue initiale dans un seul fichier de configuration) le rectangle du secteur (`50.75° N, 0.95° E` à `51.25° N, 1.95° E`) et la vue initiale (centre `51.00° N, 1.45° E`, zoom `10`).
- Donner au conteneur une hauteur explicite et charger le CSS Leaflet pour que la carte occupe toute la zone disponible.
- Veiller à ce que l’ouverture directe, l’actualisation et le redimensionnement de la fenêtre réaffichent correctement la carte, sans ajouter de comportement pour les données réelles.

À ne pas faire :
ne pas ajouter une deuxième bibliothèque cartographique ;
ne pas ajouter d’autres régions ;
ne pas mettre en place de fonctionnement hors ligne pour la carte.

**Vérification de fin :** ouvrir directement `http://localhost:3000`, actualiser la page et redimensionner la fenêtre : la carte reste visible et exploitable, avec les tuiles et l’attribution OSM ; carte centrée sur le détroit de Douvres avec le zoom prévu ;
déplacement et zoom manuels possibles ;
redimensionnement de la fenêtre sans carte grise, chevauchement ou artefact ; `next build` se termine avec succès.

## B-03 — Un navire de démonstration et son icône
Objectif : afficher un premier navire de démonstration sur la carte.

Travail prévu :
- Définir la structure `Vessel` imposée par le sprint (`id`, `name`, `lat`, `lon`, `speedKnots`, `courseDeg`, `timestamp`, `source`) et utiliser `source: 'demo'`.
- Déclarer un seul navire littéral, identifié par `demo-1`, nommé « Демо-судно 1 » selon le libellé du sprint, positionné dans le rectangle du secteur, sans route ni animation.
- Afficher le navire sur la carte avec un marqueur portant `data-vessel-id="demo-1"` et `data-icon="course"` si le cap est connu, ou `data-icon="neutral"` s’il est nul.
- Orienter visuellement l’icône selon `courseDeg`; utiliser un cercle neutre lorsque le cap vaut `null`.
- Afficher en permanence la mention « Демонстрационные данные » à côté de la carte.

À ne pas faire :

ne pas créer les deux autres navires ;
ne pas ajouter de routes ou d’animation ;
ne pas connecter de source AIS réelle ;
ne pas remplacer null par zéro.

**Vérification de fin :** au chargement, le marqueur unique est visible à l’intérieur du secteur et son orientation correspond à son cap (ou son apparence est neutre si le cap vaut `null`) ; la mention « Демонстрационные данные » est lisible; la structure respecte les champs et les types définis dans le sprint.

## B-04 — Sélection et fiche au clic
Objectif : permettre au formateur de sélectionner le navire et d’afficher ses données.

Travail prévu :

- Faire ouvrir au clic la fiche du navire sélectionné et conserver la sélection après un second clic sur le même marqueur.
- Afficher les champs dans l’ordre et les formats convenus : identifiant, nom, coordonnées avec `toFixed(5)`, vitesse en nœuds, cap en degrés, heure du message en UTC et source.
- Rendre les valeurs inconnues sous la forme « Нет данных » ; conserver la distinction entre vitesse inconnue et vitesse `0`.
- Afficher le nom comme texte, jamais comme HTML interprété : le contrôle manuel utilise le nom littéral `<b>Демо</b>` et doit montrer ces caractères, sans mise en gras.
- Ne pas ajouter de bouton de fermeture, de sélection automatique d’un autre navire ni de logique de chargement de données.


À ne pas faire :
ne pas ajouter plusieurs navires ;
ne pas implémenter le mouvement ;
ne pas ajouter de bouton de chargement ;
ne pas préparer la logique de données réelles.

**Vérification de fin :** cliquer sur le marqueur ouvre une fiche correspondant exactement à `demo-1`; un second clic ne la ferme pas et ne la remplace pas ; les formats de coordonnées, vitesse, cap, heure et source sont conformes ; avec le nom de contrôle `<b>Демо</b>`, les balises restent visibles comme du texte.

## Contrôle de périmètre final

La démonstration attendue à la fin de B-01 à B-04 est : lancer l’application, voir la carte du détroit, voir un seul navire immobile, cliquer dessus et lire sa fiche. Toute fonctionnalité de plusieurs navires, de déplacement, de bouton, de données AISStream ou de tests est explicitement hors de ce plan.
