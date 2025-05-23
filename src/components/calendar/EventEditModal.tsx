"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar'; // ShadCN Calendar
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCalendar } from '@/contexts/CalendarContext';
import type { CalendarDisplayEvent, AvailableCalendar } from '@/lib/types';
import { format, parse, set, isValid } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventEditModalProps {
  event: CalendarDisplayEvent | null;
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date; // For pre-filling date when creating new event
}

// Helper to combine date and time string into a Date object
const combineDateAndTime = (datePart: Date, timeString: string): Date | null => {
  if (!isValid(datePart)) return null;
  const [hoursStr, minutesStr] = timeString.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null; // Invalid time format
  }
  return set(datePart, { hours, minutes, seconds: 0, milliseconds: 0 });
};

// Helper to get time string (HH:mm) from a Date object
const getTimeStringFromDate = (date: Date): string => {
  if (!isValid(date)) return "00:00";
  return format(date, 'HH:mm');
};


export default function EventEditModal({ event, isOpen, onClose, selectedDate }: EventEditModalProps) {
  const { availableCalendars, addEvent, updateEvent, deleteEvent } = useCalendar();

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(selectedDate || new Date());
  const [startTime, setStartTime] = useState('09:00'); // HH:mm format
  const [endDate, setEndDate] = useState<Date | undefined>(selectedDate || new Date());
  const [endTime, setEndTime] = useState('10:00'); // HH:mm format
  const [isAllDay, setIsAllDay] = useState(false);
  const [calendarId, setCalendarId] = useState<string>(availableCalendars[0]?.id || '');
  const [description, setDescription] = useState('');

  const resetForm = useCallback(() => {
    const initialDate = selectedDate || new Date();
    setTitle(event?.title || '');
    
    const eventStartDate = event ? new Date(event.start) : initialDate;
    setStartDate(eventStartDate);
    setStartTime(getTimeStringFromDate(eventStartDate));

    const eventEndDate = event ? new Date(event.end) : set(initialDate, { hours: initialDate.getHours() + 1 });
    setEndDate(eventEndDate);
    setEndTime(getTimeStringFromDate(eventEndDate));
    
    setIsAllDay(event?.isAllDay || false);
    setCalendarId(event?.calendarId || availableCalendars[0]?.id || '');
    setDescription(event?.description || '');
  }, [event, selectedDate, availableCalendars]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, event, resetForm]);

  // Auto-adjust end date/time if start date/time changes
  useEffect(() => {
    if (!isAllDay && startDate && startTime) {
        const currentFullStartDate = combineDateAndTime(startDate, startTime);
        const currentFullEndDate = combineDateAndTime(endDate || startDate, endTime);

        if (currentFullStartDate && currentFullEndDate && currentFullEndDate < currentFullStartDate) {
            const newEndDate = new Date(currentFullStartDate.getTime() + 60 * 60 * 1000); // Add 1 hour
            setEndDate(newEndDate);
            setEndTime(getTimeStringFromDate(newEndDate));
        } else if (currentFullStartDate && !currentFullEndDate) {
            // If end date/time is invalid, set it to one hour after start
             const newEndDate = new Date(currentFullStartDate.getTime() + 60 * 60 * 1000);
             setEndDate(newEndDate);
             setEndTime(getTimeStringFromDate(newEndDate));
        }
    }
  }, [startDate, startTime, isAllDay, endDate, endTime]);


  const handleSubmit = () => {
    if (!title.trim()) {
      alert('Title is required.');
      return;
    }
    if (!calendarId) {
      alert('Please select a calendar.');
      return;
    }

    const finalStartDate = combineDateAndTime(startDate || new Date(), isAllDay ? '00:00' : startTime);
    let finalEndDate = combineDateAndTime(endDate || startDate || new Date(), isAllDay ? '23:59' : endTime);

    if (!finalStartDate || !finalEndDate) {
        alert("Invalid date or time format.");
        return;
    }
    
    if (isAllDay) {
        // For all-day events, ensure end date is at least the start date
        finalEndDate = set(finalEndDate, { 
            year: finalStartDate.getFullYear(), 
            month: finalStartDate.getMonth(), 
            date: Math.max(finalStartDate.getDate(), finalEndDate.getDate()) 
        });
         finalEndDate = set(finalEndDate, { hours: 23, minutes: 59, seconds: 59 });
    }


    if (finalEndDate <= finalStartDate && !isAllDay) {
      alert('End time must be after start time.');
      return;
    }


    const eventData: Omit<CalendarDisplayEvent, 'id' | 'color'> = {
      title,
      start: finalStartDate,
      end: finalEndDate,
      isAllDay,
      calendarId,
      description,
    };

    if (event?.id) {
      updateEvent({ ...eventData, id: event.id });
    } else {
      addEvent(eventData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (event?.id) {
      if (confirm('Are you sure you want to delete this event?')) {
        deleteEvent(event.id);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event?.id ? 'Edit event' : 'Create event'}</DialogTitle>
          {event?.id && <DialogDescription>Modify the details of your event.</DialogDescription>}
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right col-span-1">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="Event title"/>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right col-span-1">Start</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-2 justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Input 
              type="time" 
              value={startTime} 
              onChange={(e) => setStartTime(e.target.value)} 
              className="col-span-1"
              disabled={isAllDay}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right col-span-1">End</Label>
             <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-2 justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  disabled={(date) => !!(startDate && date < startDate && !isSameDay(date, startDate))}
                />
              </PopoverContent>
            </Popover>
            <Input 
              type="time" 
              value={endTime} 
              onChange={(e) => setEndTime(e.target.value)} 
              className="col-span-1"
              disabled={isAllDay}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-start-2 col-span-3 flex items-center space-x-2">
              <Checkbox id="allDay" checked={isAllDay} onCheckedChange={(checked) => setIsAllDay(!!checked)} />
              <Label htmlFor="allDay" className="text-sm font-normal">All-day event</Label>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="calendar" className="text-right col-span-1">Calendar</Label>
            <Select value={calendarId} onValueChange={setCalendarId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a calendar" />
              </SelectTrigger>
              <SelectContent>
                {availableCalendars.map((cal: AvailableCalendar) => (
                  <SelectItem key={cal.id} value={cal.id} style={{ color: cal.color }}>
                    {cal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right col-span-1 pt-2">Description</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="col-span-3" 
              rows={3}
              placeholder="Add event description, location, or notes"
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <div>
            {event?.id && (
              <Button variant="destructive" onClick={handleDelete} className="mr-auto">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit}>Save event</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
