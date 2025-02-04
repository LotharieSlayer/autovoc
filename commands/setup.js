const { EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js')
const { setupAutoVoc } = require("../utils/enmapUtils");
const { color_embed,
    embed_footer_text, 
    embed_footer_icon,
    embed_author_name,
    embed_author_iconUrl,
    embed_author_url,
    embed_title_url,
    embed_thumbnail } = require('../files/config');
const { get } = require('../../../utils/mongoUtils');

async function addSetupCommand(slashCommand) {
    slashCommand.addSubcommand((subcommand) =>
    subcommand
        .setName("auto_voc")
        .setDescription("Définir ce channel pour le vote automatique des emojis.")
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Choisir le salon vocal')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice))
        .addBooleanOption(option =>
			option
				.setName('premium')
				.setDescription('Définir Premium-only')
				.setRequired(false))
    )
}

/* ----------------------------------------------- */
/* FUNCTIONS                                       */
/* ----------------------------------------------- */
/**
 * Fonction appelé quand la commande est 'setup'
 * @param {CommandInteraction} interaction L'interaction généré par l'exécution de la commande.
 */
async function execute(interaction, client) {
    switch (interaction.options._subcommand) {
        case "auto_voc":

            let embed_text

	        //console.log(interaction.options.getRole('autovoc_setup_role'))
            if (setupAutoVoc.get(interaction.options.getChannel('channel').id) === undefined) {
                setupAutoVoc.set(interaction.options.getChannel('channel').id, {
                    active : true,
                    guild : interaction.guild.id,
                });
				console.log(interaction.options.getBoolean('premium'))
                if(interaction.options.getBoolean('premium') !== true) {
                    interaction.options.getChannel('channel').permissionOverwrites.set([
                        { id : interaction.guild.roles.everyone, allow :  [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect] }
                    ],'Bloquer le salon pour tout le monde sauf les rôles autorisés')
                } else {
					const collectionPremium = client.mongo.commons.collection("premium");
					const premiumRoles = await get(interaction.guild.id, collectionPremium);
					console.log(premiumRoles);

					let objPermissions = [];
					for(let i = 0; i < premiumRoles.value.length; i++){
						objPermissions.push({ id : premiumRoles.value[i], allow :  [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect] });
					}
					console.log(objPermissions);
                    interaction.options.getChannel('channel').permissionOverwrites.set([
                        { id : interaction.guild.roles.everyone, deny :  [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect] },
						...objPermissions
                    ],'Bloquer le salon pour tout le monde sauf les rôles autorisés')
                }

            
                embed_text=`Le salon ${interaction.options.getChannel('channel')} à été ajouté pour l'auto_voc !`
            } else {
                setupAutoVoc.delete(interaction.options.getChannel('channel').id);
            
                embed_text=`Le salon ${interaction.options.getChannel('channel')} à été supprimé pour l'auto_voc !`
            }
        
            //Création de l'embed d'affichage
	        let embed_list = new EmbedBuilder()
            .setColor(color_embed)
            .setAuthor({ 
                name: embed_author_name, 
                iconURL: embed_author_iconUrl, 
                url: embed_author_url 
            })
            .setTitle(`Configuration d'un salon vocal`)
            .setDescription(embed_text)
            .setFooter({
                text: embed_footer_text,
                iconURL : embed_footer_icon
            });
        
	        //Message de réponse éphémère en embed 
	        await interaction.reply({
	        	embeds: [embed_list],
	        	ephemeral: true,
	        })
            .catch(console.error);
        break;
    }
}

module.exports = {
    addSetupCommand,
    execute,
};
