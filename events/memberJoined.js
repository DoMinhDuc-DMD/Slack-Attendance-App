module.exports = (app) => {
    app.event('member_joined_channel', async ({ event, say }) => {
        await say(`Welcome to the channel, <@${event.user}>! :tada::tada:`);
    });
};
