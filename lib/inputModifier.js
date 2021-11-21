const modifier = (text) => {
  return global.inputModifier(text, state, info, worldInfo, history, memory)
}

// Don't modify this part
modifier(text)
