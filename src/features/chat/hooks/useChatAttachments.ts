import { useState, useCallback } from 'react';
import { ChatAttachment, ChatAttachmentUpload, isValidAttachment, getAttachmentType } from '../types/attachments';

export function useChatAttachments() {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const generateAttachmentId = () => {
    return `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const createDataUrl = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const addAttachment = useCallback(async (file: File): Promise<ChatAttachment | null> => {
    const validation = isValidAttachment(file);
    if (!validation.valid) {
      console.error('Invalid attachment:', validation.error);
      return null;
    }

    const id = generateAttachmentId();
    const attachment: ChatAttachment = {
      id,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      type: getAttachmentType(file.type),
      uploadStatus: 'pending',
      uploadProgress: 0,
      createdAt: new Date()
    };

    // For images, create a data URL for immediate preview
    if (attachment.type === 'image') {
      try {
        attachment.url = await createDataUrl(file);
        attachment.thumbnailUrl = attachment.url;
      } catch (error) {
        console.error('Failed to create image preview:', error);
      }
    }

    setAttachments(prev => [...prev, attachment]);
    
    // Simulate upload process (in a real app, this would upload to a server)
    simulateUpload(id, file);
    
    return attachment;
  }, [createDataUrl]);

  const simulateUpload = useCallback((attachmentId: string, file: File) => {
    setIsUploading(true);
    
    // Update status to uploading
    setAttachments(prev => prev.map(att => 
      att.id === attachmentId 
        ? { ...att, uploadStatus: 'uploading' as const }
        : att
    ));

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Mark as completed
        setAttachments(prev => prev.map(att => 
          att.id === attachmentId 
            ? { 
                ...att, 
                uploadStatus: 'completed' as const,
                uploadProgress: 100,
                // In a real app, this would be the server URL
                url: att.url || URL.createObjectURL(file)
              }
            : att
        ));
        
        setIsUploading(false);
      } else {
        setAttachments(prev => prev.map(att => 
          att.id === attachmentId 
            ? { ...att, uploadProgress: Math.floor(progress) }
            : att
        ));
      }
    }, 100);
  }, []);

  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments(prev => {
      const attachment = prev.find(att => att.id === attachmentId);
      if (attachment?.url && attachment.url.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.url);
      }
      return prev.filter(att => att.id !== attachmentId);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    // Clean up blob URLs
    attachments.forEach(att => {
      if (att.url && att.url.startsWith('blob:')) {
        URL.revokeObjectURL(att.url);
      }
    });
    setAttachments([]);
  }, [attachments]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      addAttachment(file);
    });
  }, [addAttachment]);

  return {
    attachments,
    isUploading,
    addAttachment,
    removeAttachment,
    clearAttachments,
    handleFileSelect
  };
} 