import fs from 'fs-extra';
import path from 'path';

// const out: string[] = [];
// async function readAllFolders() {
//   const folderPath = '/Users/kevinlin/code/proj.aws-docs/aws-doc-extractor/build/artifacts/';

//   try {
//     const folders = fs.readdirSync(folderPath).filter((folder) => { 
//       return !folder.endsWith('SUMMARY.md') 
//     });

//     for (const folder of folders) {
//       const folderFiles = await fs.readdir(path.join(folderPath, folder, 'md.multi-page.dendron'));

//       if (folderFiles.length === 1) {
//         out.push(path.basename(folder));
//       }
//     }

//     console.log(out);
//   } catch (error) {
//     console.error('Error occurred while reading folders:', error);
//   }
// }

// readAllFolders();
