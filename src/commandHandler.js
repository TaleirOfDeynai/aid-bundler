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
 * Matches the fluff words added to a player's input for removal.
 * 
 * @type {Record<string, RegExp>}
 */
const fluffRemovers = {
  /**
   * Do mode adds a period to the end of the input except when:
   * - The input ends with: `"`
   * - The input ends with: `.`
   * 
   * There's no reliable way to tell if the period was provided by the player
   * or not, unfortunately, so we're just going to discard it.
   */
  do: /^>\s+(?:[yY]ou\s+)?(.+?)\.?$/,
  /**
   * Say mode adds double-quotes to the end of the input unless the input already
   * ends with double-quotes.  This makes it a little tricky to parse commands
   * that are using quoted arguments.
   */
  say: /^> [yY]ou\ssay\s+"([^"]+?|.+?")"?$/,
  /** Story mode always sends text as the player submitted it. */
  story: /^.*$/
}

const removeFluff = (text) => {
  for (const mode of Object.keys(fluffRemovers)) {
    const [, rawText] = fluffRemovers[mode].exec(text) || []
    if (rawText) return rawText
  }
  return undefined
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
  return arg.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []
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
