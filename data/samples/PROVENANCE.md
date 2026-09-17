# Provenance de l’échantillon AIS

- **Temps de réception UTC :** 2026-09-17 19:14:16.676 UTC (réponse HTTP locale reçue après la connexion AISStream).
- **Zone de souscription :** détroit de Douvres, bounding box `[[50.75, 0.95], [51.25, 1.95]]`.
- **Source vivante :** oui. Le message a été reçu depuis la connexion WebSocket AISStream exécutée par le Route Handler local `GET /api/snapshot`, avec la clé configurée côté serveur. Il ne s’agit pas d’un exemple synthétique ni d’un message copié depuis la documentation.
- **Structure et différences avec la documentation AISStream :** le message conserve la structure reçue, sans renommage ni normalisation. Il contient l’enveloppe `MetaData` / `MessageType` / `Message.PositionReport` décrite dans la documentation. La réponse réelle contient aussi `MetaData.MMSI_String`, tandis que la documentation consultée met surtout en avant `MMSI`, `ShipName`, la latitude, la longitude et le temps UTC. La structure réelle contient également les champs détaillés du modèle AIS dans `Message.PositionReport`, notamment `UserID`, `Valid`, `Sog`, `Cog`, `TrueHeading`, `Timestamp`, `Raim` et `CommunicationState`. Le champ réel `MetaData.time_utc` utilise neuf chiffres de fraction de seconde et le suffixe `+0000 UTC`, format plus précis que les exemples génériques de la documentation.

Aucune conversion vers la structure `Vessel` n’a été effectuée.
