const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const LOG = require('./log-tag');

const currentDirectory = process.cwd();

const getDirectories = (directory) =>
  fs.readdirSync(directory).filter((file) =>
    fs.statSync(path.join(directory, file)).isDirectory()
  );

const isGitRepository = (directory) =>
  fs.existsSync(path.join(directory, '.git'));

const execCommand = (command, cwd) =>
  new Promise((resolve) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.warn(`${LOG.warn} [${path.basename(cwd)}] Command failed: ${command}`);
        if (stderr) console.warn(`${LOG.warn} ${stderr.trim()}`);
      }
      resolve();
    });
  });

const getCurrentBranch = async (directory) =>
  new Promise((resolve) => {
    exec('git rev-parse --abbrev-ref HEAD', { cwd: directory }, (error, stdout, stderr) => {
      if (error) {
        console.error(`${LOG.error} Failed to get current branch in ${directory}`);
        if (stderr) console.error(`${LOG.error} ${stderr.trim()}`);
        resolve(null);
      } else {
        resolve(stdout.trim());
      }
    });
  });

const hardResetAndClean = async (directory) => {
  const dirName = path.basename(directory);
  const branch = await getCurrentBranch(directory);

  if (!branch) {
    console.warn(`${LOG.warn} Skipping ${dirName} due to branch resolution failure.`);
    return;
  }

  console.log(`${LOG.info} Resetting ${dirName} (${branch})...`);
  await execCommand(`git fetch origin ${branch}`, directory);
  await execCommand(`git reset --hard origin/${branch}`, directory);
  await execCommand(`git clean -fd`, directory);

  console.log(`${LOG.ok} [${dirName}] ${branch} is now clean.`);
};

(async () => {
  console.log(`\n${LOG.info} Target Project: ${currentDirectory}\n`);

  if (isGitRepository(currentDirectory)) {
    await hardResetAndClean(currentDirectory);
  }

  const subDirs = getDirectories(currentDirectory);
  for (const dir of subDirs) {
    const fullPath = path.join(currentDirectory, dir);
    if (isGitRepository(fullPath)) {
      await hardResetAndClean(fullPath);
    }
  }

  console.log(`\n${LOG.ok} All repositories are up to date and clean.\n`);
})();