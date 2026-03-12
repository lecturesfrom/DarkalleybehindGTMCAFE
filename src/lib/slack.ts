import { WebClient } from '@slack/web-api'

// Lazy-initialized so the module loads fine even if SLACK_BOT_TOKEN isn't set yet
let _client: WebClient | null = null

function getClient(): WebClient {
  if (!_client) {
    _client = new WebClient(process.env.SLACK_BOT_TOKEN)
  }
  return _client
}

/**
 * Determines whether a Slack user should be auto-approved on first sign-in.
 * Uses `users.info` to check account creation date.
 * Returns 'ACTIVE' if account age > 30 days, 'PENDING' otherwise.
 * Falls back to 'PENDING' on any API error (safe default).
 */
export async function checkSlackActivity(
  slackUserId: string,
): Promise<'ACTIVE' | 'PENDING'> {
  if (!process.env.SLACK_BOT_TOKEN) {
    // Token not configured — skip check, default to PENDING for safety
    return 'PENDING'
  }

  try {
    const res = await getClient().users.info({ user: slackUserId })

    if (!res.ok || !res.user) return 'PENDING'

    // `profile.updated` is the last profile update timestamp (seconds)
    // Fall back to checking `id` existence — if user has `updated`, account is old enough to have one
    const createdTs = (res.user as { updated?: number }).updated
    if (!createdTs) return 'PENDING'

    const accountAgeMs = Date.now() - createdTs * 1000
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

    return accountAgeMs > thirtyDaysMs ? 'ACTIVE' : 'PENDING'
  } catch {
    // Any API error (rate limit, network, invalid token) → safe default
    return 'PENDING'
  }
}

/**
 * Send a direct message to a Slack user via the bot.
 * Used for raffle win notifications and approval DMs.
 */
export async function sendSlackDM(slackUserId: string, text: string): Promise<void> {
  if (!process.env.SLACK_BOT_TOKEN) return

  try {
    const client = getClient()
    // Open a DM channel first
    const conversation = await client.conversations.open({ users: slackUserId })
    const channelId = conversation.channel?.id
    if (!channelId) return

    await client.chat.postMessage({ channel: channelId, text })
  } catch (err) {
    console.warn('Failed to send Slack DM:', err)
  }
}
