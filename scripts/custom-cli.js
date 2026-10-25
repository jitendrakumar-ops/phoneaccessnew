const path = require('path');
const { spawnSync } = require('child_process');

const REAL_ROOT = 'C:\\Users\\jiten\\Desktop\\maxify\\phoneaccss\\phoneaccess';

// Convert all arguments replacing X: with the real physical root on C:
const args = process.argv.slice(2).map(arg => {
  if (typeof arg === 'string') {
    return arg.replace(/^X:\\/i, REAL_ROOT + '\\').replace(/^X:\//i, REAL_ROOT + '/');
  }
  return arg;
});

process.chdir(REAL_ROOT);

const cliPath = path.join(REAL_ROOT, 'node_modules', 'react-native', 'cli.js');
console.log('[custom-cli] Running React Native CLI from:', REAL_ROOT);

const result = spawnSync(process.execPath, [cliPath, ...args], {
  cwd: REAL_ROOT,
  stdio: 'inherit',
  env: {
    ...process.env,
    PWD: REAL_ROOT,
    INIT_CWD: REAL_ROOT,
  },
});

process.exit(result.status ?? 0);
