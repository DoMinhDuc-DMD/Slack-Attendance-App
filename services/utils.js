const dayjs = require('dayjs');
const { COMMAND_RULES } = require('./commandRules');

const today = dayjs();

function capitalizeFirstLetter(period) {
    return period.charAt(0).toUpperCase() + period.slice(1);
}

function formatDuration(duration) {
    if (duration < 1) {
        return `${Math.round(duration * 60)} phút`;
    }

    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);

    let result = '';
    if (hours > 0) result += `${hours} giờ`;
    if (minutes > 0) result += ` ${minutes} phút`;

    return result.trim();
}

function calculateDuration(newDuration) {
    const regex = /(?:(\d+)\s*(?:giờ|h))|(?:(\d+)\s*phút)/gi;
    let match;
    let duration = 0;
    let matched = false;

    while ((match = regex.exec(newDuration)) !== null) {
        matched = true;
        if (match[1]) {
            duration += parseFloat(match[1]);
        } else if (match[2]) {
            duration += parseFloat(match[2]) / 60;
        }
    }

    if (!matched) {
        console.log('Không đúng định dạng thời gian!');
        return;
    }

    return parseFloat(duration.toFixed(2));
}

async function responseMessage(client, channelId, text, { threadTs = null, autoDelete = false } = {}) {
    const payload = {
        channel: channelId,
        text
    };
    if (threadTs && /^\d+\.\d+$/.test(threadTs.toString())) {
        payload.thread_ts = threadTs.toString();
    }

    const message = await client.chat.postMessage(payload);

    if (autoDelete) {
        setTimeout(async () => {
            try {
                await client.chat.delete({
                    channel: message.channel,
                    ts: message.ts
                });
            } catch (error) {
                console.error("Không thể xoá tin nhắn:", error.data || error.message);
            }
        }, 10000);
    }
    return message;
}

async function hasPermission(db, user_id, channel_id) {
    const [superAdmin] = await db.execute(`SELECT super_admin_id FROM workspace WHERE super_admin_id = ?`, [user_id]);
    if (superAdmin.length > 0) return { role: 'super_admin' };

    const [admin] = await db.execute(`SELECT admin_id FROM attendance_channels WHERE admin_id = ? AND channel_id = ?`, [user_id, channel_id]);
    if (admin.length > 0) return { role: 'admin' };

    return { role: 'user' };
}

async function checkCommandMiddleware(db, client, command) {
    const { user_id, channel_id, command: cmd } = command;
    const { channel } = await client.conversations.info({ channel: channel_id });
    const { role } = await hasPermission(db, user_id, channel_id);

    const rule = COMMAND_RULES[cmd];
    if (!rule) {
        await responseMessage(client, user_id, `Lệnh '${cmd}' không hợp lệ hoặc bạn không có quyền!`, { autoDelete: true });
    }

    if (rule.location === 'dm' && (!channel.is_im || channel.user !== user_id)) {
        await responseMessage(client, user_id, `Lệnh '${cmd}' chỉ dùng trong tin nhắn trực tiếp với bot!`, { autoDelete: true });
        return false;
    }

    if (rule.location === 'channel') {
        const [isValidChannel] = await db.execute(`SELECT * FROM attendance_channels WHERE channel_id = ?`, [channel_id]);
        if (isValidChannel.length === 0) {
            await responseMessage(client, user_id, `Lệnh '${cmd}' chỉ có thể dùng trong kênh được chỉ định!`, { autoDelete: true });
            return false;
        }
    }

    if (!rule.roles.includes(role)) {
        await responseMessage(client, user_id, `Bạn không có quyền dùng lệnh '${cmd}'!`, { autoDelete: true });
        return false;
    }

    return true;
}

module.exports = {
    today,
    capitalizeFirstLetter,
    formatDuration,
    calculateDuration,
    responseMessage,
    checkCommandMiddleware
}