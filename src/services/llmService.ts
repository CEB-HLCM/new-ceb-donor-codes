const STORAGE_KEY = 'ceb-llm-api-config';

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

const defaults: LlmConfig = {
  apiKey: '',
  baseUrl: 'https://api.groq.com/openai/v1',
  model: 'openai/gpt-oss-120b',
};

export function loadLlmConfig(): LlmConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...defaults };
}

export function saveLlmConfig(config: LlmConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export async function callLlm(
  config: LlmConfig,
  prompt: string,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
    signal,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LLM API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}
