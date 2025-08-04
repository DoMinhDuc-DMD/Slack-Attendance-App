async function responseInThread(client, channel, threadTs, text) {
    await client.chat.postMessage({
        channel: channel,
        thread_ts: threadTs,
        text: text
    });
}

module.exports = { responseInThread }