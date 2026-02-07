
# Tailles de grille supportées
BOARD_SIZES = [3, 4, 5]

# Configuration par défaut
DEFAULT_BOARD_SIZE = 3
DEFAULT_MODE = "operator_vs_system"  # ou "operator_vs_operator"
DEFAULT_DIFFICULTY = "medium"  # easy, medium, relentless

# Longueurs de victoire par taille de grille
WIN_LENGTHS = {
    3: 3,  # 3×3 → 3 en ligne
    4: 4,  # 4×4 → 4 en ligne
    5: 4,  # 5×5 → 4 en ligne (pas 5, trop difficile)
}

# Profondeur de recherche par difficulté (pour minimax)
MINIMAX_DEPTHS = {
    "easy": 1,
    "medium": 3,
    "relentless": 6,
}

# Symboles des joueurs
PLAYER_OPERATOR = "X"  # Opérateur (humain)
PLAYER_SYSTEM = "O"    # Système (IA)
EMPTY_CELL = None

# Modes de jeu
MODE_VS_SYSTEM = "operator_vs_system"
MODE_VS_OPERATOR = "operator_vs_operator"

# Difficultés
DIFFICULTY_EASY = "easy"
DIFFICULTY_MEDIUM = "medium"
DIFFICULTY_RELENTLESS = "relentless"