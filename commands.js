import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Notion to-do command
const TODO_COMMAND = {
  name: 'todo',
  description: 'Add a to-do item to Notion',
  options: [
    {
      type: 3,
      name: 'task',
      description: 'What needs to be done?',
      required: true,
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const ALL_COMMANDS = [TEST_COMMAND, TODO_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
