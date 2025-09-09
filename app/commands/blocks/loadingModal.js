const loadingModal = async (client, trigger_id, titleText) => {
    return await client.views.open({
        trigger_id,
        view: {
            type: 'modal',
            title: { type: 'plain_text', text: titleText },
            close: { type: 'plain_text', text: 'Đóng' },
            blocks: [
                {
                    type: 'section',
                    text: { type: 'plain_text', text: '⏳ Đang tải ...' }
                }
            ]
        }
    });
}

module.exports = { loadingModal }