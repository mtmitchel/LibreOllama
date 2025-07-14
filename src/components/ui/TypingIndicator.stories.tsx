import type { Story } from '@ladle/react';
import React, { useState, useEffect } from 'react';
import { TypingIndicator, ChatTypingIndicator, SimpleTypingDots } from './TypingIndicator';

export const TypingIndicators: Story = () => {
  const [animatedVisibility, setAnimatedVisibility] = useState(true);
  const [simulatedUsers, setSimulatedUsers] = useState(['Alice']);

  useEffect(() => {
    // Simulate typing animation toggle
    const interval = setInterval(() => {
      setAnimatedVisibility(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Simulate users joining/leaving typing
    const userRotation = [
      ['Alice'],
      ['Alice', 'Bob'],
      ['Alice', 'Bob', 'Charlie'],
      ['Bob', 'Charlie'],
      ['Charlie'],
      []
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % userRotation.length;
      setSimulatedUsers(userRotation[index]);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-12 bg-primary p-8">
      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Basic typing indicator</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Default variant</h3>
            <TypingIndicator isVisible={true} />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Ghost variant</h3>
            <TypingIndicator variant="ghost" isVisible={true} />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Subtle variant</h3>
            <TypingIndicator variant="subtle" isVisible={true} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Sizes</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Small</h3>
            <TypingIndicator size="sm" isVisible={true} />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Medium</h3>
            <TypingIndicator size="md" isVisible={true} />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Large</h3>
            <TypingIndicator size="lg" isVisible={true} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Custom dot colors</h2>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Primary</h3>
            <TypingIndicator 
              variant="ghost" 
              dotColor="bg-accent-primary" 
              isVisible={true} 
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Success</h3>
            <TypingIndicator 
              variant="ghost" 
              dotColor="bg-success" 
              isVisible={true} 
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Warning</h3>
            <TypingIndicator 
              variant="ghost" 
              dotColor="bg-warning" 
              isVisible={true} 
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Error</h3>
            <TypingIndicator 
              variant="ghost" 
              dotColor="bg-error" 
              isVisible={true} 
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Animation states</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="w-20 text-sm text-primary">Visible:</span>
              <TypingIndicator isVisible={true} />
            </div>
            <div className="flex items-center gap-4">
              <span className="w-20 text-sm text-primary">Hidden:</span>
              <TypingIndicator isVisible={false} />
            </div>
            <div className="flex items-center gap-4">
              <span className="w-20 text-sm text-primary">Animated:</span>
              <TypingIndicator isVisible={animatedVisibility} />
              <span className="text-xs text-secondary">(toggles every 3s)</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Chat typing indicator</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 font-medium text-primary">Single user</h3>
              <ChatTypingIndicator 
                users={['Alice']} 
                isVisible={true}
                size="md"
              />
            </div>
            
            <div>
              <h3 className="mb-3 font-medium text-primary">Multiple users</h3>
              <ChatTypingIndicator 
                users={['Alice', 'Bob', 'Charlie']} 
                isVisible={true}
                size="md"
              />
            </div>
            
            <div>
              <h3 className="mb-3 font-medium text-primary">Many users (with overflow)</h3>
              <ChatTypingIndicator 
                users={['Alice', 'Bob', 'Charlie', 'David', 'Eva', 'Frank']} 
                maxUsers={3}
                isVisible={true}
                size="md"
              />
            </div>
            
            <div>
              <h3 className="mb-3 font-medium text-primary">With avatars</h3>
              <ChatTypingIndicator 
                users={['Alice', 'Bob']} 
                avatarUrls={[
                  'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
                  'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'
                ]}
                isVisible={true}
                size="md"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Dynamic simulation</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <h3 className="mb-4 font-medium text-primary">Users joining and leaving</h3>
          <p className="mb-4 text-sm text-secondary">Watch as users start and stop typing</p>
          <ChatTypingIndicator 
            users={simulatedUsers}
            isVisible={simulatedUsers.length > 0}
            size="md"
          />
          {simulatedUsers.length === 0 && (
            <p className="mt-2 text-xs text-tertiary">No one is typing...</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Simple typing dots</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Small dots</h3>
            <SimpleTypingDots size="sm" />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Medium dots</h3>
            <SimpleTypingDots size="md" />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Large dots</h3>
            <SimpleTypingDots size="lg" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Custom colored dots</h2>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Primary</h3>
            <SimpleTypingDots color="bg-accent-primary" />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Success</h3>
            <SimpleTypingDots color="bg-success" />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Warning</h3>
            <SimpleTypingDots color="bg-warning" />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Error</h3>
            <SimpleTypingDots color="bg-error" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Use cases</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Chat message thread</h3>
            <div className="space-y-3">
              <div className="flex justify-end">
                <div className="max-w-xs rounded-lg bg-accent-primary px-4 py-2 text-white">
                  <p className="text-sm">Hey team, how&apos;s the project going?</p>
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="max-w-xs rounded-lg bg-tertiary px-4 py-2">
                  <p className="text-sm text-primary">Making good progress! Just working on the final touches.</p>
                </div>
              </div>
              
              <div className="flex justify-start">
                <ChatTypingIndicator 
                  users={['Alice']}
                  isVisible={true}
                  size="sm"
                />
              </div>
            </div>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Loading states</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <SimpleTypingDots size="sm" color="bg-accent-primary" />
                <span className="text-sm text-primary">Processing request...</span>
              </div>
              
              <div className="flex items-center gap-3">
                <TypingIndicator variant="ghost" size="sm" isVisible={true} />
                <span className="text-sm text-primary">AI is thinking...</span>
              </div>
              
              <div className="flex items-center gap-3">
                <SimpleTypingDots size="sm" color="bg-warning" />
                <span className="text-sm text-primary">Generating response...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Size variations comparison</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-medium text-primary">Small size components</h3>
              <div className="flex items-center gap-6">
                <TypingIndicator size="sm" isVisible={true} />
                <ChatTypingIndicator users={['User']} size="sm" isVisible={true} />
                <SimpleTypingDots size="sm" />
              </div>
            </div>
            
            <div>
              <h3 className="mb-3 text-sm font-medium text-primary">Medium size components</h3>
              <div className="flex items-center gap-6">
                <TypingIndicator size="md" isVisible={true} />
                <ChatTypingIndicator users={['User']} size="md" isVisible={true} />
                <SimpleTypingDots size="md" />
              </div>
            </div>
            
            <div>
              <h3 className="mb-3 text-sm font-medium text-primary">Large size components</h3>
              <div className="flex items-center gap-6">
                <TypingIndicator size="lg" isVisible={true} />
                <ChatTypingIndicator users={['User']} size="lg" isVisible={true} />
                <SimpleTypingDots size="lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

TypingIndicators.meta = {
  title: 'Design System/Components/TypingIndicator',
}; 