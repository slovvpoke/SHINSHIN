import tmi from 'tmi.js';

export type ParticipantCallback = (username: string) => void;
export type ChatMessageCallback = (username: string, message: string) => void;

let client: tmi.Client | null = null;
let participantCallback: ParticipantCallback | null = null;
let chatMessageCallback: ChatMessageCallback | null = null;
let isConnected = false;

// Bot usernames to filter from chat
const BOT_USERNAMES = [
  'nightbot',
  'streamelements',
  'streamlabs',
  'moobot',
  'fossabot',
  'wizebot',
  'deepbot',
  'phantombot',
];

// Get Twitch connection config from environment
function getConfig(): tmi.Options {
  const channel = process.env.TWITCH_CHANNEL || 'shinneeshinn';
  const username = process.env.TWITCH_BOT_USERNAME;
  const token = process.env.TWITCH_OAUTH_TOKEN;
  
  const options: tmi.Options = {
    options: { debug: process.env.NODE_ENV !== 'production' },
    connection: {
      reconnect: true,
      secure: true,
    },
    channels: [channel],
  };
  
  // Add identity if bot credentials provided
  if (username && token) {
    options.identity = {
      username,
      password: token,
    };
  }
  
  return options;
}

// Initialize Twitch client
export async function initTwitch(
  onParticipant: ParticipantCallback,
  onChatMessage?: ChatMessageCallback
): Promise<boolean> {
  participantCallback = onParticipant;
  chatMessageCallback = onChatMessage || null;
  
  try {
    client = new tmi.Client(getConfig());
    
    // Set up event handlers
    client.on('connected', (address, port) => {
      console.log(`Connected to Twitch IRC at ${address}:${port}`);
      isConnected = true;
    });
    
    client.on('disconnected', (reason) => {
      console.log(`Disconnected from Twitch: ${reason}`);
      isConnected = false;
    });
    
    client.on('message', (channel, tags, message, self) => {
      // Ignore bot's own messages
      if (self) return;
      
      const username = tags['display-name'] || tags.username || 'anonymous';
      const usernameLower = username.toLowerCase();
      
      // Filter out bot messages
      if (BOT_USERNAMES.includes(usernameLower)) {
        return;
      }
      
      // Send all messages to chat callback
      if (chatMessageCallback) {
        chatMessageCallback(username, message);
      }
      
      // Check for join keyword
      const keyword = process.env.JOIN_KEYWORD || 'легенда';
      const msgLower = message.toLowerCase().trim();
      
      if (msgLower.includes(keyword.toLowerCase())) {
        console.log(`Participant joined: ${username}`);
        if (participantCallback) {
          participantCallback(username);
        }
      }
    });
    
    // Connect to Twitch
    await client.connect();
    return true;
  } catch (error) {
    console.error('Failed to connect to Twitch:', error);
    isConnected = false;
    return false;
  }
}

// Get connection status
export function getTwitchStatus(): { connected: boolean; channel: string } {
  return {
    connected: isConnected,
    channel: process.env.TWITCH_CHANNEL || 'shinneeshinn',
  };
}

// Disconnect from Twitch
export async function disconnectTwitch(): Promise<void> {
  if (client) {
    await client.disconnect();
    client = null;
    isConnected = false;
  }
}

// Send message to channel (if bot has permissions)
export async function sendMessage(message: string): Promise<boolean> {
  if (!client || !isConnected) return false;
  
  try {
    const channel = process.env.TWITCH_CHANNEL || 'shinneeshinn';
    await client.say(channel, message);
    return true;
  } catch (error) {
    console.error('Failed to send message:', error);
    return false;
  }
}
