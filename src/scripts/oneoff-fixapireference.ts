import * as fs from 'fs';
import { ServiceMetadata } from '../types/index.js';

// Read the JSON file
const data = fs.readFileSync('data/all_services.clean.json', 'utf8');
const jsonData: Required<ServiceMetadata>[] = JSON.parse(data);
// Extract entities with "/APIReference/" in "doc_url"
const entities = jsonData.filter((service: ServiceMetadata) => {
  return !service.doc_url;
});

// Set "doc_url", "toc_url" to false, and "apiref_url" to "doc_url" value
// entities.forEach((entity: any) => {
//   entity.apiref_url = entity.doc_url;
//   entity.doc_url = false;
//   entity.toc_url = false;
//   console.log(entity);
// });

// Write the updated JSON back to the file
fs.writeFileSync('data/all_services.no_doc_url.json', JSON.stringify(entities, null, 2));
