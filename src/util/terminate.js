const cp = require('child_process')
const path = require('path')
const { isWindows, isLinux, isMacintosh } = require('./platform')

exports.terminate = function(childProcess, cwd) {
  if (isWindows) {
    try {
      let options = {
        stdio: ['pipe', 'pipe', 'ignore']
      }
      if (cwd) {
        options.cwd = cwd
      }
      cp.execSync(
        'taskkill',
        ['/T', '/F', '/PID', childProcess.pid.toString()],
        options
      )
    } catch (err) {
      return { success: false, error: err }
    }
  } else if (isLinux || isMacintosh) {
    try {
      let cmd = path.resolve(__dirname, './terminate.sh')
      let result = cp.spawnSync(cmd, [childProcess.pid.toString()], {
        cwd
      })
      if (result.error) {
        return { success: false, error: result.error }
      }
    } catch (err) {
      return { success: false, error: err }
    }
  } else {
    childProcess.kill('SIGKILL')
  }
  return { success: true }
}
