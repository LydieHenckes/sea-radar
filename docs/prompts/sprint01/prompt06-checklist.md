1
Составь чек-лист ручной проверки того, что мы сделали: прямое открытие страницы, обновление, перемещение и масштабирование карты, видимость атрибуции, изменение размера окна, клик по судну, повторный клик, соответствие карточки судну, отображение имени с HTML-тегами как текста.

Только список действий и ожидаемых результатов. Код не меняй, ничего не запускай.

<!---
 Открыть http://localhost:3000 напрямую в браузере.

Résultat attendu : la page s’ouvre sans erreur et affiche la carte du détroit de Douvres.

 Actualiser la page.

Résultat attendu : la carte se recharge correctement, conserve son affichage et ne devient pas grise ou vide.

 Déplacer la carte avec la souris.

Résultat attendu : la carte se déplace manuellement sans casser l’affichage.

 Modifier le niveau de zoom avec les boutons ou la molette.

Résultat attendu : la carte effectue correctement un zoom avant et arrière.

 Vérifier la zone inférieure ou supérieure de la carte.

Résultat attendu : l’attribution © OpenStreetMap contributors reste visible en permanence.

 Redimensionner la fenêtre du navigateur, notamment en la réduisant puis en l’agrandissant.

Résultat attendu : la carte s’adapte à la nouvelle taille sans zone grise, chevauchement ni artefact.

 Repérer le marqueur du navire de démonstration dans la zone cartographique.

Résultat attendu : le navire est visible à l’intérieur du détroit et son icône est orientée selon son cap.

 Cliquer une fois sur le marqueur du navire.

Résultat attendu : la fiche du navire apparaît dans le panneau latéral.

 Vérifier les données de la fiche après le premier clic.

Résultat attendu : la fiche correspond au navire sélectionné et affiche son identifiant, son nom, ses coordonnées, sa vitesse, son cap, l’heure du message et sa source.

 Cliquer une seconde fois sur le même navire.

Résultat attendu : la fiche reste ouverte et le choix du navire ne change pas.

 Cliquer sur une zone libre de la carte, en dehors du marqueur.

Résultat attendu : la fiche reste affichée et la sélection n’est pas modifiée.

 Comparer l’identifiant affiché dans la fiche avec le navire sélectionné.

Résultat attendu : l’identifiant de la fiche correspond exactement à celui du navire cliqué.

 Vérifier le format des coordonnées affichées.

Résultat attendu : les latitude et longitude comportent exactement cinq chiffres après la virgule, y compris les zéros finaux.

 Vérifier le format de la vitesse affichée.

Résultat attendu : la vitesse est affichée en nœuds, arrondie à une décimale au maximum, sans zéros finaux inutiles.

 Vérifier le format du cap affiché.

Résultat attendu : le cap est arrondi et suivi du symbole °.

 Vérifier le format de l’heure affichée.

Résultat attendu : l’heure est affichée au format HH:mm:ss UTC.

 Examiner le nom du navire dans la fiche.

Résultat attendu : le nom est affiché comme texte et aucun contenu éventuel ressemblant à une balise HTML n’est interprété comme du HTML.


-->

2
Теперь отдельным списком: что в текущем состоянии проекта НЕ проверено.

Учитывай: автоматических тестов нет вообще, движения нет, внешних источников данных нет. Не предлагай это добавить — просто назови, что сейчас недоказано.

Код не меняй.
<!---
Aucun test automatique n’a été exécuté : il n’existe pas encore de tests automatisés dans le projet.
 Le déplacement des navires n’est pas vérifié : aucun mouvement n’est implémenté.
 L’arrêt du navire en fin de route n’est pas vérifié : il n’existe pas encore de route ni de minuterie.
 La mise à jour dynamique de la fiche pendant le déplacement n’est pas vérifiée.
 Le chargement de données réelles n’est pas vérifié : aucune source externe n’est connectée.
 Le fonctionnement avec AISStream n’est pas vérifié.
 Le comportement en cas d’absence de clé d’accès, de perte de connexion ou d’erreur de source externe n’est pas vérifié.
 L’affichage de plusieurs navires et la distinction entre plusieurs sélections ne sont pas vérifiés.
 La déduplication des navires et la sélection du message le plus récent ne sont pas vérifiées.
 La gestion des valeurs inconnues (null) pour la vitesse et le cap n’est pas vérifiée manuellement.
 La vérification de l’absence de secrets dans les fichiers transmis n’est pas effectuée ici.
 La compatibilité avec une installation sur un autre ordinateur n’est pas vérifiée.
-->