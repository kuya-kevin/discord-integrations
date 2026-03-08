// notion.js
import 'dotenv/config';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

/**
 * Creates a new to-do page in the Notion database.
 * @param {string} title - The to-do text
 * @param {string} discordUser - The Discord username
 * @returns {object} The created Notion page
 */
export async function createTodo(title, discordUser) {
    const response = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
            // "Name" is the title property of your database
            Name: {
                title: [
                    {
                        text: { content: title },
                    },
                ],
            },
            // "Status" — set to "Not Started" by default
            Status: {
                status: { name: 'Not started' },
            },
            // "Discord User" — rich text property
            'Discord User': {
                rich_text: [
                    {
                        text: { content: discordUser },
                    },
                ],
            },
            // "Created" — date property
            Created: {
                date: { start: new Date().toISOString() },
            },
        },
    });

    return response;
}
