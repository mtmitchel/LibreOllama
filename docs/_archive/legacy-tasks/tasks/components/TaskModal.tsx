import React, { useState, useEffect } from 'react';
import { X, List, Repeat, Hash, Plus, ChevronDown, ChevronRight, CalendarIcon } from 'lucide-react';
import { Button, Card, Input, Tag } from '../../../components/ui';
import type { TaskModalState, TaskFormData, GoogleTaskList, GoogleTask } from '../types';
import { formatDueDate } from '../utils/taskHelpers';

export interface TaskModalProps {
  modalState: TaskModalState;
  taskForm: TaskFormData;
  formErrors: Record<string, string>;
  taskLists: GoogleTaskList[];
  currentTaskId?: string;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (taskListId: string, taskData: TaskFormData) => Promise<boolean>;
  onUpdateForm: (updates: Partial<TaskFormData>) => void;
  onAddLabel: (label: string) => void;
  onRemoveLabel: (label: string) => void;
  onAddSubtask: (title: string) => void;
  onUpdateSubtask: (subtaskId: string, updates: any) => void;
  onRemoveSubtask: (subtaskId: string) => void;
}

interface ExpandedSections {
  subtasks: boolean;
  recurring: boolean;
  labels: boolean;
}

export function TaskModal({
  modalState,
  taskForm,
  formErrors,
  taskLists,
  currentTaskId,
  isLoading = false,
  onClose,
  onSubmit,
  onUpdateForm,
  onAddLabel,
  onRemoveLabel,
  onAddSubtask,
  onUpdateSubtask,
  onRemoveSubtask,
}: TaskModalProps) {
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    subtasks: false,
    recurring: false,
    labels: false,
  });
  
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [newLabelInput, setNewLabelInput] = useState('');

  // Auto-expand sections that have data when editing
  useEffect(() => {
    if (modalState.type === 'edit' && modalState.isOpen) {
      setExpandedSections({
        labels: (taskForm.labels?.length || 0) > 0,
        subtasks: (taskForm.subtasks?.length || 0) > 0,
        recurring: taskForm.recurring?.enabled || false,
      });
    } else if (modalState.type === 'create') {
      // Reset to collapsed for create mode
      setExpandedSections({
        subtasks: false,
        recurring: false,
        labels: false,
      });
    }
  }, [modalState.type, modalState.isOpen, taskForm.labels, taskForm.subtasks, taskForm.recurring]);

  if (!modalState.isOpen) return null;

  const isEditMode = modalState.type === 'edit';
  const selectedTaskList = modalState.columnId || taskLists[0]?.id || '';

  const toggleSection = (section: keyof ExpandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAddSubtask = () => {
    if (newSubtaskInput.trim()) {
      onAddSubtask(newSubtaskInput.trim());
      setNewSubtaskInput('');
    }
  };

  const handleAddLabel = () => {
    if (newLabelInput.trim()) {
      onAddLabel(newLabelInput.trim());
      setNewLabelInput('');
    }
  };

  const handleSubmit = async () => {
    const success = await onSubmit(selectedTaskList, taskForm);
    if (success) {
      onClose();
    }
  };

  const updateSubtaskDueDate = (subtaskId: string, due: string) => {
    onUpdateSubtask(subtaskId, { due });
  };

  const toggleSubtask = (subtaskId: string) => {
    const subtask = taskForm.subtasks?.find(s => s.id === subtaskId);
    if (subtask) {
      onUpdateSubtask(subtaskId, { completed: !subtask.completed });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Task' : 'Create New Task'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Task List
              </label>
              <select
                value={selectedTaskList}
                onChange={(e) => onUpdateForm({ parent: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500"
                disabled={isEditMode} // Can't change task list when editing
              >
                {taskLists.map(taskList => (
                  <option key={taskList.id} value={taskList.id}>
                    {taskList.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Task Title *
              </label>
              <Input
                type="text"
                value={taskForm.title}
                onChange={(e) => onUpdateForm({ title: e.target.value })}
                placeholder="Enter task title"
                className={`w-full ${formErrors.title ? 'border-red-500' : ''}`}
                autoFocus
              />
              {formErrors.title && (
                <p className="text-red-600 text-sm mt-1">{formErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Description
              </label>
              <textarea
                value={taskForm.notes}
                onChange={(e) => onUpdateForm({ notes: e.target.value })}
                placeholder="Add description (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={taskForm.due}
                  onChange={(e) => onUpdateForm({ due: e.target.value })}
                  className={`w-full ${formErrors.due ? 'border-red-500' : ''}`}
                />
                {formErrors.due && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.due}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Priority
                </label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => onUpdateForm({ priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="border border-gray-300 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('subtasks')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <List size={16} className="text-gray-500" />
                <span className="font-medium text-gray-900">Subtasks</span>
                {(taskForm.subtasks?.length || 0) > 0 && (
                  <Tag variant="solid" color="muted" size="xs">
                    {taskForm.subtasks?.length || 0}
                  </Tag>
                )}
              </div>
              {expandedSections.subtasks ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {expandedSections.subtasks && (
              <div className="p-4 border-t border-gray-300 space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newSubtaskInput}
                    onChange={(e) => setNewSubtaskInput(e.target.value)}
                    placeholder="Add a subtask"
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskInput.trim()}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                
                {taskForm.subtasks && taskForm.subtasks.length > 0 && (
                  <div className="space-y-2">
                    {taskForm.subtasks.map(subtask => (
                      <div key={subtask.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={() => toggleSubtask(subtask.id)}
                            className="rounded border-gray-300"
                          />
                          <span className={`flex-1 text-sm font-medium ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {subtask.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveSubtask(subtask.id)}
                            className="text-red-600 hover:bg-red-50 p-1"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                        
                        {/* Subtask Due Date */}
                        <div className="flex items-center gap-2 ml-6">
                          <CalendarIcon size={14} className="text-gray-500" />
                          <Input
                            type="date"
                            value={subtask.due ? new Date(subtask.due).toISOString().split('T')[0] : ''}
                            onChange={(e) => updateSubtaskDueDate(subtask.id, e.target.value)}
                            className="text-xs h-8 w-32"
                            placeholder="Due date"
                          />
                          {subtask.due && (
                            <span className={`text-xs ${
                              new Date(subtask.due) < new Date() && !subtask.completed 
                                ? 'text-red-600 font-medium' 
                                : 'text-gray-500'
                            }`}>
                              {formatDueDate(subtask.due)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recurring Tasks Section */}
          <div className="border border-gray-300 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('recurring')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Repeat size={16} className="text-gray-500" />
                <span className="font-medium text-gray-900">Recurring Task</span>
              </div>
              {expandedSections.recurring ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {expandedSections.recurring && (
              <div className="p-4 border-t border-gray-300 space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recurring-enabled"
                    checked={taskForm.recurring?.enabled || false}
                    onChange={(e) => onUpdateForm({
                      recurring: { 
                        enabled: e.target.checked,
                        frequency: taskForm.recurring?.frequency || 'daily',
                        interval: taskForm.recurring?.interval || 1,
                        endDate: taskForm.recurring?.endDate || ''
                      }
                    })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="recurring-enabled" className="text-sm text-gray-900">
                    Make this task recurring
                  </label>
                </div>
                
                {taskForm.recurring?.enabled && (
                  <div className="space-y-3 ml-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Frequency
                        </label>
                        <select
                          value={taskForm.recurring?.frequency || 'daily'}
                          onChange={(e) => onUpdateForm({
                            recurring: { 
                              enabled: taskForm.recurring?.enabled || false,
                              frequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly',
                              interval: taskForm.recurring?.interval || 1,
                              endDate: taskForm.recurring?.endDate || ''
                            }
                          })}
                          className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 ${formErrors.recurringFrequency ? 'border-red-500' : ''}`}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                        {formErrors.recurringFrequency && (
                          <p className="text-red-600 text-xs mt-1">{formErrors.recurringFrequency}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Every
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={taskForm.recurring?.interval || 1}
                          onChange={(e) => onUpdateForm({
                            recurring: { 
                              enabled: taskForm.recurring?.enabled || false,
                              frequency: taskForm.recurring?.frequency || 'daily',
                              interval: parseInt(e.target.value) || 1,
                              endDate: taskForm.recurring?.endDate || ''
                            }
                          })}
                          className={`w-full text-sm ${formErrors.recurringInterval ? 'border-red-500' : ''}`}
                        />
                        {formErrors.recurringInterval && (
                          <p className="text-red-600 text-xs mt-1">{formErrors.recurringInterval}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        End Date (optional)
                      </label>
                      <Input
                        type="date"
                        value={taskForm.recurring?.endDate || ''}
                        onChange={(e) => onUpdateForm({
                          recurring: { 
                            enabled: taskForm.recurring?.enabled || false,
                            frequency: taskForm.recurring?.frequency || 'daily',
                            interval: taskForm.recurring?.interval || 1,
                            endDate: e.target.value
                          }
                        })}
                        className={`w-full text-sm ${formErrors.recurringEndDate ? 'border-red-500' : ''}`}
                      />
                      {formErrors.recurringEndDate && (
                        <p className="text-red-600 text-xs mt-1">{formErrors.recurringEndDate}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Labels Section */}
          <div className="border border-gray-300 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('labels')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Hash size={16} className="text-gray-500" />
                <span className="font-medium text-gray-900">Labels</span>
                {(taskForm.labels?.length || 0) > 0 && (
                  <Tag variant="solid" color="muted" size="xs">
                    {taskForm.labels?.length || 0}
                  </Tag>
                )}
              </div>
              {expandedSections.labels ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {expandedSections.labels && (
              <div className="p-4 border-t border-gray-300 space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newLabelInput}
                    onChange={(e) => setNewLabelInput(e.target.value)}
                    placeholder="Add a label"
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddLabel}
                    disabled={!newLabelInput.trim()}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                
                {taskForm.labels && taskForm.labels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {taskForm.labels.map((label, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium group hover:bg-blue-100 transition-colors"
                      >
                        <Hash size={12} />
                        {label}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveLabel(label)}
                          className="text-blue-700 hover:bg-blue-200 p-0 h-4 w-4 ml-1 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </Button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8">
          <Button
            variant="ghost"
            onClick={onClose}
            className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!taskForm.title.trim() || isLoading}
            className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditMode ? 'Update Task' : 'Create Task'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
} 