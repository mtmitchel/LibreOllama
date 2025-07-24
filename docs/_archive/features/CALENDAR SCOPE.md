
### **Consolidated Design & Development Task: Integrated Google Calendar & Tasks**

**Objective:** The goal is to create a seamless, powerful interface for managing Google Tasks and Google Calendar within LibreOllama. The core experience will revolve around a flexible Kanban board for tasks and a full-featured calendar, connected by an intuitive drag-and-drop time-blocking workflow.

**Core Libraries:**
* **Calendar:** **`FullCalendar`**
* **Drag-and-Drop:** **`@dnd-kit`**
* **Google API Interaction:** **`googleapis`**

---
### **Part 1: The Tasks Page (Kanban Board for Google Tasks)**

**Objective:** To render a user's Google Tasks lists as a flexible, multi-column Kanban board, allowing for easy task management and reordering.

#### **Key Requirements:**

1.  **Data & Layout:**
    * **[ ]** Fetch all of the active user's Google Tasks lists via the API. Each list should be rendered as a single Kanban column.
    * **[ ]** Fetch all tasks within each list and render them as individual `Card` components within the appropriate column.
    * **[ ]** The board layout must use a flexible grid. The columns should grow to fill the available horizontal space to prevent excessive white space. If the number of columns exceeds the viewport width, the area must become horizontally scrollable.

2.  **Task Card Component:**
    * **[ ]** The task card must clearly display the task title from Google Tasks.
    * **[ ]** It must have visual indicators for the **Due Date**. This should include a warning style for overdue tasks.
    * **[ ]** Include a checkbox to mark tasks as "Completed," which should trigger an API call to update the task's status.

3.  **Drag-and-Drop Functionality (via `@dnd-kit`):**
    * **[ ]** Users must be able to drag and drop tasks to reorder them *within* a column. This action must trigger a `tasks.move` API call to update the order in Google Tasks.
    * **[ ]** Users must be able to drag and drop tasks *between* columns. This action must also trigger a `tasks.move` API call to move the task to the new list in Google Tasks.
    * **[ ]** The UI must provide clear visual feedback during dragging (e.g., a "ghost" card) and for drop zones (e.g., a highlighted area).

4.  **Multi-Account Support:**
    * **[ ]** The page header must include a clear account selector dropdown to switch between connected Google accounts.
    * **[ ]** All API calls must be made using the credentials for the currently selected account.

---
### **Part 2: The Calendar Page (Google Calendar Frontend)**

**Objective:** To provide a full-featured calendar interface for viewing Google Calendar events, fully integrated with a live view of Google Tasks.

#### **Key Requirements:**

1.  **Core Calendar (via `FullCalendar`):**
    * **[ ]** Fetch and display all events from the user's primary Google Calendar for the selected account.
    * **[ ]** Implement standard `Month`, `Week`, and `Day` views, with controls for navigation.
    * **[ ]** Customize the entire calendar's appearance (colors, fonts, borders, event blocks) to perfectly match the LibreOllama design system.

2.  **Integrated Tasks Sidebar:**
    * **[ ]** The right-hand sidebar must display a live, scrollable list of the user's Google Tasks, identical in appearance and function to the cards on the main Tasks page.

3.  **Event Creation:**
    * **[ ]** A `+ New event` button should open a standard system `Modal` that allows the user to create a new event via the Google Calendar API.

---
### **Part 3: The Integrated Workflow - Drag-and-Drop Time Blocking**

**Objective:** To create a seamless workflow that allows users to schedule their Google Tasks by dragging them from the sidebar directly onto their Google Calendar.

#### **User Flow & Design Specs:**

1.  **[ ] Initiate Drag:** The task cards in the right-hand sidebar must be draggable. On hover, the cursor should change to a "grab" icon, and the card should visually lift.

2.  **[ ] Drag Over Calendar:** While dragging, a semi-transparent "ghost" of the task card should follow the cursor. As the user drags over the calendar, each day cell should highlight to indicate it's a valid drop target.

3.  **[ ] Drop & Confirm:** When the user drops a task onto a specific day:
    * A **"Schedule Task" modal must immediately open.**
    * The modal's title should be pre-filled with the task's name.
    * The date will be set from the day it was dropped on.
    * **Crucially**, the modal must feature prominent **Start Time** and **End Time** inputs, as Google Tasks due dates do not include a time. This allows the user to define the time block.
    * A "Save to Google Calendar" button will finalize the action.

4.  **[ ] API Interaction:** Clicking "Save" in the modal triggers a `events.insert` API call to create the new event in the user's Google Calendar.