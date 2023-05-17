import minimist from 'minimist';
import { z } from 'zod';
import { main } from './main.js';
import { fs } from 'zx';
import { ALL_SERVICES_CLEAN_1_WITH_LINKS } from './constants/index.js';

const ALL_SERVICES = fs.readJsonSync(`data/${ALL_SERVICES_CLEAN_1_WITH_LINKS}`);

const ParsedArgsSchema = z.object({
  skipSteps: z.string().transform(x => x ? x.split(","): [])
    .optional(),
  services: z.string(z.string())
    .transform(x => x ? x.split(","): ["all"])
    .transform(x => x[0] === 'all' ? ALL_SERVICES : x)
    .optional(),
});

type ParsedArgs = z.infer<typeof ParsedArgsSchema>;

function generateCommand(args: ParsedArgs) {
  const { skipSteps = [], services = [] } = args;

  // Your logic for the "generate" command
  console.log('Generate command executed!');
  console.log('skipSteps:', skipSteps);
  console.log('services:', services);
  const tmp = services.slice(3, 4)
  // @ts-ignore
  return main({services: tmp, skipSteps})
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
    string: ['skipSteps', 'services'],
    alias: { skipSteps: 's', services: 'sv' },
    default: {
      services: 'all',
    },
  });


}

function runCLI(args: string[]) {
  const parsedArgs = parseArgs(args);
  const command = parsedArgs._[0];

  switch (command) {
    case 'generate':
      // Validate parsed arguments using zod
      const validationResult = ParsedArgsSchema.safeParse(parsedArgs);
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
