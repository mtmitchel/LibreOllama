import type { Story } from '@ladle/react';
import React, { useState } from 'react';
import { ToggleRow, ToggleGroup, ToggleCard } from './ToggleRow';
import { Bell, Shield, Eye, Globe, Database, Zap, Users, Moon } from 'lucide-react';

export const ToggleRows: Story = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [publicProfile, setPublicProfile] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [teamSettings, setTeamSettings] = useState({
    allowInvites: true,
    showOnlineStatus: false,
    shareActivity: true,
    autoBackup: false
  });
  const [privacySettings, setPrivacySettings] = useState({
    profileVisible: true,
    showEmail: false,
    allowMessages: true,
    trackingOptOut: false
  });

  const updateTeamSetting = (key: string, value: boolean) => {
    setTeamSettings(prev => ({ ...prev, [key]: value }));
  };

  const updatePrivacySetting = (key: string, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-12 bg-primary p-8">
      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Basic toggle rows</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <div className="space-y-1">
            <ToggleRow
              label="Enable notifications"
              description="Receive email and push notifications"
              checked={notifications}
              onChange={setNotifications}
            />
            <ToggleRow
              label="Dark mode"
              description="Use dark theme across the application"
              checked={darkMode}
              onChange={setDarkMode}
            />
            <ToggleRow
              label="Public profile"
              description="Make your profile visible to everyone"
              checked={publicProfile}
              onChange={setPublicProfile}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Sizes</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Small</h3>
            <ToggleRow
              label="Small toggle"
              description="Compact size for dense layouts"
              checked={true}
              onChange={() => {}}
              size="sm"
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Medium (default)</h3>
            <ToggleRow
              label="Medium toggle"
              description="Standard size for most use cases"
              checked={true}
              onChange={() => {}}
              size="md"
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Large</h3>
            <ToggleRow
              label="Large toggle"
              description="Prominent size for important settings"
              checked={true}
              onChange={() => {}}
              size="lg"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Variants</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Default</h3>
            <ToggleRow
              label="Default style"
              description="Standard appearance"
              checked={true}
              onChange={() => {}}
              variant="default"
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Prominent</h3>
            <ToggleRow
              label="Prominent style"
              description="Enhanced with border and shadow"
              checked={true}
              onChange={() => {}}
              variant="prominent"
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Subtle</h3>
            <ToggleRow
              label="Subtle style"
              description="Minimal visual emphasis"
              checked={true}
              onChange={() => {}}
              variant="subtle"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">With icons and badges</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <div className="space-y-1">
            <ToggleRow
              label="Notifications"
              description="Get notified about important updates"
              checked={notifications}
              onChange={setNotifications}
              icon={<Bell className="size-5" />}
            />
            <ToggleRow
              label="Two-factor authentication"
              description="Add an extra layer of security"
              checked={twoFactor}
              onChange={setTwoFactor}
              icon={<Shield className="size-5" />}
              badge={
                <span className="rounded-full bg-success px-2 py-1 text-xs text-white">
                  Recommended
                </span>
              }
            />
            <ToggleRow
              label="Analytics tracking"
              description="Help us improve by sharing usage data"
              checked={analytics}
              onChange={setAnalytics}
              icon={<Database className="size-5" />}
              badge={
                <span className="rounded-full bg-tertiary px-2 py-1 text-xs text-secondary">
                  Optional
                </span>
              }
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">States</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <div className="space-y-1">
            <ToggleRow
              label="Enabled toggle"
              description="This toggle is interactive"
              checked={true}
              onChange={() => {}}
            />
            <ToggleRow
              label="Disabled toggle"
              description="This toggle is disabled"
              checked={false}
              onChange={() => {}}
              disabled={true}
            />
            <ToggleRow
              label="Disabled (checked)"
              description="This toggle is disabled but checked"
              checked={true}
              onChange={() => {}}
              disabled={true}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Toggle groups</h2>
        <div className="space-y-6">
          <ToggleGroup
            title="Privacy settings"
            description="Control what others can see about you"
          >
            <ToggleRow
              label="Profile visibility"
              description="Show your profile to other users"
              checked={privacySettings.profileVisible}
              onChange={(checked) => updatePrivacySetting('profileVisible', checked)}
              icon={<Eye className="size-5" />}
            />
            <ToggleRow
              label="Show email address"
              description="Display your email on your public profile"
              checked={privacySettings.showEmail}
              onChange={(checked) => updatePrivacySetting('showEmail', checked)}
              icon={<Globe className="size-5" />}
            />
            <ToggleRow
              label="Allow direct messages"
              description="Let other users send you private messages"
              checked={privacySettings.allowMessages}
              onChange={(checked) => updatePrivacySetting('allowMessages', checked)}
            />
            <ToggleRow
              label="Opt out of tracking"
              description="Disable usage analytics and tracking"
              checked={privacySettings.trackingOptOut}
              onChange={(checked) => updatePrivacySetting('trackingOptOut', checked)}
            />
          </ToggleGroup>

          <ToggleGroup
            title="Team collaboration"
            description="Manage how you work with your team"
          >
            <ToggleRow
              label="Allow team invites"
              description="Team members can invite others to projects"
              checked={teamSettings.allowInvites}
              onChange={(checked) => updateTeamSetting('allowInvites', checked)}
              icon={<Users className="size-5" />}
              badge={
                <span className="rounded-full bg-accent-soft px-2 py-1 text-xs text-accent-primary">
                  Team
                </span>
              }
            />
            <ToggleRow
              label="Show online status"
              description="Display when you're active to team members"
              checked={teamSettings.showOnlineStatus}
              onChange={(checked) => updateTeamSetting('showOnlineStatus', checked)}
            />
            <ToggleRow
              label="Share activity"
              description="Show your recent activity in team feed"
              checked={teamSettings.shareActivity}
              onChange={(checked) => updateTeamSetting('shareActivity', checked)}
            />
            <ToggleRow
              label="Automatic backup"
              description="Automatically backup project data daily"
              checked={teamSettings.autoBackup}
              onChange={(checked) => updateTeamSetting('autoBackup', checked)}
              icon={<Database className="size-5" />}
            />
          </ToggleGroup>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Toggle cards</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ToggleCard
            title="Dark mode"
            subtitle="Switch to dark theme"
            description="Enable dark mode for a better viewing experience in low-light environments. This setting will apply across all pages and components."
            checked={darkMode}
            onChange={setDarkMode}
            icon={<Moon className="size-5" />}
          />
          
          <ToggleCard
            title="Performance mode"
            subtitle="Optimize for speed"
            description="Enable performance optimizations that may reduce visual effects but improve responsiveness and battery life."
            checked={analytics}
            onChange={setAnalytics}
            icon={<Zap className="size-5" />}
            footer={
              <div className="text-xs text-secondary">
                <p>⚡ Reduces animations and effects</p>
                <p>🔋 Improves battery life</p>
                <p>🚀 Faster page loads</p>
              </div>
            }
          />
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Use cases</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">App settings panel</h3>
            <div className="space-y-1">
              <ToggleRow
                label="Push notifications"
                description="Receive notifications on your device"
                checked={notifications}
                onChange={setNotifications}
                size="sm"
                icon={<Bell className="size-4" />}
              />
              <ToggleRow
                label="Auto-save"
                description="Automatically save your work"
                checked={true}
                onChange={() => {}}
                size="sm"
              />
              <ToggleRow
                label="Sound effects"
                description="Play sounds for interactions"
                checked={false}
                onChange={() => {}}
                size="sm"
              />
              <ToggleRow
                label="Beta features"
                description="Access experimental features"
                checked={false}
                onChange={() => {}}
                size="sm"
                badge={
                  <span className="bg-warning-bg rounded-full px-2 py-1 text-xs text-warning-fg">
                    Beta
                  </span>
                }
              />
            </div>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Feature flags</h3>
            <div className="space-y-1">
              <ToggleRow
                label="New dashboard"
                description="Enable the redesigned dashboard"
                checked={true}
                onChange={() => {}}
                variant="prominent"
                size="sm"
                badge={
                  <span className="rounded-full bg-accent-soft px-2 py-1 text-xs text-accent-primary">
                    New
                  </span>
                }
              />
              <ToggleRow
                label="Advanced search"
                description="Enable enhanced search capabilities"
                checked={false}
                onChange={() => {}}
                variant="prominent"
                size="sm"
              />
              <ToggleRow
                label="AI assistant"
                description="Enable AI-powered suggestions"
                checked={false}
                onChange={() => {}}
                variant="prominent"
                size="sm"
                disabled={true}
                badge={
                  <span className="rounded-full bg-tertiary px-2 py-1 text-xs text-secondary">
                    Coming soon
                  </span>
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Complex settings layout</h2>
        <div className="border-border-default rounded-lg border bg-surface">
          <div className="border-border-subtle border-b p-6">
            <h3 className="font-semibold text-primary">Account preferences</h3>
            <p className="mt-1 text-sm text-secondary">Customize your account settings and preferences</p>
          </div>
          <div className="space-y-6 p-6">
            <ToggleGroup title="Security">
              <ToggleRow
                label="Two-factor authentication"
                description="Require 2FA for account access"
                checked={twoFactor}
                onChange={setTwoFactor}
                icon={<Shield className="size-5" />}
                variant="prominent"
              />
            </ToggleGroup>
            
            <ToggleGroup title="Communication">
              <ToggleRow
                label="Email notifications"
                description="Receive important updates via email"
                checked={notifications}
                onChange={setNotifications}
                icon={<Bell className="size-5" />}
              />
              <ToggleRow
                label="Marketing emails"
                description="Receive product updates and tips"
                checked={false}
                onChange={() => {}}
              />
            </ToggleGroup>
            
            <ToggleGroup title="Privacy">
              <ToggleRow
                label="Public profile"
                description="Make your profile discoverable"
                checked={publicProfile}
                onChange={setPublicProfile}
                icon={<Globe className="size-5" />}
              />
              <ToggleRow
                label="Usage analytics"
                description="Help improve our service"
                checked={analytics}
                onChange={setAnalytics}
                icon={<Database className="size-5" />}
              />
            </ToggleGroup>
          </div>
        </div>
      </div>
    </div>
  );
};

ToggleRows.meta = {
  title: 'Design System/Components/ToggleRow',
}; 