import type { Story } from '@ladle/react';
import { Select, NativeSelect } from './Select';
import { User, Calendar, Flag, Bell, Star } from 'lucide-react';
import { useState } from 'react';

export default {
  title: 'Design System/Select',
};

const basicOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
  { value: 'option4', label: 'Option 4' },
  { value: 'option5', label: 'Option 5' },
];

const priorityOptions = [
  { value: 'high', label: 'High Priority', icon: <Flag size={14} className="text-red-500" /> },
  { value: 'medium', label: 'Medium Priority', icon: <Flag size={14} className="text-yellow-500" /> },
  { value: 'low', label: 'Low Priority', icon: <Flag size={14} className="text-blue-500" /> },
  { value: 'none', label: 'No Priority', icon: <Flag size={14} className="text-gray-400" /> },
];

const userOptions = [
  { value: 'john', label: 'John Doe', icon: <User size={14} /> },
  { value: 'jane', label: 'Jane Smith', icon: <User size={14} /> },
  { value: 'bob', label: 'Bob Johnson', icon: <User size={14} /> },
  { value: 'alice', label: 'Alice Williams', icon: <User size={14} /> },
  { value: 'unassigned', label: 'Unassigned', disabled: true },
];

/**
 * Basic Select
 * Standard select dropdown with simple options
 */
export const Basic: Story = () => {
  const [value, setValue] = useState<string>('');

  return (
    <div className="space-y-4 max-w-sm">
      <Select
        options={basicOptions}
        value={value}
        onChange={setValue}
        placeholder="Choose an option"
      />
      <p className="text-sm text-gray-600">
        Selected value: {value || 'none'}
      </p>
    </div>
  );
};

/**
 * With Label and Sizes
 * Select components with labels and different sizes
 */
export const WithLabelAndSizes: Story = () => {
  const [value1, setValue1] = useState<string>('');
  const [value2, setValue2] = useState<string>('');
  const [value3, setValue3] = useState<string>('');

  return (
    <div className="space-y-6 max-w-sm">
      <Select
        label="Small Select"
        size="sm"
        options={basicOptions}
        value={value1}
        onChange={setValue1}
        placeholder="Small size"
      />
      
      <Select
        label="Default Select"
        size="default"
        options={basicOptions}
        value={value2}
        onChange={setValue2}
        placeholder="Default size"
      />
      
      <Select
        label="Large Select"
        size="lg"
        options={basicOptions}
        value={value3}
        onChange={setValue3}
        placeholder="Large size"
      />
    </div>
  );
};

/**
 * With Icons
 * Select options with icons for better visual hierarchy
 */
export const WithIcons: Story = () => {
  const [priority, setPriority] = useState<string>('medium');
  const [assignee, setAssignee] = useState<string>('');

  return (
    <div className="space-y-6 max-w-sm">
      <Select
        label="Priority"
        options={priorityOptions}
        value={priority}
        onChange={setPriority}
        placeholder="Select priority"
      />
      
      <Select
        label="Assignee"
        options={userOptions}
        value={assignee}
        onChange={setAssignee}
        placeholder="Select assignee"
      />
    </div>
  );
};

/**
 * With Error State
 * Select component showing validation error
 */
export const WithError: Story = () => {
  const [value, setValue] = useState<string>('');

  return (
    <div className="space-y-4 max-w-sm">
      <Select
        label="Project"
        options={basicOptions}
        value={value}
        onChange={setValue}
        placeholder="Select a project"
        error="This field is required"
      />
    </div>
  );
};

/**
 * Disabled State
 * Select in disabled state
 */
export const Disabled: Story = () => {
  return (
    <div className="space-y-4 max-w-sm">
      <Select
        label="Disabled Select"
        options={basicOptions}
        value="option2"
        placeholder="Cannot select"
        disabled
      />
      
      <Select
        label="Disabled without value"
        options={basicOptions}
        placeholder="Cannot select"
        disabled
      />
    </div>
  );
};

/**
 * Native HTML Select
 * Styled native select for form compatibility
 */
export const NativeSelectExample: Story = () => {
  const [value, setValue] = useState<string>('');

  return (
    <div className="space-y-6 max-w-sm">
      <NativeSelect
        label="Country"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        <option value="">Select a country</option>
        <option value="us">United States</option>
        <option value="uk">United Kingdom</option>
        <option value="ca">Canada</option>
        <option value="au">Australia</option>
        <option value="de">Germany</option>
        <option value="fr">France</option>
        <option value="jp">Japan</option>
      </NativeSelect>

      <NativeSelect
        label="Language"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error="Please select a language"
      >
        <option value="">Select a language</option>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="zh">Chinese</option>
        <option value="ja">Japanese</option>
      </NativeSelect>
    </div>
  );
};

/**
 * Long List
 * Select with many options showing scroll behavior
 */
export const LongList: Story = () => {
  const [value, setValue] = useState<string>('');

  const manyOptions = Array.from({ length: 20 }, (_, i) => ({
    value: `option${i + 1}`,
    label: `Option ${i + 1}`,
  }));

  return (
    <div className="max-w-sm">
      <Select
        label="Long list of options"
        options={manyOptions}
        value={value}
        onChange={setValue}
        placeholder="Select from many options"
      />
    </div>
  );
};

/**
 * Real-world Examples
 * Common select patterns used in the application
 */
export const RealWorldExamples: Story = () => {
  const [taskList, setTaskList] = useState<string>('todo');
  const [sortBy, setSortBy] = useState<string>('created');
  const [viewMode, setViewMode] = useState<string>('kanban');

  const taskListOptions = [
    { value: 'todo', label: 'To Do', icon: <Calendar size={14} /> },
    { value: 'in-progress', label: 'In Progress', icon: <Calendar size={14} /> },
    { value: 'done', label: 'Done', icon: <Calendar size={14} /> },
    { value: 'all', label: 'All Tasks', icon: <Star size={14} /> },
  ];

  const sortOptions = [
    { value: 'created', label: 'Date Created' },
    { value: 'due', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'title', label: 'Title' },
  ];

  const viewOptions = [
    { value: 'kanban', label: 'Kanban Board' },
    { value: 'list', label: 'List View' },
    { value: 'calendar', label: 'Calendar View' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex gap-4">
        <Select
          label="Task List"
          options={taskListOptions}
          value={taskList}
          onChange={setTaskList}
        />
        
        <Select
          label="Sort By"
          options={sortOptions}
          value={sortBy}
          onChange={setSortBy}
        />
        
        <Select
          label="View Mode"
          options={viewOptions}
          value={viewMode}
          onChange={setViewMode}
        />
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Showing <strong>{taskList}</strong> tasks, sorted by <strong>{sortBy}</strong>, in <strong>{viewMode}</strong> view
        </p>
      </div>
    </div>
  );
};