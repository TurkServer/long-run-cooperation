from pymongo import MongoClient
from bson.objectid import ObjectId
import matplotlib.pyplot as plt
import itertools
import random
import numpy as np
from collections import defaultdict
import os, sys

NUMROUNDS = 10
NUMGAMES = 20
DEFECT = 0
COOP = 1
TFT = NUMROUNDS+1
STFT = NUMROUNDS+2

R = 5
T = 7
S = 1
P = 3

PAYOFFS = {1: {1: [R, R], 0: [S, T]},
           0: {1: [T, S], 0: [P, P]}}

threshholdStrats = np.zeros((NUMROUNDS+1, NUMROUNDS))
for i in range(NUMROUNDS+1):
    threshholdStrats[i][0:i] = 1

threshholdStrats = threshholdStrats.astype(int)


def isThreshhold(i):
    return i <= NUMROUNDS


def playStrats(i,j,verbose=False):
    payoffs = []
    actions = []
    indToStrat = {0: i, 1: j}
    for round_ in range(NUMROUNDS):
        roundActions = [0, 0]
        for stratInd, oppInd in [[0,1], [1,0]]:
            strat = indToStrat[stratInd]
            opp = indToStrat[oppInd]
            if isThreshhold(strat):
                roundActions[stratInd] = threshholdStrats[strat][round_]
            else: #TFT or STFT
                if round_ > 0:
                    #do what partner did
                    roundActions[stratInd] = actions[round_-1][oppInd]
                else:
                    roundActions[stratInd] = COOP if strat == TFT else DEFECT
        actions.append(roundActions)
        payoffs.append(PAYOFFS[roundActions[0]][roundActions[1]])
    if verbose:
        print actions
        print payoffs
    return [sum(i) for i in zip(*payoffs)]


def genU():
    U = np.zeros((NUMROUNDS+3, NUMROUNDS+3))
    for i in range(NUMROUNDS+3):
        for j in range(NUMROUNDS+3):
            if i <= j:
                payoff = playStrats(i,j)
                U[i][j] = payoff[0]
                U[j][i] = payoff[1]
    return U
            
