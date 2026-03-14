
function pickChoice(choices) {
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

export {
  pickChoice,
}
