import JSZip from 'jszip';

export interface PluginFile {
  path: string;
  content: string;
}

export interface PluginProject {
  name: string;
  files: PluginFile[];
  createdAt: number;
}

// Parse AI response to extract plugin files
export function parsePluginFiles(content: string): PluginFile[] {
  const files: PluginFile[] = [];
  const fileRegex = /===FILE:(.+?)===\n([\s\S]*?)===ENDFILE===/g;
  
  let match;
  while ((match = fileRegex.exec(content)) !== null) {
    const path = match[1].trim();
    const fileContent = match[2].trim();
    files.push({ path, content: fileContent });
  }
  
  return files;
}

// Check if a message contains exportable plugin files
export function hasPluginFiles(content: string): boolean {
  return content.includes('===FILE:') && content.includes('===ENDFILE===');
}

// Export plugin as a ZIP file
export async function exportPluginAsZip(project: PluginProject): Promise<Blob> {
  const zip = new JSZip();
  
  // Add all files to the zip
  for (const file of project.files) {
    zip.file(file.path, file.content);
  }
  
  // Generate the zip file
  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}

// Download the zip file
export function downloadZip(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import plugin from a ZIP file
export async function importPluginFromZip(file: File): Promise<PluginProject> {
  const zip = await JSZip.loadAsync(file);
  const files: PluginFile[] = [];
  
  const promises: Promise<void>[] = [];
  
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      promises.push(
        zipEntry.async('string').then((content) => {
          files.push({ path: relativePath, content });
        })
      );
    }
  });
  
  await Promise.all(promises);
  
  // Extract plugin name from plugin.yml or file name
  let pluginName = file.name.replace(/\.zip$/i, '');
  const pluginYml = files.find(f => f.path.endsWith('plugin.yml'));
  if (pluginYml) {
    const nameMatch = pluginYml.content.match(/name:\s*(.+)/);
    if (nameMatch) {
      pluginName = nameMatch[1].trim();
    }
  }
  
  return {
    name: pluginName,
    files,
    createdAt: Date.now(),
  };
}

// Format file content for display in chat
export function formatPluginFilesForChat(project: PluginProject): string {
  let formatted = `**Imported Plugin: ${project.name}**\n\n`;
  formatted += `Found ${project.files.length} file(s):\n\n`;
  
  for (const file of project.files) {
    const ext = file.path.split('.').pop() || '';
    const lang = ext === 'java' ? 'java' : ext === 'yml' || ext === 'yaml' ? 'yaml' : ext === 'xml' ? 'xml' : '';
    formatted += `**${file.path}:**\n\`\`\`${lang}\n${file.content}\n\`\`\`\n\n`;
  }
  
  return formatted;
}

// Extract plugin name from files
export function getPluginName(files: PluginFile[]): string {
  const pluginYml = files.find(f => f.path.endsWith('plugin.yml'));
  if (pluginYml) {
    const nameMatch = pluginYml.content.match(/name:\s*(.+)/);
    if (nameMatch) {
      return nameMatch[1].trim();
    }
  }
  
  const mainClass = files.find(f => f.path.endsWith('.java') && f.content.includes('extends JavaPlugin'));
  if (mainClass) {
    const classMatch = mainClass.content.match(/public\s+class\s+(\w+)/);
    if (classMatch) {
      return classMatch[1];
    }
  }
  
  return 'MyPlugin';
}
