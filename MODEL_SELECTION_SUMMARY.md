# AI Model Selection Implementation

## Overview
Enhanced the AI integration system to allow admin users to select specific models for ChatGPT and Claude tasks, with cost-optimized defaults.

## Model Selection Options

### ChatGPT Models (Planning Tasks)
- **GPT-3.5 Turbo** (Default) - $0.0005 per 1K tokens - Most cost-effective
- **GPT-4o Mini** - $0.0015 per 1K tokens - Standard quality
- **GPT-4o** - $0.005 per 1K tokens - Premium option

### Claude Models (Writing Tasks) 
- **Claude 3.5 Sonnet (Latest)** (Default) - $0.003 per 1K tokens - Latest version (claude-3-5-sonnet-20241022)
- **Claude 3.5 Haiku** - $0.001 per 1K tokens - Faster, more cost-effective (claude-3-5-haiku-20241022)
- **Claude 3 Opus** - $0.015 per 1K tokens - Most capable (claude-3-opus-20240229)

## Implementation Details

### Admin Interface Updates
**Location**: `src/react-app/components/AdminDashboard.tsx`
- Added model selection dropdowns in Settings → AI/API Configuration
- Clear cost and capability indicators for each model
- Default selections favor cost optimization (GPT-3.5 Turbo) and current tech (Claude 3.5 Sonnet latest)

### Backend Integration
**Location**: `src/utils/ai-models.ts`
- Updated `getModelForTask()` to accept user settings
- Dynamic cost calculation based on selected models
- Settings passed through generation pipeline

### Database Integration
- Model preferences stored in settings table alongside API keys
- Settings loaded and passed to AI generation functions
- Both content routes (`create.ts`, `content-advanced.ts`) updated to use selected models

## Usage

### Admin Configuration
1. Navigate to Settings → AI/API Configuration
2. Select preferred ChatGPT model for planning tasks
3. Select preferred Claude model for writing tasks
4. Save settings

### Cost Impact Examples
**Cheapest Configuration** (GPT-3.5 + Claude Haiku):
- Planning: $0.0005 per 1K tokens
- Writing: $0.001 per 1K tokens
- Total: ~$0.0015 per 1K tokens

**Balanced Configuration** (GPT-4o Mini + Claude 3.5 Sonnet):
- Planning: $0.0015 per 1K tokens  
- Writing: $0.003 per 1K tokens
- Total: ~$0.0045 per 1K tokens

**Premium Configuration** (GPT-4o + Claude Opus):
- Planning: $0.005 per 1K tokens
- Writing: $0.015 per 1K tokens  
- Total: ~$0.02 per 1K tokens

## Defaults Rationale
- **ChatGPT Default**: GPT-3.5 Turbo for cost-effective planning
- **Claude Default**: Claude 3.5 Sonnet (latest) for high-quality writing with current model version
- Balances cost optimization with content quality

## Technical Architecture
```typescript
// Settings flow
Admin selects models → Stored in settings table → 
Retrieved by routes → Passed to AI utilities →
Model selected dynamically → Cost calculated accurately
```

All existing functionality preserved while adding flexible model selection with intelligent defaults.