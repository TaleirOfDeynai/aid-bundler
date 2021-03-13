class AIDData {
  constructor (text, state, info, worldEntries, history) {
    this.text = text
    this.state = state
    this.info = info
    this.worldEntries = worldEntries
    this.history = history
    this.useAI = true
  }

  finalizeOutput () {
    return {
      text: this.text,
      stop: !this.useAI
    }
  }

  set message (value) {
    this.state.message = value
  }

  get message () {
    return this.state.message
  }

  get actionCount () {
    return this.info.actionCount
  }

  get characters () {
    return this.info.characters
  }

  get memoryLength () {
    return this.info.memoryLength
  }

  get maxChars () {
    return this.info.maxChars
  }
}

module.exports = {
  AIDData
}
