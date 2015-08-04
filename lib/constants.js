numGames = 20;
numRounds = 10;
basePayment = 10;

numPlayers = 50;

roundWait = 1;

payoffs = {};
payoffs.R = 5;
payoffs.T = 7;
payoffs.S = 1;
payoffs.P = 3;
conversion = 0.005;

payoffMap = {1: {1: [payoffs.R, payoffs.R],
		 2: [payoffs.S, payoffs.T]},
	     2: {1: [payoffs.T, payoffs.S],
		 2: [payoffs.P, payoffs.P]}};

hitTypeTitle1pm = 'Session for Month-Long Research Study (1 PM ET)'
hitTypeTitle3pm = 'Session for Month-Long Research Study (3 PM ET)'
