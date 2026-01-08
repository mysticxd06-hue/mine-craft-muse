import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  role: 'user' | 'assistant';
  content: string | MessageContent[];
}

export interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export interface SendMessageResult {
  success: boolean;
  error?: string;
  creditError?: boolean;
}

// Helper to get text content from a message
export function getMessageText(message: Message): string {
  if (typeof message.content === 'string') return message.content;
  const textPart = message.content.find(p => p.type === 'text');
  return textPart?.text || '';
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string, imageBase64?: string): Promise<SendMessageResult> => {
    // Build message content
    let messageContent: string | MessageContent[];
    if (imageBase64) {
      messageContent = [
        { type: 'text', text: content || 'What plugin should I create based on this image?' },
        { type: 'image_url', image_url: { url: imageBase64 } }
      ];
    } else {
      messageContent = content;
    }

    const userMessage: Message = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = '';

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessages(prev => prev.slice(0, -1)); // Remove the user message
        return { success: false, error: 'Please sign in to use the AI assistant', creditError: false };
      }

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        
        // Handle credit-related errors
        if (resp.status === 402) {
          setMessages(prev => prev.slice(0, -1)); // Remove the user message
          return { success: false, error: errorData.error || 'Insufficient credits', creditError: true };
        }
        
        if (resp.status === 401) {
          setMessages(prev => prev.slice(0, -1));
          return { success: false, error: 'Please sign in to use the AI assistant', creditError: false };
        }
        
        throw new Error(errorData.error || `Request failed: ${resp.status}`);
      }

      if (!resp.body) {
        throw new Error('No response body');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            // Handle Gemini format: candidates[0].content.parts[0].text
            const textContent = parsed.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
            if (textContent) updateAssistant(textContent);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            // Handle Gemini format: candidates[0].content.parts[0].text
            const textContent = parsed.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
            if (textContent) updateAssistant(textContent);
          } catch { /* ignore */ }
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.` 
        }
      ]);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const setAllMessages = useCallback((newMessages: Message[]) => {
    setMessages(newMessages);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    addMessage,
    setAllMessages,
    clearMessages,
  };
}
