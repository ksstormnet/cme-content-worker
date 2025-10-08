import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { debounce } from 'lodash-es';

import type { ContentBlock, Post } from '../../types/database';
import { tiptapToBlocks, blocksToTiptap } from '../utils/block-converter';

// Custom extensions
import { AccentTipExtension } from './editor/extensions/AccentTipExtension';
import { CTAExtension } from './editor/extensions/CTAExtension';
import { ImagePlaceholderExtension } from './editor/extensions/ImagePlaceholderExtension';

// Editor components
import EditorCanvas from './editor/EditorCanvas';
import PreviewPanel from './editor/PreviewPanel';
import MetadataPanel from './editor/MetadataPanel';
import AutoSaveIndicator from './editor/AutoSaveIndicator';
import LoadingSpinner from './LoadingSpinner';

import './PostEditor.css';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface PostEditorProps {
  user: User;
  onPostCreated?: (post: Post) => void;
  onPostUpdated?: (post: Post) => void;
}

const PostEditor: React.FC<PostEditorProps> = ({ user, onPostCreated, onPostUpdated }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Post metadata
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'published'>('draft');
  const [postType, setPostType] = useState<'monday' | 'wednesday' | 'friday' | 'saturday' | 'newsletter'>('monday');
  const [persona, setPersona] = useState<'easy_breezy' | 'thrill_seeker' | 'luxe_seafarer' | null>(null);

  // Editor state
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize with generated content if coming from ContentGenerator
  useEffect(() => {
    if (location.state) {
      const state = location.state as any;
      if (state.generatedContent) {
        setContentBlocks(state.generatedContent);
        setIsDirty(true);
      }
      if (state.title) setTitle(state.title);
      if (state.excerpt) setExcerpt(state.excerpt);
    }
  }, [location.state]);

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing or type / for commands...',
      }),
      Link.configure({
        openOnClick: false,
      }),
      AccentTipExtension,
      CTAExtension,
      ImagePlaceholderExtension,
    ],
    content: contentBlocks.length > 0 ? blocksToTiptap(contentBlocks) : '',
    onUpdate: ({ editor }) => {
      setIsDirty(true);
      // Convert editor content to blocks
      const blocks = tiptapToBlocks(editor.getJSON());
      setContentBlocks(blocks);
    },
  });

  // Load existing post if editing
  useEffect(() => {
    if (id) {
      loadPost(parseInt(id));
    }
  }, [id]);

  const loadPost = async (postId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/posts/${postId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load post');
      }

      const data = await response.json();
      const post = data.data;

      setTitle(post.title || '');
      setExcerpt(post.excerpt || '');
      setCategory(post.category || '');
      setTags(post.tags ? JSON.parse(post.tags) : []);
      setStatus(post.status || 'draft');
      setPostType(post.post_type || 'monday');
      setPersona(post.persona);

      // Load content blocks
      const blocks = post.content_blocks || [];
      setContentBlocks(blocks);

      // Update editor content
      if (editor && blocks.length > 0) {
        editor.commands.setContent(blocksToTiptap(blocks));
      }

      setIsDirty(false);
      setError(null);
    } catch (err) {
      console.error('Error loading post:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const savePost = async () => {
    try {
      setSaving(true);
      setError(null);

      const postData = {
        title,
        excerpt,
        content: JSON.stringify(contentBlocks),
        category,
        tags: JSON.stringify(tags),
        status,
        post_type: postType,
        persona,
        author_id: user.id,
      };

      if (id) {
        // Update existing post
        const response = await fetch(`/api/admin/posts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(postData),
        });

        if (!response.ok) {
          throw new Error('Failed to save post');
        }

        const result = await response.json();
        setLastSaved(new Date());
        setIsDirty(false);

        if (onPostUpdated) {
          onPostUpdated(result.data);
        }
      } else {
        // Create new post
        const response = await fetch('/api/create/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(postData),
        });

        if (!response.ok) {
          throw new Error('Failed to create post');
        }

        const result = await response.json();
        setLastSaved(new Date());
        setIsDirty(false);

        if (onPostCreated) {
          onPostCreated(result.data);
        }

        // Navigate to edit mode with the new post ID
        navigate(`/admin/edit/${result.data.id}`, { replace: true });
      }
    } catch (err) {
      console.error('Error saving post:', err);
      setError('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save with debounce
  const debouncedSave = useMemo(
    () => debounce(() => {
      if (isDirty && title.trim()) {
        savePost();
      }
    }, 2000),
    [isDirty, title, contentBlocks, excerpt, category, tags, status, postType, persona]
  );

  useEffect(() => {
    if (isDirty) {
      debouncedSave();
    }
    return () => {
      debouncedSave.cancel();
    };
  }, [isDirty, debouncedSave]);

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleManualSave = () => {
    savePost();
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="post-editor-loading">
        <LoadingSpinner />
        <p>Loading post...</p>
      </div>
    );
  }

  return (
    <div className="post-editor">
      <div className="post-editor-header">
        <div className="header-left">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary"
          >
            ← Back
          </button>
          <h2>{id ? 'Edit Post' : 'New Post'}</h2>
        </div>
        <div className="header-right">
          <AutoSaveIndicator
            isSaving={saving}
            lastSaved={lastSaved}
            isDirty={isDirty}
          />
          <button
            type="button"
            onClick={handleManualSave}
            disabled={saving || !isDirty}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="post-editor-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="post-editor-content">
        <div className="editor-main">
          <MetadataPanel
            title={title}
            excerpt={excerpt}
            category={category}
            tags={tags}
            status={status}
            postType={postType}
            persona={persona}
            onTitleChange={setTitle}
            onExcerptChange={setExcerpt}
            onCategoryChange={setCategory}
            onTagsChange={setTags}
            onStatusChange={setStatus}
            onPostTypeChange={setPostType}
            onPersonaChange={setPersona}
          />
          <EditorCanvas editor={editor} />
        </div>

        <div className="editor-preview">
          <PreviewPanel
            blocks={contentBlocks}
            title={title}
            excerpt={excerpt}
          />
        </div>
      </div>
    </div>
  );
};

export default PostEditor;
