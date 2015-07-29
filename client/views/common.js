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

Template.registerHelper("printPoints", function(amount) {
  if (amount == 0) return "no points";
  if (amount == 1) return "1 point";
  else return amount + " points";
});
