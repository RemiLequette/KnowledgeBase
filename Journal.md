# Journal

*Document type: Log*

## Sessions

- [Session 2026-06-07 — Forge node/block model](#session-2026-06-07--forge-nodeblock-model)
- [Session 2026-06-05 — Guide editor-tool](#session-2026-06-05--guide-editor-tool)

---

## Session 2026-06-07 — Forge node/block model

### Objectif

Refactoring conceptuel et implémentation du modèle node/block dans Forge — écriture dans les feuilles seulement, vocabulaire unifié, API cohérente.

### Décisions

- **Leaf-only write** : `writeBlock` lève une erreur si le bloc cible a une child grammar (node). Implémenté dans `structured-text.js` v3.2.
- **Vocabulaire node/block** : dans un artifact, les unités structurelles sont des **nodes** (contiennent des enfants, pas de données) et les unités de données sont des **blocks** (contiennent du texte, pas d'enfants). Miroir de la distinction dossier/artifact au niveau filesystem.
- **Ordre significatif** : l'ordre des enfants dans un node est significatif et préservé — contrairement à l'ordre des dossiers dans le filesystem.
- **`forge_ls` unifié** : même outil à tous les niveaux (racines, dossiers, nodes intra-artifact). `forge_listblocks` supprimé.
- **`forge_is_block`** : teste si une cible est un block (inscriptible) ou un node, via FAL fragment.
- **`forge_delete`** : supprime un artifact (FAL sans fragment) ou un node/block (FAL avec fragment). `forge_delete_block` et `forge_delete` artifact fusionnés.
- **`forge_insert`** : déclare explicitement `type: "node"|"block"` à la création. Position par index (0 = en tête, omis = en queue). Pas de flag firstChild/after.
- **`ls()` handler method** : `listBlocks` renommé `ls`, retourne `{ name, type }[]` en ordre.

### Fichiers modifiés

- `public/tools/forge/handlers/structured-text.js` — v3.1 → v3.3 : leaf-only guard, `ls()`, `isBlock()`
- `public/tools/forge/src/type-registry.js` — `ls()`, `isBlock()`, `deleteArtifact()`, `deleteBlock()`
- `public/tools/forge/src/mcp-tools.js` — `forge_ls` unifié, `forge_is_block`, `forge_delete`, `forge_listblocks` supprimé
- `public/conventions/forge.md` — v7.3 → v7.5 : node/block vocabulaire, contrats mis à jour
- `public/guides/working-with-forge.md` — v1.3 → v1.4 : nouveaux outils documentés

---

## Session 2026-06-05 — Guide editor-tool

### Objectif

Créer `public/guides/editor-tool.md` — guide pour construire des outils HTML de type viewer/editor sur des ressources locales. Extraire les patterns communs de deux exemples existants : `todo-tool` (KB) et `plan-editor` (guideIA).

### Décisions

- **Périmètre** : guide technique avec cadrage éditorial (Why) + vocabulaire canonique (What) + infrastructure recommandée (How). WWH obligatoires.
- **Nom du fichier** : `editor-tool.md` dans `public/guides/`.
- **Viewer vs Editor** : distinction explicite dès le Why — un viewer a une valeur propre indépendante de l'édition. Un editor = viewer + modèle de révision. Certains editors exposent un mode read-only.
- **Resource** plutôt que "file" — le pattern s'applique aux fichiers texte, fichiers binaires, bases de données (SQLite), APIs. Le local server est recommandé pour les fichiers desktop ; les MCPs pour le cloud.
- **Modèle de révision** documenté comme concept transactionnel : working file, Save explicite, Discard, Refresh, visibilité des modifications en cours, log contrôlé à la sauvegarde.
- **Refresh** ajouté au vocabulaire What — distinct de Discard : rechargement explicite depuis le backend quand la source a pu être modifiée externement.
- **Reco working file** : `tmp/` par défaut (gitignored, éphémère) ; au niveau de la source si le travail en cours mérite d'être commité.
- **Collaboration IA** : le viewer apporte de la fiabilité que l'IA seule ne peut pas garantir — même pour des questions factuelles simples, l'IA peut halluciner sur un fichier long.
- **Documentation obligatoire avant le code** : ajouté dans "Writing the Why" — le spec est la base du développement et le manuel utilisateur.

### Fichiers modifiés

- `public/guides/editor-tool.md` — créé (v1.0 → v1.4)
- `Journal.md` — créé
