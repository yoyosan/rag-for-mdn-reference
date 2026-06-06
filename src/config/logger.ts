import pino from "pino";

export const logger = pino({
	transport: {
		targets: [
			{
				target: "pino/file",
				options: { destination: "debug.json", mkdir: true },
			},
			// {
			// 	target: "pino-pretty",
			// 	options: { colorize: true },
			// },
		],
	},
});
