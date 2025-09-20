import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import './ContentGenerator.css';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface Post {
  id: number;
  title: string;
  status: 'draft' | 'approved' | 'scheduled' | 'published';
  post_type: 'monday' | 'wednesday' | 'friday' | 'saturday' | 'newsletter';
  persona?: 'easy_breezy' | 'thrill_seeker' | 'luxe_seafarer';
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  author_name?: string;
  excerpt?: string;
}

interface ContentGeneratorProps {
  user: User;
  onPostCreated: (post: Post) => void;
}

interface GenerationResult {
  post_id: number;
  title: string;
  excerpt: string;
  content_blocks: any[];
  keywords: string[];
  model_used: string;
  generation_time_ms: number;
  tokens_used: number;
  cost_cents: number;
  featured_image_suggestion: string;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({ user, onPostCreated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    prompt: '',
    post_type: 'monday' as const,
    persona: '' as 'easy_breezy' | 'thrill_seeker' | 'luxe_seafarer' | '',
    category: 'general',
    tags: [] as string[],
    model_preference: 'standard' as 'cheap' | 'standard' | 'premium',
    week_themes: {
      main: '',
      secondary: '',
      tertiary: ''
    }
  });
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const postTypeDescriptions = {
    monday: 'Awareness/Big Picture - Seasonal urgency, wanderlust, future planning focus',
    wednesday: 'Practical/Consideration - Evergreen expertise, comparisons, myth-busting',
    friday: 'Aspirational/Deep Dive - Milestones, detailed planning, comprehensive guides',
    saturday: 'Inspirational/Shareable - Wow-factor content, lifestyle resonance, viral potential',
    newsletter: 'Weekly Newsletter - The Sunday Compass with persona-specific intro'
  };

  const personaDescriptions = {
    easy_breezy: 'Stress-free, simple cruise planning with gentle guidance',
    thrill_seeker: 'Adventure-focused, unique experiences, active excursions',
    luxe_seafarer: 'Premium experiences, sophisticated luxury, elevated service'
  };

  const modelDescriptions = {
    cheap: 'GPT-3.5 Turbo - Fast & economical ($0.0005/1K tokens)',
    standard: 'GPT-4o Mini - Balanced quality & cost ($0.0015/1K tokens)',
    premium: 'Claude 3.5 Sonnet - Highest quality ($0.003/1K tokens)'
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    if (field.startsWith('week_themes.')) {
      const themeField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        week_themes: {
          ...prev.week_themes,
          [themeField]: value
        }
      }));
    } else if (field === 'tags') {
      setFormData(prev => ({
        ...prev,
        tags: Array.isArray(value) ? value : []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const generateContent = async () => {
    if (!formData.prompt.trim()) {
      setError('Please enter a content prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationResult(null);

    try {
      const response = await fetch('/api/create/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          prompt: formData.prompt,
          post_type: formData.post_type,
          persona: formData.persona || null,
          category: formData.category,
          tags: formData.tags,
          week_themes: formData.week_themes,
          model_preference: formData.model_preference
        })
      });

      const data = await response.json();

      if (data.success) {
        setGenerationResult(data.data);
        
        // Create post object for the parent component
        const newPost: Post = {
          id: data.data.post_id,
          title: data.data.title,
          status: 'draft',
          post_type: formData.post_type,
          persona: formData.persona || undefined,
          category: formData.category,
          tags: formData.tags,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author_name: user.name,
          excerpt: data.data.excerpt
        };
        
        onPostCreated(newPost);
      } else {
        setError(data.error || 'Content generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setError('Network error - please try again');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      prompt: '',
      post_type: 'monday',
      persona: '',
      category: 'general',
      tags: [],
      model_preference: 'standard',
      week_themes: {
        main: '',
        secondary: '',
        tertiary: ''
      }
    });
    setGenerationResult(null);
    setError(null);
  };

  if (generationResult) {
    return (
      <div className="content-generator">
        <div className="generation-success">
          <div className="success-header">
            <h2>✨ Content Generated Successfully!</h2>
            <button className="btn btn-secondary" onClick={resetForm}>
              Generate Another
            </button>
          </div>

          <div className="generation-stats">
            <div className="stat-card">
              <h4>Model Used</h4>
              <p>{generationResult.model_used}</p>
            </div>
            <div className="stat-card">
              <h4>Generation Time</h4>
              <p>{(generationResult.generation_time_ms / 1000).toFixed(1)}s</p>
            </div>
            <div className="stat-card">
              <h4>Tokens Used</h4>
              <p>{generationResult.tokens_used.toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <h4>Cost</h4>
              <p>${(generationResult.cost_cents / 100).toFixed(3)}</p>
            </div>
          </div>

          <div className="content-preview">
            <h3>Generated Content Preview</h3>
            
            <div className="preview-item">
              <h4>Title</h4>
              <p className="title-preview">{generationResult.title}</p>
            </div>

            <div className="preview-item">
              <h4>Excerpt</h4>
              <p>{generationResult.excerpt}</p>
            </div>

            <div className="preview-item">
              <h4>Content Structure</h4>
              <div className="blocks-preview">
                {generationResult.content_blocks.map((block, index) => (
                  <div key={index} className={`block-preview block-${block.type}`}>
                    <span className="block-type">{block.type}</span>
                    <span className="block-content">
                      {block.type === 'heading' && `H${block.level}: ${block.content}`}
                      {block.type === 'paragraph' && block.content.substring(0, 80) + '...'}
                      {block.type === 'accent_tip' && `💡 ${block.content.substring(0, 60)}...`}
                      {block.type === 'image' && `🖼️ ${block.alt}`}
                      {block.type === 'quote' && `"${block.content.substring(0, 50)}..."`}
                      {block.type === 'cta' && `🔗 ${block.text}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {generationResult.keywords.length > 0 && (
              <div className="preview-item">
                <h4>SEO Keywords</h4>
                <div className="keywords">
                  {generationResult.keywords.map((keyword, index) => (
                    <span key={index} className="keyword-tag">{keyword}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="preview-item">
              <h4>Featured Image Suggestion</h4>
              <p className="image-suggestion">{generationResult.featured_image_suggestion}</p>
            </div>

            <div className="next-actions">
              <p className="success-message">
                ✅ Draft post created successfully! You can now find it in your Drafts tab for further editing.
              </p>
              <div className="action-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.href = `/create/edit/${generationResult.post_id}`}
                >
                  Edit This Post
                </button>
                <button className="btn btn-secondary" onClick={resetForm}>
                  Generate Another Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-generator">
      <div className="generator-header">
        <h2>🤖 AI Content Generation</h2>
        <p>Generate high-quality Norwegian Cruise Line content following CME editorial guidelines</p>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <form className="generation-form" onSubmit={(e) => { e.preventDefault(); generateContent(); }}>
        <div className="form-section">
          <h3>Content Specifications</h3>
          
          <div className="form-group">
            <label htmlFor="post_type">Post Type</label>
            <select
              id="post_type"
              value={formData.post_type}
              onChange={(e) => handleInputChange('post_type', e.target.value)}
              className="form-select"
            >
              {Object.entries(postTypeDescriptions).map(([type, description]) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)} - {description.split(' - ')[0]}
                </option>
              ))}
            </select>
            <p className="field-description">{postTypeDescriptions[formData.post_type]}</p>
          </div>

          <div className="form-group">
            <label htmlFor="persona">Target Persona (Optional)</label>
            <select
              id="persona"
              value={formData.persona}
              onChange={(e) => handleInputChange('persona', e.target.value)}
              className="form-select"
            >
              <option value="">All Personas (Generic)</option>
              {Object.entries(personaDescriptions).map(([persona, description]) => (
                <option key={persona} value={persona}>
                  {persona.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
            {formData.persona && (
              <p className="field-description">{personaDescriptions[formData.persona]}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="form-select"
            >
              <option value="general">General</option>
              <option value="cruise-tips">Cruise Tips</option>
              <option value="destinations">Destinations</option>
              <option value="cruise-lines">Cruise Lines</option>
              <option value="planning">Planning</option>
              <option value="ship-reviews">Ship Reviews</option>
              <option value="port-guides">Port Guides</option>
              <option value="dining">Dining</option>
              <option value="entertainment">Entertainment</option>
              <option value="excursions">Excursions</option>
            </select>
            <p className="field-description">Choose the most relevant category for better organization and SEO</p>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (comma-separated)</label>
            <input
              id="tags"
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0))}
              placeholder="e.g., alaska, glacier bay, norwegian bliss, first time"
              className="form-input"
            />
            <p className="field-description">Add relevant tags for better content discovery (separate with commas)</p>
          </div>

          <div className="form-group">
            <label htmlFor="model_preference">AI Model</label>
            <select
              id="model_preference"
              value={formData.model_preference}
              onChange={(e) => handleInputChange('model_preference', e.target.value)}
              className="form-select"
            >
              {Object.entries(modelDescriptions).map(([model, description]) => (
                <option key={model} value={model}>{description}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Weekly Themes (Optional)</h3>
          <p className="section-description">
            Provide thematic guidance to align content with your weekly content plan
          </p>
          
          <div className="themes-grid">
            <div className="form-group">
              <label htmlFor="main_theme">Main Theme</label>
              <input
                id="main_theme"
                type="text"
                value={formData.week_themes.main}
                onChange={(e) => handleInputChange('week_themes.main', e.target.value)}
                placeholder="e.g., Alaska Glacier Season"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="secondary_theme">Secondary Theme</label>
              <input
                id="secondary_theme"
                type="text"
                value={formData.week_themes.secondary}
                onChange={(e) => handleInputChange('week_themes.secondary', e.target.value)}
                placeholder="e.g., First-Time Cruisers"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="tertiary_theme">Tertiary Theme</label>
              <input
                id="tertiary_theme"
                type="text"
                value={formData.week_themes.tertiary}
                onChange={(e) => handleInputChange('week_themes.tertiary', e.target.value)}
                placeholder="e.g., Family Activities"
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Content Prompt</h3>
          <div className="form-group">
            <label htmlFor="prompt">Describe the content you want to generate</label>
            <textarea
              id="prompt"
              value={formData.prompt}
              onChange={(e) => handleInputChange('prompt', e.target.value)}
              placeholder="Example: Write about the best Norwegian Cruise Line ships for Alaska cruising, focusing on glacier viewing opportunities and onboard amenities that enhance the Alaska experience..."
              rows={4}
              className="form-textarea"
              required
            />
            <p className="field-description">
              Be specific about topics, angles, or key points you want covered. The AI will follow CME brand guidelines automatically.
            </p>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isGenerating || !formData.prompt.trim()}
            className="btn btn-primary generate-btn"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="small" />
                Generating Content...
              </>
            ) : (
              '✨ Generate Content'
            )}
          </button>
          
          <button
            type="button"
            onClick={resetForm}
            disabled={isGenerating}
            className="btn btn-secondary"
          >
            Reset Form
          </button>
        </div>
      </form>

      <div className="tips-section">
        <h3>💡 Content Generation Tips</h3>
        <ul>
          <li><strong>Be specific:</strong> Include details about destinations, ship features, or target audience</li>
          <li><strong>Mention context:</strong> Seasonal relevance, current events, or milestone intersections</li>
          <li><strong>Persona targeting:</strong> Select a persona for more focused, personalized content</li>
          <li><strong>Model selection:</strong> Use "Standard" for most content, "Premium" for complex topics</li>
          <li><strong>Weekly themes:</strong> Align with your content calendar for better narrative flow</li>
        </ul>
      </div>
    </div>
  );
};

export default ContentGenerator;