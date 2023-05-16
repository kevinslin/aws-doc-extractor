import fs from "fs-extra";

type Service = Partial<{
  name: string;
  doc_url: string;
  repo_url: string;
  toc_url: string;
  category: string;
}>;

type Entry = {
  category: string;
  services: string[];
};

// Read the JSON data from 'data/all_services.json'
const entries: Entry[] = fs.readJsonSync('data/all_services.json');

// Create an array of all individual service entries
const allEntries: Service[] = entries.flatMap((entry: Entry) => {
  return entry.services.flatMap((service: string) => {
    return {
      category: entry.category,
      name: service,
    };
  });
});

// Flatten the array of allEntries
fs.writeJSONSync('data/all_services.clean.json', allEntries, { spaces: 2 });
