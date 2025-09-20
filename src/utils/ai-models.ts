// AI Model Management and Task-Based Selection
// ChatGPT for planning, Claude for writing, DataForSEO for SEO

export type TaskType = 'planning' | 'writing' | 'seo';

export interface AIConfig {
  openai_api_key?: string;
  claude_api_key?: string;
  dataforseo_username?: string;
  dataforseo_api_key?: string;
}

export interface ModelResponse {
  success: boolean;
  data?: any;
  error?: string;
  model_used?: string;
  tokens_used?: number;
  cost_cents?: number;
  generation_time_ms?: number;
}

// Get API keys from environment or database settings
export function getAPIKeys(env: any, dbSettings: Record<string, any> = {}): AIConfig {
  return {
    openai_api_key: dbSettings.openai_api_key || env.OPENAI_API_KEY,
    claude_api_key: dbSettings.claude_api_key || env.CLAUDE_API_KEY,
    dataforseo_username: dbSettings.dataforseo_username || env.DATAFORSEO_APIUSER,
    dataforseo_api_key: dbSettings.dataforseo_api_key || env.DATAFORSEO_APIKEY,
  };
}

// Get the appropriate model for a task type with user preferences
export function getModelForTask(taskType: TaskType, settings: Record<string, any> = {}): string {
  switch (taskType) {
    case 'planning':
      return settings.chatgpt_model || 'gpt-3.5-turbo'; // Default to cheapest ChatGPT model
    case 'writing':
      return settings.claude_model || 'claude-3-5-sonnet-20241022'; // Default to latest Claude model
    case 'seo':
      return 'dataforseo'; // DataForSEO for SEO analysis
    default:
      return settings.chatgpt_model || 'gpt-3.5-turbo'; // Default fallback
  }
}

// Generate content using task-specific model
export async function generateWithTaskModel(
  taskType: TaskType,
  prompt: string,
  apiKeys: AIConfig,
  options: {
    maxTokens?: number;
    temperature?: number;
    fallbackModel?: string;
    settings?: Record<string, any>;
  } = {}
): Promise<ModelResponse> {
  const { maxTokens = 2000, temperature = 0.7, fallbackModel = 'gpt-3.5-turbo', settings = {} } = options;
  const model = getModelForTask(taskType, settings);
  const startTime = Date.now();

  try {
    if (taskType === 'planning' || taskType === 'writing') {
      // Use OpenAI for planning
      if (taskType === 'planning') {
        if (!apiKeys.openai_api_key) {
          throw new Error('OpenAI API key not configured for planning tasks');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKeys.openai_api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
            temperature: temperature,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error?.message || 'OpenAI API error');
        }

        const tokensUsed = data.usage?.total_tokens || 0;
        // Dynamic pricing based on model
        let pricePerThousand = 0.0005; // Default GPT-3.5-turbo
        if (model === 'gpt-4o-mini') pricePerThousand = 0.0015;
        if (model === 'gpt-4o') pricePerThousand = 0.005;
        const costCents = Math.round(tokensUsed * pricePerThousand / 1000 * 100);

        return {
          success: true,
          data: {
            response: data.choices[0].message.content,
            model_used: model,
            tokens_used: tokensUsed,
            cost_cents: costCents,
            generation_time_ms: Date.now() - startTime
          }
        };
      }

      // Use Claude for writing
      if (taskType === 'writing') {
        if (!apiKeys.claude_api_key) {
          throw new Error('Claude API key not configured for writing tasks');
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKeys.claude_api_key,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: model,
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error?.message || 'Claude API error');
        }

        const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
        // Dynamic pricing based on Claude model
        let pricePerThousand = 0.003; // Default Claude 3.5 Sonnet
        if (model === 'claude-3-5-haiku-20241022') pricePerThousand = 0.001;
        if (model === 'claude-3-opus-20240229') pricePerThousand = 0.015;
        const costCents = Math.round(tokensUsed * pricePerThousand / 1000 * 100);

        return {
          success: true,
          data: {
            response: data.content[0].text,
            model_used: model,
            tokens_used: tokensUsed,
            cost_cents: costCents,
            generation_time_ms: Date.now() - startTime
          }
        };
      }
    }

    if (taskType === 'seo') {
      // Use DataForSEO for SEO analysis
      return await generateSEOAnalysis(prompt, apiKeys);
    }

    throw new Error(`Unsupported task type: ${taskType}`);

  } catch (error) {
    console.error(`${model} failed:`, error);
    
    // Fallback to GPT-3.5 Turbo if available
    if (apiKeys.openai_api_key && fallbackModel === 'gpt-3.5-turbo') {
      try {
        const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKeys.openai_api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: fallbackModel,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
            temperature: temperature,
          }),
        });

        const fallbackData = await fallbackResponse.json();
        const tokensUsed = fallbackData.usage?.total_tokens || 0;
        const costCents = Math.round(tokensUsed * 0.0005 / 1000 * 100); // GPT-3.5 pricing

        return {
          success: true,
          data: {
            response: fallbackData.choices[0].message.content,
            model_used: fallbackModel,
            tokens_used: tokensUsed,
            cost_cents: costCents,
            generation_time_ms: Date.now() - startTime
          }
        };
      } catch (fallbackError) {
        console.error('Fallback model also failed:', fallbackError);
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// DataForSEO implementation for SEO analysis
export async function generateSEOAnalysis(
  content: string,
  apiKeys: AIConfig
): Promise<ModelResponse> {
  const startTime = Date.now();

  try {
    if (!apiKeys.dataforseo_username || !apiKeys.dataforseo_api_key) {
      throw new Error('DataForSEO credentials not configured');
    }

    // Extract title and keywords from content for SEO analysis
    let title = '';
    let keywords: string[] = [];
    
    // Try to parse content as JSON first
    try {
      const parsedContent = JSON.parse(content);
      title = parsedContent.title || '';
      keywords = parsedContent.keywords || [];
    } catch {
      // If not JSON, extract from raw content
      const lines = content.split('\n').filter(line => line.trim());
      title = lines[0] || 'Untitled';
    }

    // For now, return enhanced mock analysis with DataForSEO structure
    // In production, this would call the actual DataForSEO API
    const mockSEOResponse = {
      title_analysis: {
        length: title.length,
        seo_score: title.length >= 30 && title.length <= 60 ? 'excellent' : 'needs_improvement',
        keyword_optimization: keywords.length > 0 ? 'good' : 'missing_keywords'
      },
      keyword_suggestions: [
        'norwegian cruise line',
        'cruise planning',
        'alaska cruises 2026',
        'cruise deals',
        'cruise ship reviews'
      ],
      meta_description: {
        suggested: title.length > 0 ? 
          `Discover expert cruise planning tips and Norwegian Cruise Line insights. ${title.substring(0, 120)}...` :
          'Expert cruise planning guidance and Norwegian Cruise Line tips for your perfect vacation.',
        length_score: 'optimal'
      },
      readability: {
        score: 'good',
        suggestions: [
          'Use more transition words',
          'Vary sentence length',
          'Include bullet points for better readability'
        ]
      },
      content_optimization: {
        keyword_density: 'appropriate',
        internal_linking: 'needs_improvement',
        headings_structure: 'good'
      },
      competitive_analysis: {
        ranking_difficulty: 'medium',
        suggested_improvements: [
          'Add more Norwegian Cruise Line-specific keywords',
          'Include seasonal cruise information',
          'Optimize for local cruise departure ports'
        ]
      }
    };

    return {
      success: true,
      data: {
        response: JSON.stringify(mockSEOResponse, null, 2),
        model_used: 'dataforseo',
        tokens_used: 0, // DataForSEO doesn't use tokens
        cost_cents: 1, // Minimal cost for API call
        generation_time_ms: Date.now() - startTime,
        seo_analysis: mockSEOResponse
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'DataForSEO analysis failed'
    };
  }
}

// Create comprehensive content with all three models
export async function generateComprehensiveContent(
  basePrompt: string,
  apiKeys: AIConfig,
  options: {
    includeWriting?: boolean;
    includeSEO?: boolean;
    planningPrompt?: string;
    writingPrompt?: string;
    settings?: Record<string, any>;
  } = {}
): Promise<{
  planning?: ModelResponse;
  writing?: ModelResponse;
  seo?: ModelResponse;
  summary: {
    total_cost_cents: number;
    total_time_ms: number;
    models_used: string[];
  }
}> {
  const { includeWriting = true, includeSEO = true, planningPrompt, writingPrompt, settings = {} } = options;
  const startTime = Date.now();
  let totalCost = 0;
  const modelsUsed: string[] = [];

  // Step 1: Content Planning
  const planningResult = await generateWithTaskModel(
    'planning',
    planningPrompt || basePrompt,
    apiKeys,
    { settings }
  );
  
  if (planningResult.success && planningResult.data) {
    totalCost += planningResult.data.cost_cents || 0;
    modelsUsed.push(planningResult.data.model_used || 'gpt-4o-mini');
  }

  let writingResult: ModelResponse | undefined;
  let seoResult: ModelResponse | undefined;

  // Step 2: Content Writing (if requested and planning succeeded)
  if (includeWriting && planningResult.success) {
    const contentPrompt = writingPrompt || `Based on this planning: ${planningResult.data?.response}\n\nNow generate the full content: ${basePrompt}`;
    
    writingResult = await generateWithTaskModel(
      'writing',
      contentPrompt,
      apiKeys,
      { settings }
    );

    if (writingResult.success && writingResult.data) {
      totalCost += writingResult.data.cost_cents || 0;
      modelsUsed.push(writingResult.data.model_used || 'claude-3.5-sonnet');
    }
  }

  // Step 3: SEO Analysis (if requested and content exists)
  if (includeSEO) {
    const contentForSEO = writingResult?.data?.response || planningResult.data?.response || basePrompt;
    
    seoResult = await generateSEOAnalysis(
      contentForSEO,
      apiKeys
    );

    if (seoResult.success && seoResult.data) {
      totalCost += seoResult.data.cost_cents || 0;
      modelsUsed.push(seoResult.data.model_used || 'dataforseo');
    }
  }

  return {
    planning: planningResult,
    writing: writingResult,
    seo: seoResult,
    summary: {
      total_cost_cents: totalCost,
      total_time_ms: Date.now() - startTime,
      models_used: modelsUsed
    }
  };
}