const tc = require('tinycolor2');

module.exports = {
	data: {
		name: 'assign',
		description: "Assign a color/role to a user",
		options: [
			{
				name: 'user',
				description: "The user to assign to",
				type: 6,
				required: true
			},
			{
				name: 'value',
				description: "The role (mention) or color to assign to the user",
				type: 3,
				required: true
			}
		]
	},
	usage: [
		'[user] [value: color] - Assigns a color to the user',
		'[user] [value: role mention] - Assigns the mentioned role to the user'
	],
	async execute() {
		var user = ctx.options.getMember('user');
		var role = ctx.options.resolved.roles?.first();
		var val = ctx.options.getString('value', false);
		if(!val) return "Please provide a role mention or a color!";
		
		var urole = ctx.client.stores.userRoles.get(ctx.guildId, user.id);

		if(role) {
			if(urole) return "That user already has a color role!";

			await ctx.client.stores.userRoles.create(ctx.guildId, user.id, role.id);
			await user.roles.add(role.id);
			return "Role assigned!"
		}

		var c = tc(val);
		if(!c.isValid()) return "Please provide a valid color!";

		var cfg = ctx.client.stores.configs.get(ctx.guildId);
		if(!cfg) cfg = {};
		
		var srole;
		if(cfg.hoist) srole = ctx.guild.roles.fetch(cfg.hoist);
		else srole = ctx.guild.me.roles.cache.find(r => r.name.toLowerCase().includes("sheep") || r.managed);

		var opts = {
			name: urole?.raw.name ?? user.user.username,
			color: c.toHex(),
			position: srole ? srole.permission - 1 : 0,
			mentionable: cfg.pingable
		}

		try {
			var rl;
			if(urole?.raw) {
				rl = await urole.raw.edit(opts);
			} else {
				rl = await ctx.guild.roles.create(opts);
				await ctx.client.stores.userRoles.create(ctx.guildId, user.id, rl.id);
			}

			await user.roles.add(rl.id);
		} catch(e) {
			return `ERR: `+e.message;
		}

		return "Color assigned!"
	}
}