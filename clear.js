const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const currentDirectory = process.cwd();

const getDirectories = (directory) => {
  return fs.readdirSync(directory).filter((file) => {
    const filePath = path.join(directory, file);
    return fs.statSync(filePath).isDirectory();
  });
};

const isGitRepository = (directory) => {
  return fs.existsSync(path.join(directory, '.git'));
};

const execCommand = (command, cwd) => {
  return new Promise((resolve) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (stdout) {
        console.log(`📘 [${path.basename(cwd)}] ${stdout.trim()}`);
      }
      if (stderr) {
        console.error(`⚠️ [${path.basename(cwd)}] ${stderr.trim()}`);
      }
      resolve();
    });
  });
};

const getCurrentBranch = async (directory) => {
  return new Promise((resolve) => {
    exec('git rev-parse --abbrev-ref HEAD', { cwd: directory }, (error, stdout) => {
      resolve(stdout.trim());
    });
  });
};

const hardResetAndClean = async (directory) => {
  const dirName = path.basename(directory);
  console.log(`\n🧼 Resetting & Cleaning: ${dirName}`);

  const branch = await getCurrentBranch(directory);
  console.log(`🔀 Current branch: ${branch}`);

  await execCommand(`git fetch origin ${branch}`, directory);
  await execCommand(`git reset --hard origin/${branch}`, directory);
  await execCommand(`git clean -fd`, directory);

  console.log(`✅ ${dirName} is now clean.\n`);
};

(async () => {
  console.log(`\n🛠 Starting cleanup in: ${currentDirectory}\n`);

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

  console.log('🏁 All repositories are up to date and clean!\n');
})();
