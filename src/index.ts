import arg from 'arg';
import getPort from 'get-port';
import inquirer from 'inquirer';
import fse from 'fs-extra';
import path from 'path';
import { connect, createDatabase } from './Database';
import { createServer } from './server';

const DEFAULT_FOLDER_NAME = 'instant-session-tracker';

export async function command() {
  const args = arg({
    '--folder': String,
    '--port': Number,
    '--slow': Boolean,
    '--help': Boolean,
    // alias
    '-h': '--help',
    '-s': '--slow',
    '-f': '--folder',
    '-p': '--port',
  });

  const readmePath = path.resolve(__dirname, '..', 'README.md');
  const help = await fse.readFile(readmePath, { encoding: 'utf8' });

  if (args['--help']) {
    console.log(help);
    return;
  }

  const port = args['--port'] || 3001;
  const folder = args['--folder'] || args._[0] || DEFAULT_FOLDER_NAME;
  const slowMode = args['--slow'] || false;

  const base = path.resolve(process.cwd(), folder);
  const dbFilePath = path.resolve(base, 'database.sqlite');
  const publicFolderPath = path.resolve(base, 'public');
  const folderExist = fse.existsSync(base);
  if (folderExist === false) {
    const createFolder = (
      await inquirer.prompt([
        {
          name: 'confirm',
          type: 'confirm',
          message: `The folder ${base} does not exist and will be created`,
        },
      ])
    ).confirm;
    if (!createFolder) {
      return;
    }
    await fse.ensureDir(base);
    await fse.ensureDir(publicFolderPath);
    await fse.copy(
      path.resolve(__dirname, '..', 'data', 'places'),
      path.resolve(publicFolderPath, 'places')
    );
    await createDatabase(dbFilePath);

    // await write(dbFilePath, DEFAULT_CONTENT);
  }

  const usedPort = await getPort({ port: port });
  const isDifferentPort = port && port !== usedPort;
  if (isDifferentPort) {
    const changePort = (
      await inquirer.prompt([
        {
          name: 'confirm',
          type: 'confirm',
          message: `${port} is already used, do you want to use ${usedPort} instead ?`,
        },
      ])
    ).confirm;
    if (!changePort) {
      return;
    }
  }

  const apiDocPath = path.resolve(__dirname, '..', 'api.html');

  const db = connect(dbFilePath);

  const server = createServer({
    db,
    apiDocPath,
    slowMode,
    publicPath: publicFolderPath,
  });

  server.listen(usedPort, () => {
    console.log(`Server started on http://localhost:${usedPort}`);
  });
}
