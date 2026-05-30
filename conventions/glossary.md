# Glossary Convention

Convention pour la creation et la maintenance du glossaire de projet.

## Quick Start

Convention definissant le format et les regles du fichier GLOSSARY.md present dans chaque projet.
Charger quand on cree ou modifie un glossaire, ou quand on audite la conformite documentaire d'un projet.
Ne couvre pas le contenu metier des termes — uniquement leur forme et leur organisation.

## Keywords
glossaire, glossary, terminologie, domaines, definitions, projet, conformite, audit

## Table des matieres

1. [Role du glossaire](#role-du-glossaire)
2. [Emplacement et reference](#emplacement-et-reference)
3. [Structure de GLOSSARY.md](#structure-de-glossarymd)
4. [Domaines](#domaines)
5. [Termes](#termes)
6. [References croisees](#references-croisees)
7. [Chargement par un AI Assistant](#chargement-par-un-ai-assistant)
8. [Conformite et audit](#conformite-et-audit)

---

## Role du glossaire
[up](#table-des-matieres)

Le glossaire definit les termes du projet — metier, techniques, conventions locales.

Il sert deux types de lecteurs :

**Humain** — comprendre rapidement ce que signifie un terme sans chercher dans tout le projet.

**AI Assistant** — aligner sa comprehension sur la terminologie du projet avant toute tache, eviter les malentendus semantiques.

Le glossaire ne remplace pas l'`## Index` de chaque fichier Markdown. Les deux sont complementaires :

| Element | Portee | Contenu |
|---------|--------|---------|
| `## Index` (dans un fichier) | Un seul fichier | Occurrences d'un terme dans ce fichier |
| `GLOSSARY.md` | Tout le projet | Definition partagee des termes |

---

## Emplacement et reference
[up](#table-des-matieres)

### Fichier glossaire

`GLOSSARY.md` est place a la racine du projet.

### Reference dans PROJECT.md

Tout `PROJECT.md` doit contenir une section `## Glossary` qui renvoie vers ce fichier :

```markdown
## Glossary

See `GLOSSARY.md` at project root.
```

L'absence de cette section dans `PROJECT.md` est une deviation a justifier lors de l'audit.

---

## Structure de GLOSSARY.md
[up](#table-des-matieres)

```markdown
# Glossary — [Nom du projet]

## Quick Start

Glossaire des termes cles du projet [Nom du projet].
Organise par domaines. Lire la description de chaque domaine pour determiner
sa pertinence avant de charger son contenu.

## Keywords
glossaire, [domaine-1], [domaine-2], ...

## [Domaine 1]

[Description informative du domaine — voir section Domaines]

### [Terme A]
**Definition :** ...
**Exemple :** ... (optionnel)
**Voir aussi :** ... (optionnel)

### [Terme B]
**Definition :** ...

## [Domaine 2]

[Description informative du domaine]

### [Terme C]
**Definition :** ...

## Index

| Terme | Occurrences |
|-------|-------------|

## Changelog

### Version 1.0 - Creation
**Date:** YYYY-MM-DD
**Raison:** Creation initiale du glossaire.
```

---

## Domaines
[up](#table-des-matieres)

### Definition

Un domaine est un regroupement thematique de termes. Chaque projet definit librement ses domaines selon sa nature.

### Description de domaine

Chaque section de domaine commence par une description informative de 2 a 4 lignes.

Cette description permet a un AI Assistant de determiner rapidement si le domaine est pertinent pour la tache en cours, sans charger tous les termes.

```markdown
## UI

Termes relatifs a l'interface utilisateur : composants visuels, interactions,
etats d'affichage, navigation. Pertinent pour toute tache touchant au rendu
ou au comportement des ecrans.
```

### Domaines suggeres

Liste non exhaustive — a adapter selon le projet :

| Domaine | Contenu typique |
|---------|----------------|
| `UI` | Composants visuels, interactions, etats d'affichage |
| `Data Model` | Entites, relations, structures de donnees |
| `Workflows` | Processus, etapes, transitions d'etat |
| `API` | Endpoints, parametres, codes de reponse |
| `Configuration` | Variables, environnements, parametres systeme |
| `Business Rules` | Regles metier, contraintes, cas limites |
| `Roles` | Acteurs, permissions, responsabilites |
| `Infrastructure` | Serveurs, deploiement, environnements |

---

## Termes
[up](#table-des-matieres)

### Format

```markdown
### [Terme]
**Definition :** Description claire et concise du terme dans le contexte du projet.
**Exemple :** (optionnel) Illustration concrete.
**Voir aussi :** (optionnel) Renvoi vers d'autres termes lies.
```

### Regles

- Un terme est defini dans son **domaine principal** uniquement
- La definition est specifique au projet — pas une definition generique
- Pas de jargon interne non defini dans la definition elle-meme

---

## References croisees
[up](#table-des-matieres)

Un terme peut appartenir a plusieurs domaines. Il est defini une seule fois dans son domaine principal. Les autres domaines y font reference :

```markdown
## Workflows

### Session
-> Voir [Data Model — Session](#session)
```

**Regle :** ne jamais dupliquer une definition. Une seule source de verite par terme.

---

## Chargement par un AI Assistant
[up](#table-des-matieres)

A l'ouverture d'une session, l'AI Assistant :

1. Charge `GLOSSARY.md` en entier
2. Lit la description de chaque domaine
3. Identifie les domaines pertinents pour la tache en cours
4. Charge le contenu des termes de ces domaines uniquement

Cette strategie evite de charger des termes non pertinents et optimise l'utilisation de la fenetre de contexte.

---

## Conformite et audit
[up](#table-des-matieres)

### Criteres de conformite

| Element | Conforme | Non-conforme |
|---------|----------|--------------|
| `PROJECT.md` contient `## Glossary` | oui | deviation a justifier |
| `GLOSSARY.md` existe a la racine | oui | deviation a justifier |
| Chaque domaine a une description | oui | deviation mineure |
| Chaque terme a une definition | oui | deviation mineure |
| Pas de duplication de definitions | oui | deviation mineure |
| References croisees coherentes | oui | deviation mineure |

### Deviations acceptables

- Projet trop simple pour necessiter un glossaire → documenter dans `DEVIATIONS.md`
- Glossaire vide en debut de projet → acceptable, a enrichir au fil des sessions

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.0 - Creation
**Date:** 2026-05-30
**Raison:** Nouvelle convention pour la gestion du glossaire de projet.

**Contenu initial :**
- Role du glossaire et distinction avec l'Index
- Emplacement : GLOSSARY.md a la racine, reference dans PROJECT.md
- Structure complete de GLOSSARY.md
- Concept de domaines avec description informative
- Liste de domaines suggeres
- Format des termes
- References croisees pour termes multi-domaines
- Strategie de chargement par un AI Assistant
- Criteres de conformite et audit
