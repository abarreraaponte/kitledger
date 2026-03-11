import { createSuperUser } from "./domain/actions/user_actions.ts";

type Command = {
	name: string;
	description: string;
	usage: string;
	handler: (args: string[]) => Promise<void> | void;
};

const commands: Command[] = [
	{
		name: "setup",
		description: "Setup a new super user",
		usage: "setup <first> <last> <email>",
		handler: async (args) => {
			if (args.length < 3) {
				console.error(`Usage: ${commands.find((c) => c.name === "setup")!.usage}`);
				Deno.exit(1);
			}

			const firstName = args[0];
			const lastName = args[1];
			const email = args[2];

			const user = await createSuperUser(firstName, lastName, email);

			if (!user) {
				console.error("Failed to create super user.");
				Deno.exit(1);
			}

			console.table([user]);
			Deno.exit(0);
		},
	},
];

export async function execute(args: string[]): Promise<void> {
	const commandName = args[0];

	if (commandName === "help") {
		console.log("Available commands:");
		commands.forEach((cmd) => console.log(`- ${cmd.name}: ${cmd.description}`));
		console.log("- help: Show this help");
		Deno.exit(0);
	}

	const command = commands.find((cmd) => cmd.name === commandName);

	if (!command) {
		console.error(`Unknown command: ${commandName || ""}. Use "help" for available commands.`);
		Deno.exit(1);
	}

	if (args.length > 1 && (args[1] === "--help" || args[1] === "help")) {
		console.log(`Usage: ${command.usage}`);
		console.log(command.description);
		Deno.exit(0);
	}

	await command.handler(args.slice(1));
}
