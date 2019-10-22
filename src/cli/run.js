const cp = require('child_process')
const getPort = require('get-port')
const servers = require('./servers')
const getCmd = require('../get-cmd')
const nodeCleanup = require('node-cleanup')
const { terminate } = require('../util/terminate')

const signals = ['SIGINT', 'SIGTERM', 'SIGHUP']

module.exports = {
  // For testing purpose, allows stubbing cp.spawnSync
  _spawn(...args) {
    return cp.spawn(...args)
  },

  // For testing purpose, allows stubbing process.exit
  _exit(...args) {
    process.exit(...args)
  },

  spawn(cmd, opts = {}) {
    const cleanAndExit = (code = 0) => {
      servers.rm(opts)
      this._exit(code)
    }

    const startServer = port => {
      const serverAddress = `http://localhost:${port}`

      process.env.PORT = port
      servers.add(serverAddress, opts)

      signals.forEach(signal => process.on(signal, cleanAndExit))

      const [command, ...args] = getCmd(cmd)
      const child = this._spawn(command, args, {
        stdio: 'inherit',
        cwd: process.cwd()
      })

      nodeCleanup(() => {
        terminate(child, process.cwd())
        cleanAndExit(0)
      })

      // For tests
      if (child.error) throw child.error
      if (child.status) {
        cleanAndExit(child.status)
        return
      }

      child.on('exit', code => {
        cleanAndExit(code)
      })
      child.on('error', error => {
        throw error
      })
    }

    if (opts.port) {
      startServer(opts.port)
    } else {
      getPort()
        .then(startServer)
        .catch(err => {
          throw err
        })
    }
  }
}
