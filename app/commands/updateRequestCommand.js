const { checkCommandMiddleware, responseMessage } = require('../../services/utils');
const { loadingModal } = require('./blocks/loadingModal');
const { buildModal, buildBlocks } = require('./blocks/updateRequestBlocks');
const { getRequestOptions, getPeriodOptions } = require('../../services/modalOptions');

module.exports = (app, db) => {
    app.command('/capnhatnghi', async ({ command, ack, client }) => {
        await ack();

        const checkCommand = await checkCommandMiddleware(db, client, command);
        if (!checkCommand) return;

        const { user_id: userId, team_id: workspaceId, trigger_id } = command;

        const requestOptions = await getRequestOptions(db, workspaceId, userId);
        if (requestOptions.length === 0) {
            return await responseMessage(
                client, userId,
                `Bạn chưa có xin phép nghỉ nào để cập nhật. Hãy đăng ký nghỉ trước!`,
                { autoDelete: true }
            );
        }
        const loadingView = await loadingModal(client, trigger_id, 'Cập nhật yêu cầu nghỉ');

        try {
            const defaultRequest = requestOptions[0];
            const { periodPart, updatePeriodOptions } = getPeriodOptions(defaultRequest);

            const { blocks, fullDurationOption } = buildBlocks(periodPart, requestOptions, defaultRequest, updatePeriodOptions);

            const metadata = JSON.stringify({ userId, workspaceId, defaultRequest, requestOptions, updatePeriodOptions, fullDurationOption });
            await client.views.update({
                view_id: loadingView.view.id,
                view: buildModal(metadata, blocks)
            });
        } catch (error) {
            console.error('Error handling leave request:', error);
        }
    });

    app.action('update_request_input', async ({ body, ack, client }) => {
        await ack();
        try {
            const metadata = JSON.parse(body.view.private_metadata);

            const selectedRequest = body.actions[0].selected_option || metadata.defaultRequest;
            const { periodPart, updatePeriodOptions } = getPeriodOptions(selectedRequest);

            const { blocks, fullDurationOption } = buildBlocks(periodPart, metadata.requestOptions, selectedRequest, updatePeriodOptions);

            const newMetadata = JSON.stringify({ ...metadata, selectedRequest, updatePeriodOptions, fullDurationOption });

            await client.views.update({
                view_id: body.view.id,
                hash: body.view.hash,
                view: buildModal(newMetadata, blocks)
            });
        } catch (error) {
            console.error('Error handling leave request:', error);
        }
    });

    app.action('update_period_input', async ({ body, ack, client }) => {
        await ack();
        try {
            const metadata = JSON.parse(body.view.private_metadata);

            const selectedRequest = metadata.selectedRequest || metadata.defaultRequest;
            const selectedPeriod = body.actions[0].selected_option;

            const { blocks, fullDurationOption } = buildBlocks(selectedPeriod.value, metadata.requestOptions, selectedRequest, metadata.updatePeriodOptions);

            const newMetadata = JSON.stringify({ ...metadata, fullDurationOption });

            await client.views.update({
                view_id: body.view.id,
                hash: body.view.hash,
                view: buildModal(newMetadata, blocks)
            });
        } catch (error) {
            console.error('Error handling leave request:', error);
        }
    });
};
