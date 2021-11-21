const modifier = (text) => {
  return global.contextModifier(text, state, info, worldInfo, history, memory)
}

// Don't modify this part
modifier(text)
