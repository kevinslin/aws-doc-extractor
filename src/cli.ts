import minimist from 'minimist';
import { z } from 'zod';
import { main } from './main.js';
import { fs } from 'zx';
import { ALL_SERVICES_CLEAN_1_WITH_LINKS } from './constants/index.js';
import { ServiceMetadata } from './types/index.js';
import _debug from "debug";
const debug = _debug("cli")

const ALL_SERVICES: ServiceMetadata[] = fs.readJsonSync(`data/${ALL_SERVICES_CLEAN_1_WITH_LINKS}`);

export const ParsedArgsSchema = z.object({
  startFrom: z.string().optional(),
  skipServices: z.string().transform(x => (x && x !== "") ? x.split(","): []),
  skipSteps: z.string().transform(x => x ? x.split(","): [])
    .optional(),
  services: z.string(z.string())
    .transform(x => x ? x.split(","): ["all"])
    .transform(x => {
      switch (x[0]) {
        case 'all':
          return ALL_SERVICES
        case 'fetched': {
          const fetched = fs.readdirSync('docs');
          return ALL_SERVICES.filter(s => fetched.includes(s.norm_name))
        } case 'not-fetched':
          const fetched = fs.readdirSync('docs');
          return ALL_SERVICES.filter(s => !fetched.includes(s.norm_name))
        default:
          return ALL_SERVICES.filter(s => s.norm_name === x[0])
      }
      // TODO: validate service is valid
    })
    .optional(),
});

// a switch statement with following cases: 'all', 'fetched', 'not-fetched


type ParsedArgs = z.infer<typeof ParsedArgsSchema>;

function generateCommand(args: ParsedArgs) {
  let { skipSteps = [], services = [] } = args;

  // Your logic for the "generate" command
  console.log('Generate command executed!');
  console.log('skipSteps:', skipSteps);
  if (args.startFrom) {
    const idx = services.findIndex(s => s.norm_name === args.startFrom)
    if (idx === -1) {
      console.error(`invalid startFrom: ${args.startFrom}`)
      process.exit(1)
    }
    services = services.slice(idx, -1)
  }
  if (args.skipServices.length > 0) {
    services = services.filter(s => !args.skipServices.includes(s.norm_name))
  }
  console.log('services:', services);
  // @ts-ignore
  return main({services, skipSteps})
}

function printHelp() {
  console.log('Usage: cli.ts [command] [options]');
  console.log('');
  console.log('Commands:');
  console.log('  generate    Generate something');
  console.log('');
  console.log('Options:');
  console.log('  --skipSteps <steps>    Skip specified steps (comma-delimited)');
  console.log('  --services <services>  Specify services (comma-delimited)');
  console.log('');
}

function parseArgs(args: string[]) {
  return minimist(args, {
    string: ['skipSteps', 'services', 'skipServices'],
    alias: { skipSteps: 's', services: 'sv' },
    default: {
      services: 'all',
      skipServices: "",
    },
  });


}

export function runCLI(args: string[]) {
  const parsedArgs = parseArgs(args);
  debug({ctx: "runCLI", parsedArgs});
  const command = parsedArgs._[0];

  switch (command) {
    case 'generate':
      // Validate parsed arguments using zod
      const validationResult = ParsedArgsSchema.safeParse(parsedArgs);
      debug({ctx: "runCLI:generate", data: JSON.stringify(validationResult)});
      if (!validationResult.success) {
        console.error('Invalid arguments:', validationResult.error);
        process.exit(1);
      }
      generateCommand(validationResult.data);
      break;
    default:
      printHelp();
      break;
  }
}

// Run the CLI
runCLI(process.argv.slice(2));
