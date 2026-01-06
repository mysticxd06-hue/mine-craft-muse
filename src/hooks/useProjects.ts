import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { PluginFile } from '@/lib/pluginExport';
import type { Json } from '@/integrations/supabase/types';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  files: PluginFile[];
  is_public: boolean;
  downloads: number;
  created_at: string;
  updated_at: string;
  // Joined data
  author_name?: string;
}

// Helper to convert Json to PluginFile array safely
function parseFiles(files: Json): PluginFile[] {
  if (!Array.isArray(files)) return [];
  return files.map(f => {
    if (typeof f === 'object' && f !== null && 'path' in f && 'content' in f) {
      return { path: String(f.path), content: String(f.content) };
    }
    return { path: '', content: '' };
  }).filter(f => f.path);
}

export function useProjects() {
  const { user } = useAuthContext();
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [communityProjects, setCommunityProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMyProjects = useCallback(async () => {
    if (!user) {
      setMyProjects([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      const projects: Project[] = (data || []).map(p => ({
        ...p,
        files: parseFiles(p.files)
      }));
      
      setMyProjects(projects);
    } catch (err) {
      console.error('Error fetching my projects:', err);
    }
  }, [user]);

  const fetchCommunityProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_public', true)
        .order('downloads', { ascending: false })
        .limit(12);

      if (error) throw error;
      
      const projects: Project[] = (data || []).map(p => ({
        ...p,
        files: parseFiles(p.files)
      }));
      
      setCommunityProjects(projects);
    } catch (err) {
      console.error('Error fetching community projects:', err);
    }
  }, []);

  const saveProject = useCallback(async (
    name: string,
    files: PluginFile[],
    description?: string,
    isPublic?: boolean,
    existingId?: string
  ): Promise<Project> => {
    if (!user) throw new Error('Must be signed in to save projects');

    // Convert to Json-compatible format
    const filesJson: Json = files.map(f => ({ path: f.path, content: f.content }));

    const projectData = {
      user_id: user.id,
      name,
      description: description || null,
      files: filesJson,
      is_public: isPublic ?? false,
    };

    if (existingId) {
      const { data, error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', existingId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchMyProjects();
      
      return { ...data, files: parseFiles(data.files) };
    } else {
      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (error) throw error;
      
      await fetchMyProjects();
      
      return { ...data, files: parseFiles(data.files) };
    }
  }, [user, fetchMyProjects]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!user) throw new Error('Must be signed in');

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) throw error;
    
    await fetchMyProjects();
  }, [user, fetchMyProjects]);

  const togglePublic = useCallback(async (projectId: string, isPublic: boolean) => {
    if (!user) throw new Error('Must be signed in');

    const { error } = await supabase
      .from('projects')
      .update({ is_public: isPublic })
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) throw error;
    
    await fetchMyProjects();
  }, [user, fetchMyProjects]);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchMyProjects(), fetchCommunityProjects()]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchMyProjects, fetchCommunityProjects]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return {
    myProjects,
    communityProjects,
    isLoading,
    saveProject,
    deleteProject,
    togglePublic,
    refresh: loadAll,
  };
}
