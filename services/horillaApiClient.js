const axios = require('axios');

class HorillaApiClient {
  constructor() {
    this.baseUrl = process.env.HORILLA_API_URL
    this.slackToken = process.env.BOT_USER_OAUTH_TOKEN
    this.apiTimeout = 10000

    // setup axios instance
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.apiTimeout,
      headers: {
        "Content-Type": "application/json",
        "X-Slack-Token": this.slackToken,
      },
    })
  }

  // Create mapping between Slack user and Horilla employee
  async createSlackUserMapping(slackUserId, slackTeamId, employeeEmail) {
    try {
      const response = await this.client.post("/leave/api/slack/create-user-mapping/", {
        slack_user_id: slackUserId,
        slack_team_id: slackTeamId,
        employee_email: employeeEmail,
      })

      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Create leave request
  async createLeaveRequest(
    slackUserId,
    slackTeamId,
    leaveDate,
    leavePeriod,
    leaveDuration,
    leaveReason,
    reasonNote,
    timestamp,
    description = "Leave request from Slack"
  ) {
    try {
      const payload = {
        slack_user_id: slackUserId,
        slack_team_id: slackTeamId,
        leave_date: leaveDate,
        leave_period: leavePeriod,
        leave_duration: leaveDuration,
        leave_reason: leaveReason,
        reason_note: reasonNote,
        timestamp: timestamp,
      }

      const response = await this.client.post("/leave/api/slack/create-leave-request/", payload)

      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        status: error.response?.status,
      }
    }
  }

  // Update leave request status
  async updateLeaveRequestStatus(slackUserId, slackTeamId, slackTimestamp, newStatus) {
    try {
      console.log(slackUserId, slackTeamId, slackTimestamp, newStatus)
      const response = await this.client.post("/leave/api/slack/update-leave-request/", {
        slack_user_id: slackUserId,
        slack_team_id: slackTeamId,
        slack_timestamp: slackTimestamp,
        new_status: newStatus,
      })

      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Get leave request status
  async getLeaveRequestStatus(slackUserId, slackTeamId, slackTimestamp) {
    try {
      const response = await this.client.get("/leave/api/slack/get-leave-status/", {
        params: {
          slack_user_id: slackUserId,
          slack_team_id: slackTeamId,
          slack_timestamp: slackTimestamp,
        },
      })

      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }
}

const horillaAPi = new HorillaApiClient()

module.exports = horillaAPi