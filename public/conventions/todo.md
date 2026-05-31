# Todo Convention

Convention pour le backlog leger de tout projet — idees, ameliorations, taches a faire.

## Quick Start

Ce document definit comment structurer et utiliser un backlog leger dans un projet.
Charger quand on cree ou manipule un fichier `TODO.md`, ou quand un AI Assistant doit ajouter des items pendant une session.
Ne couvre pas la gestion de bugs, tests, ou taches de developpement.

## Keywords
todo, backlog, taches, idees, suivi, priorite, session, archivage

## Table des matieres

1. [Perimetre](#perimetre)
2. [Fonctionnalites](#fonctionnalites)
3. [Fichiers](#fichiers)
4. [Format](#format)

---

## Perimetre
[up](#table-des-matieres)

La todo list est un **backlog leger** — elle capture les idees et taches a faire d'un projet.

**Dans le perimetre :**
- Idees d'amelioration
- Taches identifiees pendant une session ou un audit
- Fonctionnalites a explorer

**Hors perimetre :**
- Bugs et corrections techniques
- Taches de developpement et tests
- Gestion de projet detaillee

---

## Fonctionnalites
[up](#table-des-matieres)

- **Capture** — ajouter un item a tout moment pendant une session
- **Priorite** — haute / normale / basse
- **Etat** — ouvert / en cours / termine
- **Archivage** — les items termines sont deplaces dans `TODO-archive.md`, jamais supprimes

### Rolle de l'AI Assistant

Un AI Assistant ne peut modifier `TODO.md` ou `TODO-archive.md` qu'avec **accord explicite** de l'utilisateur.

Cela inclut : ajouter, modifier, deplacer, ou archiver un item.

---

## Fichiers
[up](#table-des-matieres)

Deux fichiers a la racine du projet :

- **`TODO.md`** — items actifs (ouverts et en cours)
- **`TODO-archive.md`** — items termines (historique)

Quand un item passe a l'etat termine, il est deplace de `TODO.md` vers `TODO-archive.md`.

---

## Format
[up](#table-des-matieres)

### TODO.md

```markdown
# TODO

## Haute priorite

- [ ] Description de la tache
- [ ] [WIP] Description de la tache en cours

## Normale

- [ ] Description de la tache
- [ ] [WIP] Description de la tache en cours

## Basse priorite

- [ ] Description de la tache
```

**Etats :**
- `- [ ]` — ouvert
- `- [ ] [WIP]` — en cours
- `- [x]` — termine (a deplacer dans `TODO-archive.md`)

### TODO-archive.md

```markdown
# TODO Archive

## YYYY-MM

- [x] Description de la tache terminee
- [x] Description de la tache terminee
```

Les items archives sont groupes par mois de completion.

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.0 - Creation
**Date:** 2026-05-30
**Raison:** Convention pour le backlog leger de tout projet. Capture idees et taches, distinct de la gestion de bugs et developpement.

**Contenu initial :**
- Perimetre : backlog leger, hors bugs et dev
- Fonctionnalites : capture, priorite, etat, archivage
- Fichiers : TODO.md (actifs) + TODO-archive.md (termines)
- Format : sections par priorite, archive par mois
