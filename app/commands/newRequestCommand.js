const { checkCommandMiddleware } = require('../../services/utils');
const { loadingModal } = require('./blocks/loadingModal');
const { defaultOptions, buildBlocks, buildModal } = require('./blocks/newRequestBlocks');

module.exports = (app, db) => {
    app.command('/xinnghi', async ({ command, ack, client }) => {
        await ack();

        const checkCommand = await checkCommandMiddleware(db, client, command);
        if (!checkCommand) return;

        const { user_id: userId, team_id: workspaceId, trigger_id } = command;
        const loadingView = await loadingModal(client, trigger_id, 'Xin phép nghỉ');

        try {
            const { blocks, fullDurationOption } = buildBlocks(defaultOptions.period, defaultOptions.duration, defaultOptions.reason);
            const metadata = JSON.stringify({
                userId, workspaceId,
                selectedPeriod: defaultOptions.period,
                selectedDuration: defaultOptions.duration,
                selectedReason: defaultOptions.reason,
                fullDurationOption
            });

            await client.views.update({
                view_id: loadingView.view.id,
                view: buildModal(metadata, blocks)
            });
        } catch (error) {
            console.error('Error handling leave request:', error);
        }
    });

    app.action('new_period_input', async ({ body, ack, client }) => {
        await ack();
        try {
            const metadata = JSON.parse(body.view.private_metadata);

            const selectedPeriod = body.actions[0].selected_option;
            const selectedDuration = metadata.selectedDuration || defaultOptions.duration;
            const selectedReason = metadata.selectedReason || defaultOptions.reason;

            const { blocks, fullDurationOption } = buildBlocks(selectedPeriod, selectedDuration, selectedReason);
            const newMetadata = JSON.stringify({ ...metadata, selectedPeriod, selectedDuration, selectedReason, fullDurationOption });

            await client.views.update({
                view_id: body.view.id,
                hash: body.view.hash,
                view: buildModal(newMetadata, blocks)
            });
        } catch (error) {
            console.error('Error handling leave request:', error);
        }
    });

    app.action('new_reason_select_input', async ({ body, ack, client }) => {
        await ack();
        try {
            const metadata = JSON.parse(body.view.private_metadata);

            const selectedPeriod = metadata.selectedPeriod || defaultOptions.period;
            const selectedDuration = metadata.selectedDuration || defaultOptions.duration;
            const selectedReason = body.actions[0].selected_option;

            const { blocks, fullDurationOption } = buildBlocks(selectedPeriod, selectedDuration, selectedReason);
            const newMetadata = JSON.stringify({ ...metadata, selectedPeriod, selectedDuration, selectedReason, fullDurationOption });

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