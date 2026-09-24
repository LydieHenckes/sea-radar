// после prompt20.md

Преобразователь добавлен в lib/ais/position-report.ts.

Что реализовано:

фактическая вложенность MetaData и Message.PositionReport;
преобразование всех полей структуры Vessel;
MMSI преобразуется в строку;
ShipName обрезается через trim(), пустое значение становится null;
координаты берутся из Message.PositionReport.Latitude/Longitude;
специальный разбор формата time_utc с наносекундами и +0000 UTC;
результат timestamp нормализуется до ISO с миллисекундами;
невалидная позиция возвращает null;
Sog и Cog становятся null при недопустимых значениях;
поле source получает значение "aisstream".
Временный скрипт добавлен в scripts/check-parser.ts. Он содержит только чтение sample, вызов преобразователя и вывод. Endpoint, сбор нескольких сообщений и интерфейс не изменялись.

Запуск npx tsc --noEmit прошёл успешно.

Вывод скрипта:


id: "304080000" (source: 304080000)
name: "AURORA" (source: "AURORA")
lat: 50.976058333333334 (source: 50.976058333333334)
lon: 1.2810866666666667 (source: 1.2810866666666667)
speedKnots: 13.6 (source: 13.6)
courseDeg: 228.2 (source: 228.2)
timestamp: "2026-09-17T19:14:15.226Z" (source: "2026-09-17 19:14:15.226348336 +0000 UTC")
source: "aisstream" (source: derived from converter)
Временный скрипт оставлен в рабочем дереве как неотслеживаемый файл, чтобы его можно было использовать для ручной проверки и не включать в коммит.

// команда чтобы проверить в терминале
// rm -rf .tmp-check && npx tsc scripts/check-parser.ts lib/ais/position-report.ts --target ES2022 --module commonjs --moduleResolution node --esModuleInterop --skipLibCheck --outDir .tmp-check && node .tmp-check/scripts/check-parser.js

//Puis, après vérification, supprime la compilation temporaire :
//rm -rf .tmp-check


// после prompt21.md
B-12 est implémentée.

Modifications
Nouveau collector injectable : lib/ais/collector.ts

fenêtre configurable de 15 secondes ;
limite configurable de 100 navires ;
source et horloge injectables ;
déduplication par id et timestamp à la milliseconde ;
conservation du premier message en cas d’égalité ;
remplacement de l’objet Vessel complet si le message est plus récent ;
succès vide avec reason: "window_elapsed" ;
succès de limite avec reason: "limit_reached" et truncated: true ;
finalisation et nettoyage idempotents ;
aucun résultat partiel après erreur, disconnect ou annulation.
Adaptateur AISStream : lib/ais/aisstream-source.ts

WebSocket distinct pour chaque requête ;
subscription après ouverture ;
gestion des messages texte et binaires ;
détection des erreurs fournisseur ;
fermeture et événements de connexion.
Route réduite à l’adaptation HTTP : app/api/snapshot/route.ts

HTTP 200 avec vessels, collectedAt, windowSeconds, count, truncated, reason ;
HTTP 502 avec les codes et messages existants ;
clé conservée côté serveur ;
aucune modification de l’interface.
Vérifications
npx tsc --noEmit : réussi.

npm run build : réussi. La route /api/snapshot est bien générée.

Requête live exécutée avec succès. Résultat :


count: 3
reason: window_elapsed
truncated: false
Un élément complet de vessels :


{
  "id": "255806481",
  "name": "INDEPENDENT QUEST",
  "lat": 51.16269833333333,
  "lon": 1.9186866666666667,
  "speedKnots": 7.3,
  "courseDeg": 58.7,
  "timestamp": "2026-09-21T16:53:29.155Z",
  "source": "aisstream"
}
Aucun test automatisé n’a été ajouté, conformément aux limites de B-12. Les composants de carte et l’interface n’ont pas été modifiés.