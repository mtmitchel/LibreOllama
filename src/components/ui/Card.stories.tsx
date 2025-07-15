import type { Story } from '@ladle/react';
import React from 'react';
import { Card } from '../../components/ui';

export const Cards: Story = () => (
    <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-2">
        <Card>
            <h3 className="text-text-primary text-xl font-semibold">Standard Card</h3>
            <p className="text-text-secondary mt-2">This is a standard card component. It can be used to display any kind of content.</p>
        </Card>
        <Card padding="lg">
             <h3 className="text-text-primary text-xl font-semibold">Widget Card</h3>
            <p className="text-text-secondary mt-2">This is a widget card, which has slightly different styling.</p>
        </Card>
    </div>
);

Cards.meta = {
    title: 'Design System/Components/Card',
}; 