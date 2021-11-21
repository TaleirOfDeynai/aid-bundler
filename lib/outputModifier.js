const modifier = (text) => {
  return global.outputModifier(text, state, info, worldInfo, history, memory)
}

// Don't modify this part
modifier(text)
