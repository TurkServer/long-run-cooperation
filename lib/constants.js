numGames = 2;
numRounds = 5;
numPlayers = 2;

roundWait = 120;

payoffs = {};
payoffs.R = 5;
payoffs.T = 7;
payoffs.S = 0;
payoffs.P = 3;

payoffMap = {1: {1: payoffs.R,
		 2: payoffs.S},
	     2: {1: payoffs.T,
		 2: payoffs.P}};

production = true;
production_url = 'https://www.mturk.com/mturk/externalSubmit';
sandbox_url = 'https://workersandbox.mturk.com/mturk/externalSubmit';