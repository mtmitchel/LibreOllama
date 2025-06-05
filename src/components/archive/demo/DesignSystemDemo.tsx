import React from 'react';
import { Button } from '@/components/ui/button-v2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card-v2';
import { Input } from '@/components/ui/input-v2';
import { Search, Plus, Settings, Heart } from 'lucide-react';

/**
 * Design System Demo Component
 * 
 * Showcases the V2 enhanced design system components with:
 * - Target design dark theme colors
 * - ADHD-optimized cognitive load indicators
 * - Enhanced accessibility features
 * - Modern typography and spacing
 */
export const DesignSystemDemo: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-bg-primary min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            LibreOllama V2 Design System
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Enhanced UI components with dark theme, ADHD-optimized cognitive load indicators, 
            and improved accessibility features.
          </p>
        </div>

        {/* Button Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Button Components</CardTitle>
            <CardDescription>
              Enhanced buttons with target design colors and improved accessibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Primary Buttons */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300">Primary Actions</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="sm">
                  Small Primary
                </Button>
                <Button variant="primary" size="md">
                  Medium Primary
                </Button>
                <Button variant="primary" size="lg">
                  Large Primary
                </Button>
                <Button variant="primary" iconLeft={Plus}>
                  With Icon
                </Button>
                <Button variant="primary" loading>
                  Loading
                </Button>
              </div>
            </div>

            {/* Secondary Buttons */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300">Secondary Actions</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary">
                  Secondary
                </Button>
                <Button variant="tertiary">
                  Tertiary
                </Button>
                <Button variant="ghost">
                  Ghost
                </Button>
                <Button variant="link">
                  Link Button
                </Button>
              </div>
            </div>

            {/* State Buttons */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300">State Buttons</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="success" iconLeft={Heart}>
                  Success
                </Button>
                <Button variant="warning">
                  Warning
                </Button>
                <Button variant="destructive">
                  Destructive
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Cognitive Load Examples */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300">Cognitive Load Indicators</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" cognitiveLoad="low">
                  Low Cognitive Load
                </Button>
                <Button variant="primary" cognitiveLoad="medium">
                  Medium Cognitive Load
                </Button>
                <Button variant="primary" cognitiveLoad="high">
                  High Cognitive Load
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Input Components</CardTitle>
            <CardDescription>
              Enhanced inputs with validation states and accessibility features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Inputs */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300">Basic Inputs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  placeholder="Default input" 
                  helperText="This is helper text"
                />
                <Input 
                  placeholder="Search..." 
                  leftIcon={Search}
                />
                <Input 
                  type="password" 
                  placeholder="Password" 
                  showPasswordToggle
                />
                <Input 
                  placeholder="With right icon" 
                  rightIcon={Settings}
                />
              </div>
            </div>

            {/* Input Variants */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300">Input Variants</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  variant="default" 
                  placeholder="Default variant"
                />
                <Input 
                  variant="filled" 
                  placeholder="Filled variant"
                />
                <Input 
                  variant="outlined" 
                  placeholder="Outlined variant"
                />
                <Input 
                  variant="ghost" 
                  placeholder="Ghost variant"
                />
              </div>
            </div>

            {/* Input States */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300">Validation States</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  placeholder="Success state" 
                  success="This looks good!"
                />
                <Input 
                  placeholder="Error state" 
                  error="This field is required"
                />
                <Input 
                  placeholder="Warning state" 
                  warning="Please double-check this"
                />
                <Input 
                  placeholder="Disabled state" 
                  disabled
                />
              </div>
            </div>

            {/* Input Sizes */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300">Input Sizes</h4>
              <div className="space-y-3">
                <Input size="sm" placeholder="Small input" />
                <Input size="md" placeholder="Medium input (default)" />
                <Input size="lg" placeholder="Large input" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Card Components</CardTitle>
            <CardDescription>
              Enhanced cards with hover states and cognitive load indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Default Card */}
              <Card variant="default">
                <CardHeader>
                  <CardTitle>Default Card</CardTitle>
                  <CardDescription>
                    Standard card with default styling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-300">
                    This is the default card variant with subtle shadows and hover effects.
                  </p>
                </CardContent>
              </Card>

              {/* Elevated Card */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Elevated Card</CardTitle>
                  <CardDescription>
                    Card with enhanced shadow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-300">
                    This card has more prominent shadows for emphasis.
                  </p>
                </CardContent>
              </Card>

              {/* Interactive Card */}
              <Card variant="interactive" className="cursor-pointer">
                <CardHeader>
                  <CardTitle>Interactive Card</CardTitle>
                  <CardDescription>
                    Clickable card with focus states
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-300">
                    This card is interactive and keyboard accessible.
                  </p>
                </CardContent>
              </Card>

              {/* Cognitive Load Cards */}
              <Card cognitiveLoad="low">
                <CardHeader>
                  <CardTitle>Low Cognitive Load</CardTitle>
                  <CardDescription>
                    Easy to process information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-300">
                    Simple, clear content that's easy to understand.
                  </p>
                </CardContent>
              </Card>

              <Card cognitiveLoad="medium">
                <CardHeader>
                  <CardTitle>Medium Cognitive Load</CardTitle>
                  <CardDescription>
                    Moderate complexity content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-300">
                    Content that requires some attention to process.
                  </p>
                </CardContent>
              </Card>

              <Card cognitiveLoad="high">
                <CardHeader>
                  <CardTitle>High Cognitive Load</CardTitle>
                  <CardDescription>
                    Complex information requiring focus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-300">
                    Dense or complex content that needs careful attention.
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Typography Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Typography System</CardTitle>
            <CardDescription>
              ADHD-optimized typography with improved line heights and spacing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-white">Heading 1 - Display Text</h1>
              <h2 className="text-white">Heading 2 - Page Title</h2>
              <h3 className="text-white">Heading 3 - Section Title</h3>
              <h4 className="text-white">Heading 4 - Subsection</h4>
              <h5 className="text-white">Heading 5 - Component Title</h5>
              <h6 className="text-white">Heading 6 - Small Title</h6>
              <p className="text-slate-300">
                Body text with optimized line height for improved readability. 
                This paragraph demonstrates the enhanced typography system with 
                better spacing and contrast for ADHD users.
              </p>
              <p className="text-sm text-slate-400">
                Small text for captions and helper information with improved letter spacing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DesignSystemDemo;