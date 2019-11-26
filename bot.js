const Eris 		= require("eris-additions")(require("eris"));
const fs 		= require("fs");
const dblite 	= require("dblite");

require ('dotenv').config();

const bot = new Eris(process.env.TOKEN);

bot.commands = {};

bot.prefix = ["s!","sh!","sheep!","baa!"];

bot.utils = require('./utils');

bot.tc = require('tinycolor2');
bot.jimp = require('jimp');

bot.db = dblite("./data.sqlite","-header");

bot.status = 0;

const updateStatus = function(){
	switch(bot.status){
		case 0:
			bot.editStatus({name: "s!h | in "+bot.guilds.size+" guilds!"});
			bot.status++;
			break;
		case 1:
			bot.editStatus({name: "s!h | serving "+bot.users.size+" users!"});
			bot.status++;
			break;
		case 2:
			bot.editStatus({name: "s!h | website: sheep.greysdawn.com"});
			bot.status = 0;
			break;
	}

	setTimeout(()=> updateStatus(),600000)
}

bot.commands.help = {
	help: ()=> "Displays help embed.",
	usage: ()=> [" - Displays help for all commands.",
				" [command] - Displays help for specfic command.",
				" [command] [subcommand]... - Displays help for a command's subcommands"],
	execute: async (bot, msg, args) => {
		let cmd;
		let names;
		let embed;
		if(args[0]) {
			let dat = await bot.parseCommand(bot, msg, args);
			if(dat) {
				cmd = dat[0];
				names = dat[2].split(" ");
				embed = {
					title: `Help | ${names.join(" - ").toLowerCase()}`,
					description: [
						`${cmd.help()}\n\n`,
						`**Usage**\n${cmd.usage().map(c => `${bot.prefix[0] + names.join(" ")}${c}`).join("\n")}\n\n`,
						`**Aliases:** ${cmd.alias ? cmd.alias.join(", ") : "(none)"}\n\n`,
						`**Subcommands**\n${cmd.subcommands ?
							Object.keys(cmd.subcommands).map(sc => `**${bot.prefix[0]}${names.join(" ")} ${sc}** - ${cmd.subcommands[sc].help()}`).join("\n") +"\n\n" : 
							"(none)\n\n"}`,
							cmd.desc ? "**Extra**\n"+cmd.desc() : ""
					].join(""),
					footer: {
						icon_url: bot.user.avatarURL,
						text: "Arguments like [this] are required, arguments like <this> are optional."
					}
				}
			} else {
				msg.channel.createMessage("Command not found.")
			}
		} else {
			embed = {
				title: `Sheep - help`,
				description:
					`Hello, I am a sheep baaaah-t! I'll help you change your colors!\n**My current prefixes are:** ${bot.prefix.join(", ")}\nUse *`+'`s!help command`'+`* for command-specific help\n\n`+
					`**Commands**\n${Object.keys(bot.commands)
									.map(c => `**${bot.prefix[0] + c}** - ${bot.commands[c].help()}`)
									.join("\n")}\n\n`,
				footer: {
					icon_url: bot.user.avatarURL,
					text: "Arguments like [this] are required, arguments like <this> are optional."
				}
			}
		}

		msg.channel.createMessage({embed: embed});
	},
	alias: ["h", "halp", "?"]
}

async function setup() {
	var files = fs.readdirSync("./commands");
	await Promise.all(files.map(f => {
		bot.commands[f.slice(0,-3)] = require("./commands/"+f);
		return new Promise((res,rej)=>{
			setTimeout(res("a"),100)
		})
	})).then(()=> console.log("finished loading commands."));

	bot.db.query(`CREATE TABLE IF NOT EXISTS configs (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 	TEXT,
		role_mode 	INTEGER,
		disabled 	TEXT,
		pingable 	INTEGER
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS colors (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 	TEXT,
		role_id 	TEXT,
		user_id 	TEXT,
		type 		INTEGER
	)`)
}

async function writeLog(log) {
	let now = new Date();
	let ndt = `${(now.getMonth() + 1).toString().length < 2 ? "0"+ (now.getMonth() + 1) : now.getMonth()+1}.${now.getDate().toString().length < 2 ? "0"+ now.getDate() : now.getDate()}.${now.getFullYear()}`;
	if(!fs.existsSync(`./logs/${ndt}.log`)){
		fs.writeFile(`./logs/${ndt}.log`,log+"\r\n",(err)=>{
			if(err) console.log(`Error while attempting to write log ${ndt}\n`+err.stack);
		});
	} else {
		fs.appendFile(`./logs/${ndt}.log`,log+"\r\n",(err)=>{
			if(err) console.log(`Error while attempting to apend to log ${ndt}\n`+err);
		});
	}
}

bot.parseCommand = async function(bot, msg, args, command) {
	return new Promise(async (res,rej)=>{
		var commands;
		var cmd;
		var name = "";
		if(command) {
			commands = command.subcommands || [];
		} else {
			commands = bot.commands;
		}

		if(args[0] && commands[args[0].toLowerCase()]) {
			cmd = commands[args[0].toLowerCase()];
			name = args[0].toLowerCase();
			args = args.slice(1);
		} else if(args[0] && Object.values(commands).find(cm => cm.alias && cm.alias.includes(args[0].toLowerCase()))) {
			cmd = Object.values(commands).find(cm => cm.alias && cm.alias.includes(args[0].toLowerCase()));
			name = args[0].toLowerCase();
			args = args.slice(1);
		} else if(!cmd) {
			res(undefined);
		}

		if(cmd && cmd.subcommands && args[0]) {
			let data = await bot.parseCommand(bot, msg, args, cmd);
			if(data) {
				cmd = data[0]; args = data[1];
				name += " "+data[2];
			}
		}

		res([cmd, args, name]);
	})
	
}

bot.on("ready", ()=> {
	console.log('Ready!');
	writeLog('=====LOG START=====')
	updateStatus();
})

bot.on("messageCreate",async (msg)=>{
	if(msg.author.bot) return;
	if(!new RegExp(`^(${bot.prefix.join("|")})`,"i").test(msg.content.toLowerCase())) return;
	var log = [
			`Guild: ${msg.guild.name} (${msg.guild.id})`,
			`User: ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
			`Message: ${msg.content}`,
			`--------------------`
		];
	let args = msg.content.replace(new RegExp(`^(${bot.prefix.join("|")})`,"i"), "").split(" ");
	if(!args[0]) args.shift();
	if(!args[0]) return msg.channel.createMessage("Baaa!");
	var config;
	if(msg.guild) config = await bot.utils.getConfig(bot, msg.guild.id);
	else config = undefined;
	let cmd = await bot.parseCommand(bot, msg, args);
	if(cmd) {
		if(msg.guild) {
			var check = await bot.utils.checkPermissions(bot, msg, cmd);
			if(!check) {
				console.log("- Missing Permissions -")
				return msg.channel.createMessage('You do not have permission to use that command.');
			}
			check = await bot.utils.isDisabled(bot, msg.guild.id, cmd[0], cmd[2]);
			if(check && !(["enable","disable"].includes(cmd[2]))) {
				console.log("- Command is disabled -")
				return msg.channel.createMessage("That command is disabled.");
			}
		} else {
			if(cmd.guildOnly) {
				console.log("- Command is guild only -")
				return msg.channel.createMessage("That command can only be used in guilds.");
			}
		}
		
		var res;
		try {
			var res = await cmd[0].execute(bot, msg, cmd[1], config);
		} catch(e) {
			console.log(e.stack);
			log.push(`Error: ${e.stack}`);
			log.push(`--------------------`);
			msg.channel.createMessage('There was an error! D:')
		}
		if(res) {
			msg.channel.createMessage(res);
		}
	} else {
		msg.channel.createMessage("Command not found.");
		log.push('- Command Not Found -')
	}
	console.log(log.join('\r\n'));
	writeLog(log.join('\r\n'))
});

bot.on("messageReactionAdd", async (msg, emoji, user)=> {
	if(bot.user.id == user) return;
	var config;
	if(msg.channel.guild) config = await bot.utils.getConfig(bot, msg.channel.guild.id);
	else config = undefined;
	if(bot.menus && bot.menus[msg.id] && bot.menus[msg.id].user == user) {
		try {
			await bot.menus[msg.id].execute(msg, emoji, config);
		} catch(e) {
			console.log(e);
			writeLog(e);
			msg.channel.createMessage("Something went wrong: "+e.message);
		}
	}
})

bot.on("guildMemberRemove", async (guild, member)=> {
	var role = guild.roles.find(r => r.name == member.id);
	if(!role) return;
	bot.deleteRole(guild.id, role.id, "Member left server");
})

bot.on("guildRoleDelete", async (guild, role) => {
	try {
		await bot.utils.deleteServerRole(bot, guild.id, role.id);
		await bot.utils.deleteUserRole(bot, guild.id, role.id);
	} catch(e) {
		console.log("Couldn't delete data on deleted role "+role.id);
	}
})

bot.on("guildDelete", async (guild) => {
	try {
		await bot.utils.deleteColorRoles(bot, guild.id);
	} catch(e) {
		console.log("Couldn't delete data for guild "+guild.id);
	}
})

bot.on('error',(err,id)=> {
	console.log(`Error on shard ${id}:\n${err.stack}`);
	writeLog(`ERR:\r\nShard: ${id}\r\nStack: ${err.stack}`)
})

setup();
bot.connect()
.catch(e => console.log("Trouble connecting...\n"+e));