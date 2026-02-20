# TACTIX // BLACKBOX

### Moteur décisionnel stratégique basé sur Minimax & structures de données avancées

---

## Description du projet : 

**TACTIX // BLACKBOX** est une application web implémentant un moteur intelligent de jeu type morpion avancé (3×3, 4×4, 5×5).

Le projet ne se limite pas à un simple jeu : il s'agit d’un moteur décisionnel optimisé basé sur :

* Arbre de jeu (Game Tree)
* Algorithme **Minimax**
* Élagage **Alpha-Bêta**
* Table de transposition
* Fonction heuristique
* Analyse tactique (Exploit Scan + détection de forks)
* Pile (Undo via HistoryStack)
* Persistance SQLite pour les statistiques

L’objectif est d’illustrer l’application concrète des **Structures de Données Avancées** dans un système interactif complet.

---

# Technologies utilisées

### 1- Backend

* Python 3
* Flask
* SQLite
* Architecture modulaire

### 2- Algorithmes

* Minimax depth-limited
* Alpha-Beta pruning
* Transposition Table (mémoïsation)
* Heuristique d’évaluation
* Analyse tactique (scan immédiat)

### 3- Frontend

* HTML / CSS
* JavaScript (fetch API)
* Tailwind CDN
* Design system personnalisé (blackbox.css + animations.css)

---

# Structure du projet : 

```
game/
    ai.py
    minimax.py
    heuristics.py
    scan.py
    board.py
    rules.py
    history.py
    types.py

stats/
    store.py
    metrics.py
    schema.sql

web/
    api.py
    routes.py

static/
    css/
    js/

templates/

app.py
requirements.txt
```

### Rôle des principaux modules :

* **game/** → Moteur algorithmique complet
* **stats/** → Enregistrement & analyse statistique
* **web/** → API REST et gestion des routes
* **static/** → Interface frontend
* **templates/** → Pages HTML

---

# Comment exécuter le projet : 

## 1- Cloner le dépôt d'apres github (lien du repo est dans le fichier)

```bash
git clone https://github.com/noura1se/TACTIX-blackbox/tree/main
cd tactix-blackbox
```

---

## 2- Créer un environnement virtuel

```bash
python -m venv .venv
```

### Windows :

```bash
.venv\Scripts\activate
```

### Mac / Linux :

```bash
source .venv/bin/activate
```

---

## 4- Installer les dépendances

```bash
pip install -r requirements.txt
```

---

## 4- Lancer l’application

```bash
python app.py
```

---

## 5- Accéder à l’application

Ouvrir votre navigateur et aller à :

```
http://127.0.0.1:5000
```

---

# Fonctionnalités principales : 

* Choix du mode (Opérateur vs IA / PvP)
* Choix de la taille de grille (3×3, 4×4, 5×5)
* Niveaux de difficulté (Easy / Medium / Relentless)
* Analyse tactique (Exploit Scan)
* Annulation de coup (Undo)
* Réinitialisation de la partie
* Tableau de bord statistique persistant

---

# Architecture IA “Difficulty-first” : 

* **Easy** → 75% coups aléatoires + Minimax peu profond
* **Medium** → Minimax optimisé
* **Relentless** → Scan + Minimax profond + optimisations

Cette architecture permet :

* Différenciation réelle des comportements
* Contrôle du coût de calcul
* Comparaison pédagogique des stratégies

---

# Système de statistiques : 

Chaque partie terminée est :

1. Enregistrée en SQLite
2. Agrégée via `metrics.py`
3. Affichée dans le tableau de bord (win rate, distribution, historique)

Les statistiques persistent même après redémarrage du serveur.

---

# Validation : 

Le projet a été validé via :

* Tests fonctionnels avec Postman
* Vérification des transitions d’état
* Tests comparatifs des niveaux de difficulté
* Tests de performance sur 5×5

---

# Objectif pédagogique : 

Ce projet illustre :

* La modélisation d’un espace d’états
* La gestion d’une complexité exponentielle
* L’optimisation algorithmique
* L’utilisation concrète des structures de données (pile, table de hachage, agrégation SQL)
* La conception d’une architecture modulaire

---

# Auteurs : 

Projet réalisé par :

* Niama ES-SELYMY
* Noura ELMOUSSAOUI
* Rim MOURAFI

Dans le cadre du module :
**Structures de Données Avancées**

