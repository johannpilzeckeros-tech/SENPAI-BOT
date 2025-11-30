const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    Events, 
    AttachmentBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const Canvas = require('canvas');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

const WELCOME_CHANNEL_ID = '1437118522562969630';
const APPLICATION_BUTTON_CHANNEL_ID = '1444620362976329830';
const APPLICATION_ADMIN_CHANNEL_ID = '1444703939575415027';

// ================== Bewerbung Button ==================
client.once('ready', async () => {
    console.log(`Bot online als ${client.user.tag}`);

    const channel = await client.channels.fetch(APPLICATION_BUTTON_CHANNEL_ID);
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('bewerben')
            .setLabel('📩 Bewerbung starten')
            .setStyle(ButtonStyle.Primary)
    );

    // Sende nur einmal beim Start, keine Duplikate
    const messages = await channel.messages.fetch({ limit: 10 });
    if (!messages.some(msg => msg.author.id === client.user.id && msg.components.length > 0)) {
        channel.send({
            content: "Drücke auf den Button, um deine Bewerbung zu starten:",
            components: [row]
        });
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'bewerben') {
        await interaction.reply({ content: 'Ich habe dir eine private Nachricht geschickt!', ephemeral: true });
        try {
            await interaction.user.send(
`# 📨 Bewerbung
1. Wie alt bist du?
2. Warum möchtest du ins Team?
3. Wie aktiv wirst du sein?
4. Spielst du auf Java oder Bedrock?
5. Spielst du auf anderen SMPs oder hast du auf anderen gespielt?
6. Hast du Erfahrung in Minecraft?
7. Wirst du dich mehr auf dich selbst fokussieren oder mehr im Team spielen?
8. Suchst du bei Konflikten zuerst das Schwert oder das Gespräch?
9. Was bedeutet für dich Loyalität, wenn niemand zusieht?
10. Was würdest du tun, wenn dir jemand 1000 Dias anbietet, um SENPAI zu verraten?`
            );
        } catch {
            await interaction.followUp({ content: 'Ich konnte dir keine DM senden. Hast du DMs deaktiviert?', ephemeral: true });
        }
    }
});

// Empfang der Bewerbung in DMs
client.on(Events.MessageCreate, async message => {
    if (!message.guild && !message.author.bot) {
        const adminChannel = await client.channels.fetch(APPLICATION_ADMIN_CHANNEL_ID);
        adminChannel.send(`📩 **Neue Bewerbung von ${message.author.tag}:**\n${message.content}`);
    }
});

// ================== Welcome Banner ==================
async function createWelcomeBanner(member) {
    const canvas = Canvas.createCanvas(1000, 400);
    const ctx = canvas.getContext('2d');

    // Hintergrund mit Glanzpunkten
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#ff6ec7');
    gradient.addColorStop(0.5, '#ff3db1');
    gradient.addColorStop(1, '#ff1abc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 2 + 1;
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // SENPAI Text
    ctx.font = 'bold 110px Sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowBlur = 20;
    ctx.strokeText('SENPAI', canvas.width / 2, 120);
    ctx.fillStyle = '#ffe6f0';
    ctx.fillText('SENPAI', canvas.width / 2, 120);

    // Willkommen Text
    ctx.font = 'bold 60px Sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.strokeText(`Willkommen, ${member.user.username}!`, canvas.width / 2, 250);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Willkommen, ${member.user.username}!`, canvas.width / 2, 250);

    // Profilbild
    const avatar = await Canvas.loadImage(member.displayAvatarURL({ format: 'png', size: 512 }));
    const avatarX = canvas.width / 2 - 75;
    const avatarY = 270;
    const avatarSize = 150;
    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // Rahmen um Profilbild
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.stroke();

    return new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome.png' });
}

// ================== GuildMemberAdd ==================
client.on(Events.GuildMemberAdd, async member => {
    const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const attachment = await createWelcomeBanner(member);
    channel.send({ files: [attachment] }); // Nur das neue Banner, kein Text
});

client.login(process.env.TOKEN);

