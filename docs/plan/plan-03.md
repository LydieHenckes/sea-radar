# Plan 03 — Vérification du checkpoint 02 et préparation AISStream

## Résultat de la vérification

### 1. Écarts entre `CHECKPOINT-02.md` et le dépôt

- Le checkpoint référence `src/config.ts` et `src/demo.ts`, mais le dépôt réel n’a pas de dossier `src/`.
  - Configuration réelle : `fixture/map-config.ts`
  - Animation des navires : `components/MapScreen.tsx`
  - Carte : `app/map.tsx`
  - Type `Vessel` : `types/vessel.ts`

- Le checkpoint annonce des routes de longueurs **10, 9 et 8**. Dans `fixture/map-config.ts`, les trois routes présentes contiennent actuellement **8 points chacune**.

- Le checkpoint indique que `npm test` ne contient pas `--pass-with-no-tests`. C’est contredit par `package.json`, où la commande est actuellement :

  `playwright test --pass-with-no-tests`

- Les trois tests décrits existent bien dans `tests/vessel-selection.spec.ts`. Ils vérifient :
  - la présence de trois navires ;
  - l’ouverture de la fiche de `demo-2` ;
  - la conservation de la fiche après un second clic.

- Le checkpoint indique que la connexion AISStream n’a pas été vérifiée. C’est cohérent avec l’état réel : il n’existe actuellement ni reader serveur, ni endpoint `/api/snapshot`, ni code AISStream dans l’arbre suivi.

- `CHECKPOINT-02.md` et `SPRINT-02.md` sont présents dans l’arbre de travail, mais ils ne figurent pas dans le commit `76f56b0` ni dans l’historique Git suivi au moment de la vérification. Le checkpoint mentionne donc une archive et un SHA qui ne sont pas vérifiables depuis l’historique courant.

- Le checkpoint affirme « отклонений нет », tout en signalant plusieurs questions ouvertes et des différences de structure de fichiers. Cette formulation est au minimum incomplète.

- Le checkpoint mentionne `test-results/` dans `.gitignore`, mais l’arbre Git actuel contient `test-results/.last-run.json` comme fichier suivi. Cela contredit l’idée que les résultats de test sont entièrement ignorés.

Les éléments suivants sont cohérents :

- `DEMO_TICK_MS` vaut bien `2000`.
- Trois navires `demo-1` à `demo-3` sont présents.
- La carte et la fiche utilisent bien le même modèle `Vessel`.
- Les tests de sélection sont bien au nombre de trois.
- Aucun code AISStream n’est encore présent.

## 2. AISStream

### Envoi de la subscription

La connexion doit être ouverte côté serveur sur :

`wss://stream.aisstream.io/v0/stream`

Après l’événement d’ouverture, le client doit envoyer rapidement un objet JSON complet, avec au minimum :

```json
{
  "APIKey": "<clé côté serveur>",
  "BoundingBoxes": [
    [
      [lat_sw, lon_sw],
      [lat_ne, lon_ne]
    ]
  ],
  "FilterMessageTypes": ["PositionReport"]
}
```

Dans le contrat de `SPRINT-02`, l’envoi doit avoir lieu immédiatement après l’ouverture. Le reader ne doit donc pas attendre un message de confirmation avant d’envoyer la subscription.

Une subscription valide peut ensuite produire un message `SubscriptionConfirmation`. Ce message confirme la subscription, mais il ne constitue pas le message de position recherché.

La documentation indique également que les messages entrants peuvent être reçus sous forme de trames binaires UTF-8. Le reader devra donc accepter au minimum :

- une chaîne JSON ;
- un `Buffer` ou équivalent binaire à décoder en UTF-8 ;
- puis appliquer `JSON.parse`.

### Structure d’un message `PositionReport`

L’enveloppe attendue est de cette forme :

```json
{
  "MessageType": "PositionReport",
  "MetaData": {
    "MMSI": 123456789,
    "ShipName": "EXAMPLE VESSEL",
    "time_utc": "2024-01-01 12:00:00.123456789 +0000 UTC",
    "latitude": 51.1,
    "longitude": 1.4
  },
  "Message": {
    "PositionReport": {
      "UserID": 123456789,
      "Valid": true,
      "Sog": 12.3,
      "Cog": 86.7,
      "TrueHeading": 87,
      "Latitude": 51.1,
      "Longitude": 1.4,
      "Timestamp": 42
    }
  }
}
```

Les champs utiles pour le futur modèle `Vessel` sont notamment :

- `MetaData.MMSI` → identifiant du navire ;
- `MetaData.ShipName` → nom ;
- `MetaData.time_utc` → temps de réception associé à l’événement selon le contrat du sprint ;
- `Message.PositionReport.Latitude` et `Longitude` → position ;
- `Sog` → vitesse ;
- `Cog` → course ;
- `TrueHeading` → cap vrai, distinct de `Cog` ;
- `Timestamp` → seconde AIS dans le message brut.

### `MetaData`

La documentation AISStream décrit `MetaData` comme le contexte normalisé du message. On y trouve notamment :

- `MMSI` ;
- `ShipName` ;
- `latitude` / `Latitude` ;
- `longitude` / `Longitude` ;
- `time_utc` dans le format utilisé par le contrat de ce sprint.

Le sprint demande de confirmer le registre exact des champs avec l’échantillon sauvegardé dans `data/samples/`. Il ne faut donc pas implémenter définitivement le convertisseur à partir de la seule documentation générique.

### Format du temps

Le champ `MetaData.time_utc` prévu par le sprint est une chaîne de la forme :

`2024-01-01 12:00:00.123456789 +0000 UTC`

Elle contient une date, une heure UTC, des fractions de seconde pouvant aller jusqu’à la nanoseconde et le suffixe `+0000 UTC`.

Le parseur ne doit pas supposer que `new Date(string)` acceptera directement ce format avec neuf chiffres de fraction. Il faudra normaliser explicitement la fraction à trois chiffres avant conversion en millisecondes, tout en comparant les timestamps avec la précision demandée par le sprint.

À ne pas confondre avec `Message.PositionReport.Timestamp`. Ce champ est une valeur AIS entière représentant la seconde UTC dans le message AIS. Il ne remplace pas `MetaData.time_utc` pour le tri chronologique demandé par `SPRINT-02`.

La documentation générique et le contrat du sprint ne présentent pas exactement le même niveau de détail sur `MetaData`. L’échantillon `position-report.sample.json` devra être considéré comme la source de vérité avant d’écrire le convertisseur.

## 3. Reader serveur minimal proposé

Le futur code devrait être séparé en trois niveaux :

1. un reader de transport ;
2. un convertisseur de message ;
3. le Route Handler `/api/snapshot`.

Le reader lui-même ne devrait pas connaître React, Leaflet, la carte ou la fiche.

### Dépendances injectées

Une frontière testable pourrait prendre conceptuellement les paramètres suivants :

```text
readSnapshot({
  connect,
  clock,
  subscription,
  windowMs,
  maxVessels
})
```

Avec :

- `connect(subscription)` : ouvre ou simule la connexion et expose les événements `open`, `message`, `error` et `close` ;
- `clock` : fournit `now()`, `setTimeout()` et `clearTimeout()`, avec remplacement par une fausse horloge dans les tests ;
- `windowMs` : `15_000` en production, valeur courte dans les tests ;
- `maxVessels` : `100` en production, valeur configurable dans les tests.

### Responsabilités du reader

Le reader devrait :

1. démarrer la fenêtre temporelle au début du traitement serveur ;
2. ouvrir la connexion ;
3. envoyer la subscription dès l’événement `open` ;
4. décoder les messages texte ou binaires ;
5. distinguer `SubscriptionConfirmation`, `PositionReport` et les erreurs de fournisseur ;
6. transmettre les messages de position au niveau supérieur ;
7. terminer une seule fois sur expiration, limite, erreur de connexion, fermeture inattendue ou annulation ;
8. fermer la connexion et supprimer le timer dans tous les cas.

Le nettoyage devrait passer par une fonction idempotente de type `finish`, afin qu’un événement tardif ne puisse pas modifier un résultat déjà finalisé.

En cas d’erreur après réception de messages, le reader ne doit pas transformer le sous-ensemble reçu en succès partiel. Il doit retourner une erreur complète, conformément au contrat de `SPRINT-02`.

### Tests à prévoir

Sans vraie connexion réseau, les tests pourraient fournir :

- une ouverture suivie immédiatement d’un message ;
- une connexion ouverte sans message jusqu’à l’expiration ;
- une erreur avant l’ouverture ;
- une fermeture après l’ouverture ;
- une annulation pendant la collecte ;
- un message binaire UTF-8 ;
- un événement tardif après la finalisation ;
- une seconde tentative de finalisation.

La fausse horloge permettrait de vérifier l’expiration de la fenêtre sans attendre réellement quinze secondes.

La conversion `PositionReport → Vessel`, la déduplication par `MMSI` et le Route Handler seraient testés séparément. Le reader minimal ne devrait pas encore intégrer ces règles métier, afin de garder une responsabilité claire.

Aucune modification n’a été apportée à la carte, aux navires, à la fiche ou aux tests existants.