import { invoke } from '@tauri-apps/api/core';
import { Contact } from '../stores/contactsStore';

class ContactsService {
  /**
   * Fetch Gmail contacts from the People API
   */
  async fetchGmailContacts(
    accountId: string,
    maxResults?: number,
    pageToken?: string
  ): Promise<Contact[]> {
    try {
      console.log('[ContactsService] Fetching contacts for account:', accountId);
      const contacts = await invoke<Contact[]>('get_gmail_contacts', {
        accountId,
        maxResults,
        pageToken,
      });
      
      console.log('[ContactsService] Fetched contacts:', contacts.length, contacts);
      return contacts;
    } catch (error) {
      console.error('[ContactsService] Failed to fetch contacts - FULL ERROR:', error);
      console.error('[ContactsService] Account ID was:', accountId);
      // Return empty array instead of throwing to allow graceful fallback
      return [];
    }
  }

  /**
   * Search Gmail contacts
   */
  async searchGmailContacts(
    accountId: string,
    query: string
  ): Promise<Contact[]> {
    try {
      const contacts = await invoke<Contact[]>('search_gmail_contacts', {
        accountId,
        query,
      });
      
      return contacts;
    } catch (error) {
      console.error('[ContactsService] Failed to search contacts:', error);
      return [];
    }
  }

  /**
   * Convert Gmail contact to our Contact format
   */
  private formatContact(gmailContact: any): Contact {
    return {
      id: gmailContact.id || crypto.randomUUID(),
      name: gmailContact.name || gmailContact.email,
      email: gmailContact.email,
      firstName: gmailContact.first_name,
      lastName: gmailContact.last_name,
      photoUrl: gmailContact.photo_url,
      phone: gmailContact.phone,
      company: gmailContact.company,
      jobTitle: gmailContact.job_title,
      source: 'gmail' as const,
    };
  }

  /**
   * Merge contacts from different sources, removing duplicates
   */
  mergeContacts(existingContacts: Contact[], newContacts: Contact[]): Contact[] {
    const contactMap = new Map<string, Contact>();
    
    // Add existing contacts
    existingContacts.forEach(contact => {
      contactMap.set(contact.email.toLowerCase(), contact);
    });
    
    // Merge new contacts
    newContacts.forEach(contact => {
      const key = contact.email.toLowerCase();
      if (!contactMap.has(key)) {
        contactMap.set(key, contact);
      } else {
        // Merge data, preferring new data
        const existing = contactMap.get(key)!;
        contactMap.set(key, {
          ...existing,
          ...contact,
        });
      }
    });
    
    return Array.from(contactMap.values());
  }
}

export const contactsService = new ContactsService();