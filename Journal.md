# Journal

*Document type: Log*

## Sessions

- [Session 2026-06-05 — Guide editor-tool](#session-2026-06-05--guide-editor-tool)

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
