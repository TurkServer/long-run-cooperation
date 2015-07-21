/*
  Common helpers defined across many templates
 */

Template.registerHelper("numGames", function() {
   return numGames;
});

Template.registerHelper("numRounds", function() {
  return numRounds;
});

Template.registerHelper("roundWait", function() {
  return roundWait;
});

Template.registerHelper("payoffs", function() {
  return payoffs;
});
