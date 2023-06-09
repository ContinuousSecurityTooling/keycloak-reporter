import { IncomingWebhook as TeamsWebhook } from 'ms-teams-webhook';
import { Block, SectionBlock } from '@slack/types';
import { IncomingWebhook as SlackWebhook } from '@slack/webhook';

enum WebhookType {
  SLACK = 'slack',
  TEAMS = 'teams',
}

export interface WebhookMessage {
  url: string;
  type: WebhookType;
}

export async function post2Webhook(
  type: string,
  url: string,
  title: string,
  reportContent: string
): Promise<unknown> {
  //const title= 'Keycloak Reporting';
  const date = new Date();
  switch (type) {
    case WebhookType.TEAMS.toString():
      return new TeamsWebhook(url).send({
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: {
              $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
              type: 'AdaptiveCard',
              version: '1.2',
              body: [
                {
                  type: 'FactSet',
                  facts: [
                    {
                      title: 'Type',
                      value: title,
                    },
                    {
                      title: 'Date',
                      value: `${date.getDate()}-${
                        date.getMonth() + 1
                      }-${date.getFullYear()}`,
                    },
                  ],
                },
              ],
              actions: [
                {
                  type: 'Action.ShowCard',
                  title: 'Show raw report data',
                  card: {
                    type: 'AdaptiveCard',
                    body: [
                      {
                        type: 'TextBlock',
                        text: reportContent,
                        wrap: true,
                      },
                    ],
                    $schema:
                      'http://adaptivecards.io/schemas/adaptive-card.json',
                  },
                },
              ],
            },
          },
        ],
      });
    // defaulting to Slack
    default:
      return new SlackWebhook(url).send({
        blocks: [
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Type*: ${title}` },
              {
                type: 'mrkdwn',
                text: `*Date*: ${date.getDate()}-${
                  date.getMonth() + 1
                }-${date.getFullYear()}`,
              },
            ],
          },
          {
            type: 'divider',
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `
\`\`\`
${reportContent}
\`\`\`
`
              },
            ],
          },
          {
            type: 'context',
            elements: [{ type: 'plain_text', text: 'Raw report data' }],
          },
        ],
      });
  }
}

/*
 */
