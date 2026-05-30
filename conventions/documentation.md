# Documentation Convention

Rules for all Markdown files across all projects.

## Quick Start

1. Titres : alphanumerique + accents + tirets uniquement — pas d'emoji ni ponctuation speciale
2. Titres uniques dans le fichier — les doublons cassent les ancres
3. Structure : Quick Start → Keywords → TOC → contenu → Index → Changelog
4. TOC obligatoire si plus de 2 sections `##` de contenu — lien retour sous chaque titre
5. Index en fin de fichier — termes avec ancres HTML et pointeurs numerotes
6. Changelog apres l'Index

## Keywords
documentation, markdown, titres, ancres, TOC, index, keywords, changelog, quick-start, convention, navigation, VS-Code

## Table des matieres

1. [Titres](#titres)
2. [Langue](#langue)
3. [Numerotation](#numerotation)
4. [TOC](#toc)
5. [Regle Keywords](#regle-keywords)
6. [Regle Index](#regle-index)
7. [Regle Changelog](#regle-changelog)
8. [Regle Quick Start](#regle-quick-start)

---

## Titres
[up](#table-des-matieres)

Les titres servent de base aux ancres de navigation. Tout caractere non standard casse les ancres.

**Regle :** Les titres (`#`, `##`, `###`) sont composes uniquement de :
- Caracteres alphanumeriques
- Accents (`é`, `è`, `à`, `û`, etc.)
- Espaces
- Tirets `-`

**Interdit dans les titres :**
- Emojis
- Ponctuation speciale (`.`, `:`, `!`, `?`, `—`, `'`, etc.)
- Symboles (`↑`, `⏸`, `✅`, etc.)
- Caracteres encodes (`%XX`)

**Unicite :** Chaque titre `##` doit etre unique dans le fichier — les doublons cassent les ancres.

### Exemples

| Incorrect | Correct |
|-----------|---------|
| `## 1. Vue d'ensemble ⏸️` | `## 1 - Vue densemble` |
| `## Etape 1: Charger le contexte` | `## Etape 1 - Charger le contexte` |
| `## ✅ Resultats` | `## Resultats` |
| `## Balisage — contrat HTML↔scripts` | `## Balisage - contrat HTML et scripts` |

---

## TOC
[up](#table-des-matieres)

### Regle

Tout fichier Markdown avec plus de 2 sections `##` de contenu doit avoir une TOC.

- Le seuil s'evalue sur les sections de contenu uniquement — `## Quick Start`, `## Keywords`, `## Table des matieres`, `## Index` et `## Changelog` sont exclus du comptage
- Titre fixe : `## Table des matieres`
- La TOC liste uniquement les sections de premier niveau (`##`), pas les sous-sections (`###`)
- Placement : apres `## Keywords`, avant le premier `##` de contenu

### Format des ancres

VS Code genere les ancres selon ces regles :
- Tout en minuscules
- Espaces convertis en tirets `-`
- Accents conserves (`é`, `à`, `û`, etc.)
- Caracteres speciaux supprimes (sauf tirets)
- Apostrophes supprimees
- Un tiret entoure d'espaces (` - `) genere 3 tirets dans l'ancre (`---`) — privilegier les titres sans tirets pour des ancres plus lisibles

| Titre | Ancre VS Code |
|-------|--------------|
| `## Table des matieres` | `#table-des-matieres` |
| `## Scripts` | `#scripts` |
| `## Gestion de lhistorique` | `#gestion-de-lhistorique` |
| `## Etape 1 - Chargement` | `#etape-1---chargement` |

### Format de la TOC

```markdown
## Table des matieres

1. [Titre section 1](#ancre-1)
2. [Titre section 2](#ancre-2)
3. [Titre section 3](#ancre-3)
```

### Lien retour

Chaque section `##` de contenu porte un lien retour vers la TOC, place **sur la ligne suivant le titre** (pas dans le titre — cela casserait l'ancre).

```markdown
## Ma Section
[up](#table-des-matieres)

Contenu de la section...
```

---

## Regle Keywords
[up](#table-des-matieres)

### Regle

Tout fichier Markdown doit avoir une section `## Keywords` placee apres le Quick Start, avant la TOC.

### Format

```markdown
## Keywords
mot-cle-1, mot-cle-2, mot-cle-3
```

### Criteres

- Termes de 1 a 3 mots, separes par des virgules
- Couvrent le sujet, les outils, les contextes d'usage
- Permettent de retrouver le fichier par recherche dans la KB

---

## Regle Index
[up](#table-des-matieres)

### Regle

Tout fichier Markdown doit avoir une section `## Index` en fin de fichier, avant `## Changelog`.

L'index liste les termes importants du fichier avec des pointeurs vers leurs occurrences dans le texte.

### Balises dans le texte

Chaque occurrence a indexer est balisee avec une ancre HTML :

```markdown
La notion de <a id="index-terme-N">terme</a> est importante.
```

- Format de l'id : `index-terme-N` ou `terme` est le mot indexe et `N` le numero d'occurrence
- La balise est invisible dans le preview Markdown
- Le texte du terme reste visible normalement

### Format de l'index

```markdown
## Index

| Terme | Occurrences |
|-------|-------------|
| terme-1 | [1](#index-terme-1), [2](#index-terme-2) |
| terme-2 | [1](#index-terme2-1) |
```

### Exemple complet

Dans le texte :
```markdown
La <a id="index-convention-1">convention</a> de nommage est stricte.
...
Cette <a id="index-convention-2">convention</a> s'applique a tous les fichiers.
```

Dans l'index :
```markdown
## Index

| Terme | Occurrences |
|-------|-------------|
| convention | [1](#index-convention-1), [2](#index-convention-2) |
```

---

## Regle Changelog
[up](#table-des-matieres)

### Regle

Tout fichier qui evolue dans le temps doit avoir un `## Changelog` en fin de fichier, apres `## Index`.

### Format

```markdown
## Changelog

### Version X.Y - Titre court
**Date:** YYYY-MM-DD
**Raison:** Pourquoi ce changement.

**Modifications :**
- Changement 1
- Changement 2
```

### Versionnage

- `X.0` — changement majeur (restructuration, nouvelle regle importante)
- `X.Y` — ajout ou modification mineure

---

## Langue
[up](#table-des-matieres)

La langue par defaut de tout fichier Markdown est l'**anglais**.

Si une autre langue est utilisee, elle doit etre declaree sous le titre du fichier avec une courte justification :

```markdown
# Titre du fichier

*Langue : français — ce document est destine a une equipe francophone.*
```

---

## Numerotation
[up](#table-des-matieres)

### Regle

S'applique a tout systeme ou un numero devient un identifiant cite ailleurs (ex : BP#14, Rule 3).
Ne s'applique pas aux etapes sequentielles ni aux versions de Changelog.

### Principes

- **Stable** — un numero attribue ne change jamais, meme si le contenu est deplace, renomme ou fusionne
- **Sequentiel a l'ajout** — on prend le prochain numero disponible
- **Sans renumérotation** — si un item est supprime, son numero reste vacant. Les trous sont normaux et attendus
- **Suffixes pour sous-items** — `11a`, `11b` acceptables pour des variantes d'un item parent, limites a un seul niveau

### Registre obligatoire

Tout document avec des items numerotes doit maintenir un registre en fin de document :

```markdown
## Registre des numeros

| Numero | Titre | Statut |
|--------|-------|--------|
| 1 | Titre item 1 | Actif |
| 2 | Titre item 2 | Actif |
| 3 | Ancien item | Supprime 2026-05-30 |
| 4 | Titre item 4 | Actif |
```

Le registre permet d'eviter les reutilisations accidentelles et de tracer l'historique.

---

## Regle Quick Start
[up](#table-des-matieres)

### Regle

Tout fichier Markdown doit commencer par un `## Quick Start` decrivant le document en 3 a 6 lignes.

### Objectif

Le Quick Start est un **resume d'orientation** — il repond a la question "est-ce que ce document me concerne ?"

Deux types de lecteurs ont des besoins differents :

**Humain** — veut comprendre rapidement le theme et la portee du document avant de decider de le lire en detail. Il scanne, il ne lit pas lineairement.

**AI Assistant** — doit decider en debut de session si ce fichier est pertinent pour la tache en cours et vaut la peine d'etre charge dans le contexte. Chaque fichier charge a un cout double : en **tokens** (fenetre de contexte limitee) et en **pertinence** (un contexte encombre de fichiers non pertinents degrade la qualite des reponses).

**Note :** Quand on mentionne un assistant IA dans un document, ne pas utiliser de nom specifique (Claude, Gemini, etc.) — utiliser "AI Assistant".

Le Quick Start doit donc repondre a :
- **Theme** — de quoi parle ce document
- **Portee** — ce qu'il couvre et ce qu'il ne couvre pas
- **Conditions** — dans quelles situations il est utile de le lire ou de le charger

Combine avec `## Keywords`, il permet a un humain ou une IA de decider en quelques secondes si le document est pertinent.

### Ce que le Quick Start n'est pas

- Pas un resume exhaustif du contenu
- Pas une liste des sections (c'est le role de la TOC)
- Pas un guide d'action etape par etape

### Placement

Juste apres le titre `#` et la description courte, avant `## Keywords`.

### Format

```markdown
## Quick Start

[Theme : de quoi parle ce document]
[Portee : ce qu'il couvre / ne couvre pas]
[Conditions : quand le charger ou le lire]
```

---

## Index

| Terme | Occurrences |
|-------|-------------|
| ancre | [1](#index-ancre-1), [2](#index-ancre-2), [3](#index-ancre-3) |
| TOC | [1](#index-toc-1) |
| titre | [1](#index-titre-1) |

---

## Changelog

### Version 2.0 - Ajout Index et reorganisation structure
**Date:** 2026-05-30
**Raison:** Ajout de la convention Index (ancres HTML, tableau de pointeurs). Reorganisation de la structure des fichiers MD — Keywords monte sous Quick Start, Index avant Changelog.

**Modifications :**
- Ajout de la section `## Regle Index` avec format complet et exemple
- Deplacement de `## Keywords` : fin de fichier -> apres Quick Start
- Nouvelle structure canonique : Quick Start -> Keywords -> TOC -> contenu -> Index -> Changelog
- TOC mise a jour : exclusion de Quick Start, Keywords, Index, Changelog du comptage
- Quick Start mis a jour
- Changelog deplace apres Index

### Version 2.1 - Ajout Langue et Quick Start reformule
**Date:** 2026-05-30
**Raison:** Ajout de la convention de langue (anglais par defaut, declaration obligatoire si autre langue). Reformulation complete de la regle Quick Start : resume d'orientation pour humain et IA, pas guide d'action.

**Modifications :**
- Ajout de la section `## Langue`
- Reformulation de `## Regle Quick Start` : objectif, deux types de lecteurs, cout tokens et pertinence, ce que le Quick Start n'est pas
- TOC mise a jour

### Version 2.0 - Ajout Numerotation
**Date:** 2026-05-30
**Raison:** Centraliser la convention de numerotation des items references. S'applique a tout systeme ou un numero est cite ailleurs.

**Modifications :**
- Ajout de la section `## Numerotation` avec principes, registre obligatoire
- TOC mise a jour

### Version 1.3 - Note ancres avec tirets
**Date:** 2026-05-30
**Raison:** Un tiret entoure d'espaces dans un titre genere 3 tirets dans l'ancre. Ajout d'une note explicite.

**Modifications :**
- Ajout d'une note sur les tirets multiples dans le tableau des ancres

### Version 1.2 - Unicite des titres
**Date:** 2026-05-30
**Raison:** Collision d'ancre entre le bloc Quick Start en haut et la section de regle. Ajout de la regle d'unicite des titres.

**Modifications :**
- Renommage de `## Quick Start 1` en `## Regle Quick Start`
- Ajout de la regle d'unicite des titres dans la section Titres
- TOC mise a jour

### Version 1.1 - Corrections auto-conformite
**Date:** 2026-05-30
**Raison:** Le fichier ne respectait pas ses propres regles — Quick Start manquant, ordre incorrect.

**Modifications :**
- Ajout du Quick Start
- Reordonnement : description -> Quick Start -> TOC
- Precision : Quick Start et Table des matieres exclus du comptage TOC
- Precision : placement du Changelog (avant Keywords)

### Version 1.0 - Creation
**Date:** 2026-05-30
**Raison:** Centraliser toutes les regles de documentation Markdown en une convention universelle.

**Contenu initial :**
- Regle Titres : caracteres autorises, interdits, exemples
- Regle TOC : seuil, ancres VS Code, lien retour sous le titre
- Regle Keywords : format et criteres
- Regle Changelog : format et versionnage
- Regle Quick Start : format et placement
