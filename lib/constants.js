numGames = 2;
numRounds = 5;

numPlayers = 10;

roundWait = 2;

payoffs = {};
payoffs.R = 5;
payoffs.T = 7;
payoffs.S = 0;
payoffs.P = 3;
conversion = 0.0025;

payoffMap = {1: {1: [payoffs.R, payoffs.R],
		 2: [payoffs.S, payoffs.T]},
	     2: {1: [payoffs.T, payoffs.S],
		 2: [payoffs.P, payoffs.P]}};

