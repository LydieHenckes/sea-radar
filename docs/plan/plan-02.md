# Plan R1 — tâches B-05 à B-07

## Contexte

Ce plan couvre uniquement le second incrément de `SPRINT-01.md` : trois navires de démonstration avec des routes locales, leur progression et leur arrêt en fin de route, puis les tests de sélection avec Playwright. Il respecte l’ordre demandé : données, mouvement, tests.

L’interface existante de B-01 à B-04 est acceptée et ne doit pas être réécrite. Aucune donnée réelle, aucun serveur, bouton de chargement, pause, rembobinage, bouclage ou fonctionnalité d’un sprint ultérieur ne doit être ajouté.

## B-05 — Trois navires avec routes

Objectif : remplacer le navire de démonstration unique par trois navires munis de routes locales littérales.

Travail prévu :

- Étendre le modèle dans `types/vessel.ts` avec un type explicite de point de route `{ lat, lon }` et une route associée aux données de démonstration, en conservant les champs déjà utilisés par `VesselCard`.
- Dans `fixture/map-config.ts`, conserver `MAP_CONFIG` comme source des limites et remplacer la liste unique par exactement `demo-1`, `demo-2` et `demo-3`.
- Définir pour chaque navire une route littérale composée de 8 à 12 points. Tous les points doivent se trouver dans le rectangle `50.75° N, 0.95° E` à `51.25° N, 1.95° E`.
- Définir la vitesse de chaque navire comme une valeur littérale en nœuds, sans calcul ni génération de route.
- Initialiser `lat` et `lon` sur le premier point de la route ; conserver `source: "demo"` et les noms « Демо-судно 1 » à « Демо-судно 3 ».
- Garder les champs d’affichage existants : identifiant, nom, position, vitesse, cap, horodatage et source.

À ne pas faire :

- ne pas ajouter de quatrième navire ;
- ne pas utiliser de données réelles ou de source AISStream ;
- ne pas calculer, interpoler ou générer les points de route ;
- ne pas ajouter de bouton, de pause, de rembobinage ou de boucle ;
- ne pas planifier de tâche des futurs sprints.

**Vérification de fin :** les types sont valides ; la fixture contient exactement les trois identifiants attendus ; chaque route contient 8 à 12 points littéraux ; chaque point respecte `MAP_CONFIG.bounds` ; les trois marqueurs sont visibles dans le secteur.

## B-06 — Mouvement et arrêt

Objectif : faire progresser les trois navires avec un seul tick commun, mettre à jour la carte et la fiche depuis le même état, puis immobiliser chaque navire à son dernier point.

Travail prévu :

- Faire porter l’état courant de toute la flotte par un seul endroit, de préférence `components/MapScreen.tsx`, afin que la carte et `VesselCard` lisent les mêmes valeurs mises à jour.
- Conserver la sélection par identifiant, ou la resynchroniser par identifiant, pour que la fiche sélectionnée ne reste pas figée sur l’objet initial lorsque le navire se déplace.
- Dans `app/map.tsx`, conserver l’intégration Leaflet existante et réutiliser `MAP_CONFIG`, `DEMO_VESSELS` et `createVesselIcon` depuis `components/VesselMarker.tsx`.
- Installer un seul `setInterval` avec `DEMO_TICK_MS = 2000` millisecondes. Chaque tick doit avancer tous les navires encore en mouvement d’un point de leur route.
- Calculer le cap comme l’azimut géographique du segment : au démarrage, du premier point vers le deuxième ; ensuite, du point précédent vers le point courant. Normaliser le résultat dans `[0, 360)`.
- Mettre à jour ensemble la position, le cap et l’horodatage avec l’heure réelle du navigateur. L’horodatage initial doit correspondre au démarrage du timer.
- Au tick où un navire atteint le dernier point, mettre sa vitesse à `0` dans la même mise à jour. Après ce tick, le navire doit rester sur le dernier point et ne plus changer.
- Mettre à jour les marqueurs Leaflet depuis l’état courant, notamment leur position et leur icône, sans recréer inutilement la carte.
- Nettoyer l’intervalle, les écouteurs et les ressources Leaflet au démontage. Stabiliser les dépendances des effets pour qu’un rerender ou un hot reload n’accumule pas plusieurs timers.

À ne pas faire :

- ne pas ajouter plusieurs timers par navire ;
- ne pas déplacer les navires par interpolation ou à une fréquence différente de 2000 ms ;
- ne pas boucler au début de la route ;
- ne pas ajouter de pause, de rembobinage ou de contrôle utilisateur ;
- ne pas automatiser le contrôle du temps et du mouvement dans B-07.

**Vérification de fin :** effectuer une vérification visuelle : les navires avancent toutes les deux secondes, le cap change selon les segments, la fiche du navire sélectionné suit le même état que la carte, puis le dernier tick affiche le dernier point avec `0 уз`. Après hot reload, vérifier dans la console qu’un seul tick est produit par intervalle. Vérifier également que le timer est nettoyé en quittant la page.

## B-07 — Runner et tests de sélection

Objectif : ajouter Playwright Test comme unique runner et automatiser uniquement les comportements de présence et de sélection prévus par le sprint.

Travail prévu :

- Ajouter `@playwright/test` dans `package.json` et ne pas introduire Jest, Vitest ou un autre framework de test.
- Créer `playwright.config.ts` avec un seul projet navigateur.
- Configurer `webServer` pour lancer `npm run dev` sur l’URL loopback `http://localhost:3000`.
- Ajouter un spec Playwright dédié à la sélection.
- Bloquer dans le test les requêtes vers les tuiles OpenStreetMap afin d’éviter une dépendance au réseau.
- Vérifier que la page contient trois éléments ciblés par `[data-vessel-id]`.
- Cliquer sur un navire ciblé par `[data-vessel-id]` et vérifier que la fiche ouverte porte son identifiant.
- Cliquer une seconde fois sur le même navire et vérifier que la fiche reste ouverte.
- Utiliser exclusivement l’attribut `[data-vessel-id]` pour cibler les navires, conformément au contrat de test.

À ne pas faire :

- ne pas tester automatiquement le mouvement, le temps ou l’arrêt final ;
- ne pas laisser les tests télécharger ou requérir les tuiles OSM ;
- ne pas ajouter de second navigateur ou de second runner ;
- ne pas ajouter de tests pour des fonctionnalités hors de B-07.

**Vérification de fin :** exécuter `npx playwright test` et obtenir des tests verts pour la présence des trois navires, le clic et le second clic. Confirmer séparément que le blocage des tuiles fonctionne et distinguer les résultats automatisés des contrôles visuels manuels de B-06.

## Fichiers concernés

- `types/vessel.ts` — type du point de route et données nécessaires au mouvement ;
- `fixture/map-config.ts` — limites existantes et trois fixtures littérales ;
- `components/MapScreen.tsx` — état commun de la flotte et sélection réactive ;
- `app/map.tsx` — intégration Leaflet, mise à jour des marqueurs et timer unique ;
- `components/VesselMarker.tsx` — réutilisation de `createVesselIcon` et des attributs de test ;
- `package.json` — dépendance et scripts Playwright si nécessaire ;
- `playwright.config.ts` — configuration du serveur et du navigateur unique ;
- un spec Playwright dédié — tests de présence et de sélection.

## Contrôle de périmètre final

La démonstration attendue après B-05 à B-07 est : lancer l’application, voir trois navires de démonstration dans le détroit de Douvres, observer leur progression toutes les deux secondes et leur arrêt respectif au dernier point, puis sélectionner un navire et voir sa fiche se mettre à jour. Les tests Playwright couvrent uniquement la présence et la sélection ; le mouvement reste vérifié visuellement cette semaine.
