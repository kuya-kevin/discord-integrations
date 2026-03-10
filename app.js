import 'dotenv/config';
import express from 'express';
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRandomEmoji, DiscordRequest } from './utils.js';
import { createTodo } from './notion.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction id, type and data
  const { id, type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "test" command
    if (name === 'test') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [
            {
              type: MessageComponentTypes.TEXT_DISPLAY,
              // Fetches a random emoji to send from a helper function
              content: `hello world ${getRandomEmoji()}`
            }
          ]
        },
      });
    }

    // "todo" command — creates a Notion to-do
    if (name === 'todo') {
      const taskText = data.options.find(opt => opt.name === 'task').value;
      const username = req.body.member?.user?.username
        ?? req.body.user?.username
        ?? 'Unknown';
      const token = req.body.token;

      // Immediately acknowledge to satisfy Discord's 3-second response deadline
      res.send({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });

      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Notion request timed out')), 10_000)
      );

      Promise.race([createTodo(taskText, username), timeout])
        .then(() => {
          return DiscordRequest(
            `/webhooks/${process.env.APP_ID}/${token}/messages/@original`,
            {
              method: 'PATCH',
              body: {
                flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: `✅ Added to Notion: **${taskText}**` }],
              },
            }
          );
        })
        .catch((error) => {
          console.error('Notion API error:', error);
          return DiscordRequest(
            `/webhooks/${process.env.APP_ID}/${token}/messages/@original`,
            {
              method: 'PATCH',
              body: {
                flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: '❌ Failed to add to-do to Notion. Check server logs.' }],
              },
            }
          );
        });

      return;
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
