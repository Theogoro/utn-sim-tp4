import random
import math


def uniform(min_val: float, max_val: float):
    """Genera un valor uniforme en [min_val, max_val] usando la fórmula explícita A + RND * (B - A)"""
    rnd = random.random()
    tpo = min_val + rnd * (max_val - min_val)
    return rnd, tpo


def exponential(mean: float):
    """Genera un valor exponencial con media 'mean' usando la fórmula explícita -mean * ln(1 - RND)"""
    rnd = random.random()
    while rnd >= 1.0:  # Prevenir indeterminación logarítmica ln(0)
        rnd = random.random()
    tpo = -mean * math.log(1 - rnd)
    return rnd, tpo