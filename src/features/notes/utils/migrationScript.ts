import { notesService } from '../services/notesService';
import { htmlToBlocks } from './htmlToBlocks';

interface MigrationStats {
  total: number;
  migrated: number;
  errors: number;
  skipped: number;
}

// Check if content is already in BlockNote JSON format
const isBlockNoteFormat = (content: string): boolean => {
  if (!content || content.trim() === '') return false;
  
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) && parsed.every(
      block => typeof block === 'object' && 
      block !== null && 
      'type' in block
    );
  } catch {
    return false;
  }
};

// Convert HTML content to BlockNote format
const convertContent = (htmlContent: string): string => {
  if (isBlockNoteFormat(htmlContent)) {
    return htmlContent; // Already converted
  }
  
  // Convert HTML to BlockNote blocks
  const blocks = htmlToBlocks(htmlContent);
  return JSON.stringify(blocks);
};

// Migrate a single note
const migrateNote = async (noteId: string, htmlContent: string): Promise<boolean> => {
  try {
    const blockNoteContent = convertContent(htmlContent);
    
    // Only update if content actually changed
    if (blockNoteContent !== htmlContent) {
      await notesService.updateNote({
        id: noteId,
        content: blockNoteContent
      });
      return true;
    }
    return false; // Skipped (already in correct format)
  } catch (error) {
    console.error(`Failed to migrate note ${noteId}:`, error);
    throw error;
  }
};

// Main migration function
export const migrateNotesToBlockNote = async (): Promise<MigrationStats> => {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    errors: 0,
    skipped: 0
  };
  
  try {
    console.log('🚀 Starting notes migration to BlockNote format...');
    
    // Fetch all notes
    const notes = await notesService.getNotes();
    stats.total = notes.length;
    
    console.log(`📝 Found ${stats.total} notes to process`);
    
    // Migrate each note
    for (const note of notes) {
      try {
        const wasConverted = await migrateNote(note.id, note.content);
        
        if (wasConverted) {
          stats.migrated++;
          console.log(`✅ Migrated note: "${note.title}" (${note.id})`);
        } else {
          stats.skipped++;
          console.log(`⏭️  Skipped note: "${note.title}" (already in BlockNote format)`);
        }
      } catch (error) {
        stats.errors++;
        console.error(`❌ Failed to migrate note: "${note.title}" (${note.id})`, error);
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log(`📊 Stats: ${stats.migrated} migrated, ${stats.skipped} skipped, ${stats.errors} errors`);
    
    return stats;
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
};

// Preview migration (without making changes)
export const previewMigration = async (): Promise<{html: string, blockNote: string}[]> => {
  const notes = await notesService.getNotes();
  const previews: {html: string, blockNote: string}[] = [];
  
  for (const note of notes) {
    if (!isBlockNoteFormat(note.content)) {
      const blockNoteContent = convertContent(note.content);
      previews.push({
        html: note.content,
        blockNote: blockNoteContent
      });
    }
  }
  
  return previews;
};

// Rollback migration (convert BlockNote back to HTML - for emergency use)
export const rollbackMigration = async (): Promise<MigrationStats> => {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    errors: 0,
    skipped: 0
  };
  
  console.warn('⚠️  Rolling back migration - converting BlockNote format back to HTML');
  
  const notes = await notesService.getNotes();
  stats.total = notes.length;
  
  for (const note of notes) {
    try {
      if (isBlockNoteFormat(note.content)) {
        // For rollback, we'd need to implement BlockNote to HTML conversion
        // This is a simplified version that just extracts text content
        const blocks = JSON.parse(note.content);
        const htmlContent = blocks.map((block: any) => {
          if (block.type === 'heading') {
            const level = block.props?.level || 1;
            return `<h${level}>${block.content || ''}</h${level}>`;
          } else if (block.type === 'paragraph') {
            return `<p>${block.content || ''}</p>`;
          }
          return `<p>${block.content || ''}</p>`;
        }).join('');
        
        await notesService.updateNote({
          id: note.id,
          content: htmlContent || '<p></p>'
        });
        
        stats.migrated++;
      } else {
        stats.skipped++;
      }
    } catch (error) {
      stats.errors++;
      console.error(`Failed to rollback note ${note.id}:`, error);
    }
  }
  
  return stats;
}; 