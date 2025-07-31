module.exports = (app) => {
    app.message(/\b(hi|hello|hey)\b/i, async ({ message, say, context }) => {
        const botUserId = context.botUserId;
        const mentionedUsers = message.text.match(/<@[\w]+>/g);

        if (mentionedUsers && mentionedUsers.includes(`<@${botUserId}>`)) {
            await say(`Hello <@${message.user}>! :wave:`);
        }
    });
}