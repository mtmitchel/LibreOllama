import type { Story } from '@ladle/react';
import React from 'react';
import { Button } from '../../components/ui';
import { Plus } from 'lucide-react';

export const Buttons: Story = () => (
    <div className="space-y-8 p-8">
        <div>
            <h2 className="text-text-primary mb-4 text-2xl font-semibold">Variants</h2>
            <div className="flex gap-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="destructive">Destructive</Button>
            </div>
        </div>
        <div>
            <h2 className="text-text-primary mb-4 text-2xl font-semibold">Sizes</h2>
            <div className="flex items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="icon"><Plus /></Button>
            </div>
        </div>
         <div>
            <h2 className="text-text-primary mb-4 text-2xl font-semibold">With Icon</h2>
            <div className="flex items-center gap-4">
                <Button>
                    <Plus className="mr-2 size-4" />
                    Primary
                </Button>
                <Button variant="secondary">
                    <Plus className="mr-2 size-4" />
                    Secondary
                </Button>
            </div>
        </div>
        <div>
            <h2 className="text-text-primary mb-4 text-2xl font-semibold">States</h2>
            <div className="flex items-center gap-4">
                <Button disabled>Disabled</Button>
                <Button isLoading>Loading</Button>
            </div>
        </div>
    </div>
);

Buttons.meta = {
    title: 'Design System/Components/Button',
}; 