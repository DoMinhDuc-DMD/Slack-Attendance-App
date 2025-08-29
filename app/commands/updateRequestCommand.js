const { responseMessage, periodMapOptions } = require("../../services/utils");
const { getRequestOptions, periodOptions, buildModal, requestBlock, buildBlocks } = require("./blocks/updateRequestBlocks");

module.exports = (app, db) => {
    app.command('/capnhatnghi', async ({ command, ack, client }) => {
        await ack();
        try {
            const { user_id: userId, team_id: workspaceId, trigger_id } = command;

            const requestOptions = await getRequestOptions(db, workspaceId, userId);
            if (requestOptions.length === 0) {
                return await responseMessage(client, userId, `Bạn chưa có yêu cầu xin nghỉ nào để cập nhật. Hãy đăng ký nghỉ trước!`);
            }
            const selectedRequest = requestOptions[0];

            const metadata = JSON.stringify({ userId, workspaceId, requestOptions });
            const blocks = [
                requestBlock(requestOptions, selectedRequest)
            ];

            await client.views.open({
                trigger_id,
                view: buildModal(metadata, blocks)
            });
        } catch (error) {
            console.error("Error handling leave request:", error);
        }
    });

    app.action('update_request_input', async ({ body, ack, client }) => {
        await ack();
        try {
            const metadata = JSON.parse(body.view.private_metadata);

            const selectedRequest = body.actions[0].selected_option;

            const periodRequest = selectedRequest.value.split(" ").slice(0, -1).join(" ");
            const { leavePeriod } = periodMapOptions[periodRequest];

            const periodPart = leavePeriod.split("_")[1];
            const updatePeriodOptions = periodOptions.filter(p => p.value.includes(periodPart) || p.value.includes('day'));

            const { blocks, fullDurationOption } = buildBlocks(periodPart, metadata.requestOptions, selectedRequest, updatePeriodOptions);

            const newMetadata = JSON.stringify({ ...metadata, selectedRequest, updatePeriodOptions, fullDurationOption });

            await client.views.update({
                view_id: body.view.id,
                hash: body.view.hash,
                view: buildModal(newMetadata, blocks)
            });
        } catch (error) {
            console.error("Error handling leave request:", error);
        }
    });

    app.action('update_period_input', async ({ body, ack, client }) => {
        await ack();
        try {
            const metadata = JSON.parse(body.view.private_metadata);

            const selectedPeriod = body.actions[0].selected_option;

            const { blocks, fullDurationOption } = buildBlocks(selectedPeriod.value, metadata.requestOptions, metadata.selectedRequest, metadata.updatePeriodOptions);

            const newMetadata = JSON.stringify({ ...metadata, fullDurationOption });

            await client.views.update({
                view_id: body.view.id,
                hash: body.view.hash,
                view: buildModal(newMetadata, blocks)
            });
        } catch (error) {
            console.error("Error handling leave request:", error);
        }
    });
};
