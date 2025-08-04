async function addIcon(client, channel, threadTs, icon) {
    try {
        await client.reactions.add({
            name: icon,
            channel: channel,
            timestamp: threadTs,
        });
    } catch (error) {
        if (error.data && error.data.error === 'already_reacted') return;
        else console.error("Error adding reaction:", error);
    }
}
module.exports = { addIcon };