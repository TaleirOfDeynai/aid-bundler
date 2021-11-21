const DOUBLE_QUOTE = `"`

/**
 * Makes a string safe to be used in a RegExp matcher.
 *
 * @param {string} str
 * @returns {string}
 */
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Creates a regular expression that can match commands and the arguments, with the
 * given `prefix`.
 *
 * @param {string} prefix
 * @returns {RegExp}
 */
const reCommand = (prefix) => new RegExp(`^${escapeRegExp(prefix)}(.+?)(?:\\s+(.+))?$`)

/**
 * Attempts to match a regex on the given text and return its first match-group.
 * If it fails to match, the result will be `undefined`.
 * 
 * @param {RegExp} regex 
 * @param {string} text 
 * @returns {string | undefined}
 */
const tryToExtract = (regex, text) => {
  const [, rawText] = regex.exec(text) || []
  return rawText || undefined
}

const removeFluff = (text) => {
  let rawText = ""

  // Say mode adds double-quotes to the end of the input unless the input already
  // ends with double-quotes.  This makes it a little tricky to parse commands
  // that are using quoted arguments.
  rawText = tryToExtract(/^> [yY]ou\s+say\s+"(.+?)"$/, text)
  if (rawText) return rawText

  // Do mode adds a period to the end of the input except when it ends with `.`
  // or `"`.  There's no reliable way to tell if the period was provided by the
  // player or not, unfortunately, so we're just going to discard it.
  rawText = tryToExtract(/^>\s+(?:[yY]ou\s+)(.+?)\.?$/, text)
  if (rawText) return rawText

  // Finally, Story mode gives us the input as the player entered it.
  return text
}

/**
 * Splits command arguments apart.  Arguments wrapped in double-quotes will be kept
 * together as a single argument (double-quotes included).
 *
 * @param {string} arg
 * @returns {string[]}
 */
const splitArgs = (arg) => {
  arg = arg.trim()
  if (!arg) return []

  const matches = arg.match(/(?:".+?(?:"|$)|[^\s"]+)+/g)
  if (!matches?.length) return []

  // In Say mode, it is possible for the final `"` character to be chopped off.
  // If we see an argument that starts with `"` but doesn't end with `"`, we
  // will just assume that's what happened and correct it for consistency.

  const lastIndex = matches.length - 1
  const lastArg = matches[lastIndex]
  if (lastArg.startsWith(DOUBLE_QUOTE) && !lastArg.endsWith(DOUBLE_QUOTE)) {
    matches[lastIndex] = `${lastArg}"`
  }

  return matches
}

class CommandHandler {
  constructor () {
    this.commands = []
    this.commandPrefix = '/'
    this.hideCommand = true
    this.declareCommand = true
  }

  addCommand (command) {
    this.commands.push(command)
  }

  checkCommand (data) {
    const rawText = removeFluff(data.text.trim())
    if (!rawText) return undefined

    const [, cmd, arg = ''] = reCommand(this.commandPrefix).exec(rawText) ?? []
    if (!cmd) return undefined

    const loCmd = cmd.toLowerCase()

    for (const command of this.commands) {
      if (command.name.toLowerCase() === loCmd) {
        const args = splitArgs(arg)

        if (this.hideCommand) {
          data.text = ''

          if (!data.message && this.declareCommand) {
            const commandParts = [command.name, ...args]
            data.message = `Executed ${this.commandPrefix}${commandParts.join(' ')}`
          }
        }

        command.run(data, args)
        return command
      }
    }
  }
}

class Command {
  constructor (name, handler) {
    this.name = name
    this.handler = handler
    this.stopsPlugins = true
  }

  run (data, args) {
    this.handler(data, args)
  }
}

module.exports = {
  CommandHandler,
  Command
}
