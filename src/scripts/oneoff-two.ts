import fs from 'fs-extra';
import path from 'path';

async function removeServices() {
  try {
    const filePath = '/tmp/out2.txt';
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const services = fileContent.split('\n').map((line) => line.trim());

    const projectPath = '/Users/kevinlin/code/proj.aws-docs/aws-doc-extractor';
    const docsPath = path.join(projectPath, 'docs');
    const stagingPath = path.join(projectPath, 'build', 'staging');
    const artifactsPath = path.join(projectPath, 'build', 'artifacts');

    for (const service of services) {
      const serviceDocsPath = path.join(docsPath, service);
      const serviceStagingPath = path.join(stagingPath, service);
      const serviceArtifactsPath = path.join(artifactsPath, service);
      if (service == "") {
        continue
      }

      // Remove the directories for each service
      fs.removeSync(`${serviceDocsPath}`);
      fs.removeSync(`${serviceStagingPath}`);
      fs.removeSync(`${serviceArtifactsPath}`);

      console.log(`Removed directories for ${service}`);
    }

    console.log('All services removed successfully!');
  } catch (error) {
    console.error('Error occurred while removing services:', error);
  }
}

removeServices();
