import { useState, useCallback, useEffect } from 'react';
import { Message } from './useChat';
import { PluginFile } from '@/lib/pluginExport';

export interface Project {
  id: string;
  name: string;
  messages: Message[];
  files: PluginFile[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'plugin-craftsman-projects';

export function useProjectHistory() {
  const [projects, setProjects] = useState<Project[]>([]);

  // Load projects from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProjects(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load projects:', e);
      }
    }
  }, []);

  // Save projects to localStorage whenever they change
  const saveToStorage = useCallback((updatedProjects: Project[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
    setProjects(updatedProjects);
  }, []);

  const saveProject = useCallback((name: string, messages: Message[], files: PluginFile[]): Project => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      messages,
      files,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newProject, ...projects];
    saveToStorage(updated);
    return newProject;
  }, [projects, saveToStorage]);

  const updateProject = useCallback((id: string, messages: Message[], files: PluginFile[]) => {
    const updated = projects.map(p => 
      p.id === id ? { ...p, messages, files, updatedAt: Date.now() } : p
    );
    saveToStorage(updated);
  }, [projects, saveToStorage]);

  const deleteProject = useCallback((id: string) => {
    const updated = projects.filter(p => p.id !== id);
    saveToStorage(updated);
  }, [projects, saveToStorage]);

  const getProject = useCallback((id: string) => {
    return projects.find(p => p.id === id);
  }, [projects]);

  return {
    projects,
    saveProject,
    updateProject,
    deleteProject,
    getProject,
  };
}
