import random


def uniform(min_val, max_val):
    return random.uniform(min_val, max_val)

def exponential(mean):
    return random.expovariate(1/mean)