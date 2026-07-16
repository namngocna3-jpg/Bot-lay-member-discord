const http = require('http');
http.createServer((req, res) => {
   res.write("Bot is running!");
   res.end();
}).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');

// Khởi tạo bot
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// THAY TOKEN CỦA BẠN VÀO ĐÂY (Nhớ giữ lại 2 dấu nháy đơn)
const TOKEN = process.env.TOKEN;
const GUILD_ID = '1382186991780626552';

client.on('ready', async () => {
    console.log(`\n🤖 Bot ${client.user.tag} đã online và đang nghe lệnh!`);
    
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        
        // Đăng ký lệnh gạch chéo (Slash Command) vào Server của bạn
        await guild.commands.set([
            {
                name: 'xemdanhsach',
                description: 'Tải file txt danh sách thành viên của một Role',
                options: [
                    {
                        name: 'role',
                        description: 'Chọn Role bạn muốn quét',
                        type: 8, // Số 8 đại diện cho loại dữ liệu là Role
                        required: true
                    }
                ]
            }
        ]);
        console.log('✅ Đã tạo lệnh /xemdanhsach thành công trên Discord!');
        console.log('⚠️ HÃY GIỮ NGUYÊN CỬA SỔ NÀY ĐỂ BOT HOẠT ĐỘNG KHÔNG BỊ TẮT!');
    } catch (error) {
        console.error('❌ Lỗi khi đăng ký lệnh:', error);
    }
});

// Lắng nghe khi có người dùng lệnh gạch chéo
client.on('interactionCreate', async interaction => {
    // Nếu không phải là Slash Command thì bỏ qua
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'xemdanhsach') {
        // Phản hồi tạm thời để tránh bị Discord báo lỗi "Bot không phản hồi" nếu server quá đông
        await interaction.deferReply(); 

        try {
            // Lấy thông tin Role mà bạn đã chọn trong lệnh
            const role = interaction.options.getRole('role');
            const guild = interaction.guild;

            // Quét và cập nhật lại danh sách thành viên mới nhất
            await guild.members.fetch(); 
            
            // Lọc ra các thành viên có Role
            const memberData = role.members.map(member => `${member.user.id} | ${member.user.username}`);
            
            if (memberData.length === 0) {
                return interaction.editReply(`⚠️ Không có ai đang sở hữu Role **${role.name}**.`);
            }

            // Tạo nội dung file txt
            const content = `DANH SÁCH THÀNH VIÊN ROLE: ${role.name}\nTổng số: ${memberData.length}\n\nID | USERNAME\n` + memberData.join('\n');
            
            // Biến nội dung text thành một file đính kèm ảo
            const buffer = Buffer.from(content, 'utf-8');
            const formattedRoleName = role.name.replace(/[^a-zA-Z0-9]/g, "_");
            const attachment = new AttachmentBuilder(buffer, { name: `danhsach_${formattedRoleName}.txt` });

            // Gửi file thẳng vào kênh chat Discord
            await interaction.editReply({
                content: `🎉 Đã quét xong! Có **${memberData.length}** thành viên sở hữu Role **${role.name}**. Tải file ở dưới nhé:`,
                files: [attachment]
            });
            
            console.log(`✅ Vừa có người dùng lệnh quét Role: ${role.name}`);

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Đã xảy ra lỗi trong quá trình quét!');
        }
    }
});

client.login(TOKEN);