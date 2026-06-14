# Project Ideas Inbox

Cross-project idea inbox — ideas posted from any project for any other project, pending triage.

*Document type: Log*

## Quick Start

Shared inbox for cross-project ideas.
Post an idea here when working in one project and thinking of something for another.
Triage is done on demand in the target project — read entries for your tag, promote to TODO or discard, then delete the line.
See `conventions/project-registry.md` for posting format and triage rules.

## Keywords
inbox, ideas, cross-project, triage, posting

## Ideas
- `guide-ia` | Principe ceinture et bretelles — quand deux mécanismes de sécurité se renforcent mutuellement, les deux valent mieux qu'un seul. Exemple : un header dans le code source qui pointe vers ce qu'il faut lire (A) + un trigger dans le Decision Layer qui charge la même règle au moment où la tâche est formulée (B). Ni l'un ni l'autre seul n'est suffisant — l'un peut être sauté, l'autre peut ne pas être lu. Les deux ensemble ferment la brèche. [effort: XS] [date: 2026-06-14]

- `kb-maintenance/conventions` | Mettre à jour la description de `filesystem.md` dans `INDEX.md` — refléter l'ajout de la règle "large file generation via container + download" (keywords `download`, `present_files`, `large-files`). [effort: XS] [date: 2026-06-06]
- `kb-maintenance/conventions` | Nouvelle convention : "Artefact + outil de maintenance co-généré" — pattern à formaliser. Idée centrale : tout artefact volumineux à structure connue (HTML, JSON, Markdown long) devrait être accompagné dès sa création d'un outil de maintenance dédié (script Node.js ou Python) qui expose des opérations structurées sur ses sections : lire un bout, écrire un bout, lister des éléments. Claude invoque l'outil via `commands` MCP (zéro tokens), jamais le fichier brut. Analogie : c'est un "MCP local co-généré" — même philosophie qu'un vrai MCP (interface structurée, pas d'accès aux entrailles), mais spécifique à l'artefact, vivant dans le projet, sans serveur. Exemple existant dans guideIA : `guide-parser.js` + `plan-editor.html` jouent ce rôle pour `Plan.md` et `GuideIA.md`. Questions à trancher en session : nommage du pattern, structure minimale d'un outil de maintenance (interface CLI standard ?), quand le co-générer (toujours ? seulement au-delà d'un seuil ?), lien avec `conventions/tools.md` et `conventions/artifact.md`. [effort: M] [date: 2026-06-06]
- `kb-maintenance/conventions` | Convention méthodes de dev : tests (vitest) et logs (pino) — outillage standard pour tous les projets Node.js. Consolide les deux idées séparées (2026-06-08) en une seule convention : quand utiliser vitest, structure des tests, config globale ; quand logger, niveaux, format structuré JSON avec pino. [effort: S] [date: 2026-06-11]
- `kb-maintenance/conventions` | Droit à l'oubli — convention pour nettoyer les concepts périmés : critères d'obsolescence, workflow de suppression, pattern d'isolation anticipée (marquer un concept comme "candidat à la suppression" avant de le retirer). Motivé par la session FAL 2026-06-11. [effort: S] [date: 2026-06-11]
- `forge` | Handler .yaml/.yml — format natif Forge pour les fichiers YAML. Parser minimaliste key:value déjà en place dans md-extension-handler, à extraire et généraliser. [effort: S] [date: 2026-06-11]
- `kb-maintenance/conventions` | Bonnes pratiques pour une liste de gaps — même contenu que l'idée guide-ia. Extension : appliquer cette méthode dans les déviations d'audit — chaque déviation est traitée comme un gap, la liste est nettoyée (redondances, dépendances, ordre) avant de lancer les corrections. [effort: S] [date: 2026-06-10]
- `kb-maintenance` | Créer un viewer/explorateur de la registry des projets (`projects.md`) — outil HTML ou Node.js permettant de naviguer dans les projets enregistrés, leurs conventions, et leurs dépendances. [effort: M] [date: 2026-06-06]
- `kb-maintenance` | Bonne pratique : pas de référence en avant dans les conventions KB — chaque section ne doit utiliser que des concepts déjà introduits dans le document. [effort: XS] [date: 2026-06-10]
- `kb-maintenance` | Pattern mot-clé pour référencer un concept déjà défini — documenter le pattern dans best-practices.md ou glossary.md : un mot-clé stable évoque un concept sans le répéter, raccourcit les échanges, définit un contexte partagé. [effort: S] [date: 2026-06-10]
- `guide-ia` | Ajouter l'effet Streisand comme exemple de bonne pratique dans la rédaction de prompts et instructions — mentionner explicitement ce qu'on veut éviter attire l'attention dessus. [effort: XS] [date: 2026-06-10]
- `guide-ia` | Bonne pratique : pas de référence en avant dans la documentation — un document ne devrait pas mentionner un concept qui n'a pas encore été introduit (comme au Rugby : pas de passe en avant). Rend la lecture linéaire et autonome. [effort: XS] [date: 2026-06-10]
- `guide-ia` | La session comme source de connaissance — une conversation riche produit des décisions, trouvailles, formulations qui disparaissent si on ne les extrait pas. Bonne pratique : en fin de session, balayer la conversation et capturer l'essentiel (TODO, changelog, convention). Voir KB : `guides/how-to-get-things-done.md` Phase 3 Closure + "If it is not written it does not exist". [effort: S] [date: 2026-06-10]
- `guide-ia` | Pattern mot-clé pour référencer un concept déjà défini — utiliser un mot-clé ou une expression courte et stable pour évoquer un concept sans le re-définir. Permet des conversations courtes et précises : énoncer le mot-clé pose le contexte immédiatement. [effort: S] [date: 2026-06-10]
- `guide-ia` | Bonnes pratiques pour une liste de gaps : (1) vérifier que chaque gap est indépendant — pas de redondance, pas de symptôme confondu avec sa cause ; (2) identifier les dépendances entre gaps — un gap qui en implique un autre n'est pas indépendant ; (3) ordonner par dépendance d'abord, importance ensuite — les gaps fondateurs en tête. Motivé par la session forge.md gap detection 2026-06-10. [effort: S] [date: 2026-06-10]
- `guide-ia` | Métaphore "Un jour sans fin" (Groundhog Day) — l'IA repart à zéro à chaque session, comme le personnage qui revit la même journée. Cette contrainte devient un avantage : on peut affiner sa méthode de travail par essais/erreurs sans conséquences cumulatives pour l'IA. Chaque session est une répétition où l'humain progresse et capitalise (conventions, TODO, WIP) pendant que l'IA reste fraîche. Bonne pratique : traiter chaque session comme une itération délibérée — tester une approche, observer, ajuster la convention ou le prompt, recommencer. [effort: S] [date: 2026-06-11]
- `guide-ia` | Droit à l'oubli — quand et comment retirer un concept périmé de la documentation d'un projet IA : signaux d'obsolescence, isolation préventive, nettoyage en session dédiée. [effort: S] [date: 2026-06-11]

## Changelog

### Version 2.4 - Principe ceinture et bretelles pour GuideIA
**Date:** 2026-06-14
**Reason:** Principe identifié en session KB — deux mécanismes de sécurité complémentaires valent mieux qu'un seul.

**Modifications:**
- Ideas: entrée `guide-ia` ajoutée

---

### Version 2.3 - Droit à l'oubli — kb-maintenance + guide-ia
**Date:** 2026-06-11
**Reason:** Idée postée depuis la session KB — nettoyage des concepts périmés (motivé par la suppression de FAL).

**Modifications:**
- Ideas: 2 entrées ajoutées — `kb-maintenance/conventions` et `guide-ia`

---

### Version 2.2 - Convention méthodes de dev (vitest + pino)
**Date:** 2026-06-11
**Reason:** Consolide les deux idées séparées vitest/logs (2026-06-08) en une seule convention. Les deux entrées originales supprimées.

---

### Version 2.1 - Groundhog Day metaphor for GuideIA
**Date:** 2026-06-11
**Reason:** Métaphore "Un jour sans fin" — l'IA repart à zéro à chaque session comme avantage pour affiner la méthode de travail.

---

### Version 2.0 - gap list best practices
**Date:** 2026-06-10
**Reason:** Best practices for gap lists identified during forge.md gap detection session — posted to guide-ia and kb-maintenance.

---

### Version 1.9 - session as knowledge source
**Date:** 2026-06-10
**Reason:** Extraire l'essentiel d'une session riche — pour GuideIA, avec référence au GTD KB.

---

### Version 1.8 - keyword pattern idea
**Date:** 2026-06-10
**Reason:** Pattern mot-clé pour référencer un concept déjà défini — pour GuideIA et KB.

---

### Version 1.7 - 2 ideas no-forward-reference
**Date:** 2026-06-10
**Reason:** Bonne pratique pas de référence en avant — pour GuideIA et KB.

---

### Version 1.6 - Idea for GuideIA
**Date:** 2026-06-10
**Reason:** Streisand Effect — bon pratique rédaction prompts/instructions.

---

### Version 1.5 - 2 ideas from KB session 2026-06-08
**Date:** 2026-06-08
**Reason:** Deux conventions identifiées pendant la session de conversion des tests Forge en Vitest : tests-vitest.md et logs.md.

### Version 1.4 - Idea from GuideIA — artefact + outil de maintenance co-généré
**Date:** 2026-06-06
**Reason:** Pattern discovered during GuideIA session — large artefacts should be paired with a co-generated maintenance tool acting as a local MCP. Enough context to run a dedicated KB session.

### Version 1.3 - Idea from GuideIA — filesystem.md INDEX update
**Date:** 2026-06-06
**Reason:** Idea posted from GuideIA session — INDEX.md description of filesystem.md to be updated after v1.1 addition.

### Version 1.2 - Idea from GuideIA
**Date:** 2026-06-06
**Reason:** Idea posted from GuideIA session — project registry viewer.

### Version 1.1 - Triage kb-maintenance 2026-06-06
**Date:** 2026-06-06
**Reason:** 3 ideas for kb-maintenance triaged — all promoted to TODO.md.

---

### Version 1.0 - Creation
**Date:** 2026-06-06
**Reason:** Initial cross-project idea inbox — bootstrapped with first idea for KB Maintenance.
