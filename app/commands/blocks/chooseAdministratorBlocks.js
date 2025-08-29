const channelBlock = (options, initial) => ({
    type: 'input',
    block_id: 'channel_block',
    dispatch_action: true,
    label: { type: 'plain_text', text: 'Chọn kênh:' },
    element: {
        type: 'static_select',
        action_id: 'channel_select',
        placeholder: { type: 'plain_text', text: 'Chọn một kênh' },
        options,
        initial_option: initial
    }
});

const userBlock = (options) => ({
    type: 'input',
    block_id: 'user_block',
    label: { type: 'plain_text', text: 'Chọn quản trị viên:' },
    element: {
        type: 'static_select',
        action_id: 'user_select',
        placeholder: { type: 'plain_text', text: 'Chọn một người dùng' },
        options
    }
});

const buildModal = (channelOptions, defaultChannel, userOptions) => ({
    type: 'modal',
    callback_id: 'choose_administrator_modal',
    private_metadata: JSON.stringify({ channelOptions, userOptions }),
    title: { type: 'plain_text', text: 'Chọn thông tin quản trị' },
    submit: { type: 'plain_text', text: 'Xác nhận' },
    close: { type: 'plain_text', text: 'Huỷ' },
    blocks: [
        channelBlock(channelOptions, defaultChannel),
        userBlock(userOptions)
    ]
});

module.exports = {
    buildModal
}