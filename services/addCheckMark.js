async function addCheckMark(client, channel, threadTs) {
    try {
        await client.reactions.add({
            name: 'white_check_mark',
            channel: channel,
            timestamp: threadTs,
        });
    } catch (error) {
        if (error.data && error.data.error === 'already_reacted') return;
        else console.error("Error adding reaction:", error);
    }
}
module.exports = { addCheckMark };