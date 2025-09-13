import { BedrockRuntimeClient, ConverseCommand, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export const CLAUDE_MODEL_ID = process.env.BEDROCK_MODEL_ID || process.env.VITE_BEDROCK_MODEL_ID || 'anthropic.claude-3-5-haiku-20241022-v1:0';
export const TITAN_IMAGE_MODEL_ID = process.env.TITAN_IMAGE_MODEL_ID || 'amazon.titan-image-generator-v2:0';

export const createBedrockClient = () => {
  const region = process.env.AWS_REGION || process.env.BEDROCK_REGION || 'us-west-2';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
  const sessionToken = process.env.AWS_SESSION_TOKEN;
  return new BedrockRuntimeClient({
    region,
    credentials: sessionToken
      ? { accessKeyId, secretAccessKey, sessionToken }
      : { accessKeyId, secretAccessKey },
  });
};

export const callClaude = async (prompt: string) => {
  const client = createBedrockClient();
  const converse = new ConverseCommand({
    modelId: CLAUDE_MODEL_ID,
    messages: [
      { role: 'user', content: [{ text: prompt }] },
    ],
    inferenceConfig: { maxTokens: 4000, temperature: 0.7, topP: 1 },
  });
  const response = await client.send(converse);
  const blocks = response.output?.message?.content || [];
  const text = blocks.map((b: any) => b?.text).filter(Boolean).join('\n').trim();
  if (!text) throw new Error('Empty response from Claude');
  return text;
};

