module.exports = {
	help: ()=> "Displays help embed.",
	usage: ()=> [" - Displays help for all commands.",
				" [command] - Displays help for specfic command.",
				" [command] [subcommand]... - Displays help for a command's subcommands"],
	execute: async (bot, msg, args) => {
		if(!args[0]) {
			//setup
			var modules = bot.modules.map(m => m);
			modules.forEach(m => m.commands = m.commands.map(c => c));

			var embeds = [{
				title: "Baaa, I'm Sheep!",
				description:
					"My job is to make color roles simple and easy!\n" +
					"To get started, use `s!c [color]` (without brackets) " +
					"to assign yourself a color. If you'd like, you can also " +
					"`s!rename` it!\n\n" +
					"On top of that, I have other cool features, like:",
				fields: [
					{
						name: "Saved colors",
						value: 
							"Save a color for later using `s!sv`! This lets you " +
							"use a handy name to refer to a color in commands"					
					},
					{
						name: "Server-based colors",
						value:
							"Server too big for individual user roles? No problem! " +
							"Use `s!tg` to toggle role modes and add roles for " +
							"users to pick from with `s!rl`"
							
					},
					{
						name: "Detailed help command",
						value:
							"You can use `s!h` for help with any command " +
							"(including subcommands)! Try it out with `s!h c`\n" +
							"You can also flip the pages here to see all the commands!"
					},
					{
						name: "Need help? Join the support server!",
						value: "[https://discord.gg/EvDmXGt](https://discord.gg/EvDmXGt)",
						inline: true
					},
					{
						name: "Support my creators!",
						value: 
							"[patreon](https://patreon.com/greysdawn) | " +
							"[ko-fi](https://ko-fi.com/greysdawn)",
						inline: true
					}
				],
				color: 0xf5e4b5
			}];
			for(var i = 0; i < modules.length; i++) {
				var tmp_embeds = await bot.utils.genEmbeds(bot, modules[i].commands, c => {
					return {name:  `**${bot.prefix[0] + c.name}**`, value: c.help()}
				}, {
					title: `**${modules[i].name}**`,
					description: modules[i].description,
					color: parseInt(modules[i].color, 16) || parseInt("555555", 16),
					footer: {
							icon_url: bot.user.avatarURL,
							text: "I'm Sheep! I help you change your name color :D"
						}
				}, 10, {addition: ""})
				
				embeds = embeds.concat(tmp_embeds);
			}

			for(let i=0; i<embeds.length; i++) {
				if(embeds.length > 1) embeds[i].title += ` (page ${i+1}/${embeds.length}, ${bot.commands.size} commands total)`;
			}

			return embeds;
		}

		
		let {command} = await bot.handlers.command.parse(args);
		if(command) {
			var embed = {
				title: `Help | ${command.name.toLowerCase()}`,
				description: command.help(),
				fields: [
					{name: "**Usage**", value: `${command.usage().map(c => `**${bot.prefix[0] + command.name}**${c}`).join("\n")}`},
					{name: "**Aliases**", value: `${command.alias ? command.alias.join(", ") : "(none)"}`},
					{name: "**Subcommands**", value: `${command.subcommands ?
							command.subcommands.map(sc => `**${bot.prefix[0]}${sc.name}** - ${sc.help()}`).join("\n") : 
							"(none)"}`}
				],
				color: parseInt(command.module.color, 16) || parseInt("555555", 16),
				footer: {
					icon_url: bot.user.avatarURL,
					text: "Arguments like [this] are required, arguments like <this> are optional."
				}
			};
			if(command.desc) embed.fields.push({name: "**Extra Info**", value: command.desc()});
			if(command.permissions) embed.fields.push({name: "**Permissions**", value: command.permissions.join(", ")});

			return embed;
		} else {
			let module = bot.modules.get(args[0].toLowerCase());
			if(!module) return "Command/module not found";
			module.commands = module.commands.map(c => c);

			var embeds = await bot.utils.genEmbeds(bot, module.commands, c => {
				return {name: `**${bot.prefix[0] + c.name}**`, value: c.help()}
			}, {
				title: `**${module.name}**`,
				description: module.description,
				color: parseInt(module.color, 16) || parseInt("555555", 16),
				footer: {
						icon_url: bot.user.avatarURL,
						text: "I'm Sheep! I help you change your name color :D"
					}
			}, 10, {addition: ""});

			for(let i=0; i<embeds.length; i++) {
				if(embeds.length > 1) embeds[i].title += ` (page ${i+1}/${embeds.length}, ${Object.keys(bot.commands).length} commands total)`;
			}

			return embeds;
		}
	},
	alias: ["h", "halp", "?"]
}