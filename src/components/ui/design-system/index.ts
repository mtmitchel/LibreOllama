/**
 * Design System Components
 * 
 * Central export for all DLS-compliant components
 * Following the Asana-inspired design language specification
 */

// Phase 1: Core Interactive Elements
export { Button } from './Button';
export type { ButtonProps } from './Button';
export { default as WidgetHeader } from './WidgetHeader';
export type { WidgetHeaderProps } from './WidgetHeader';
export { default as Tile } from './Tile';
export type { TileProps } from './Tile';
export { default as ListItem } from './ListItem';
export type { ListItemProps } from './ListItem';

export { Select, NativeSelect } from './Select';
export type { SelectProps, SelectOption } from './Select';

export { 
  Popover, 
  PopoverContent, 
  PopoverHeader, 
  PopoverFooter 
} from './Popover';
export type { PopoverProps, PopoverPlacement } from './Popover';

export { 
  Dropdown,
  ActionMenu,
  SelectDropdown
} from './Dropdown';
export type { DropdownProps, DropdownItem, ActionMenuItem } from './Dropdown';

export { 
  Tooltip,
  KeyboardTooltip,
  InfoTooltip
} from './Tooltip';
export type { TooltipProps, TooltipPlacement } from './Tooltip';

// Phase 2 - Containers & Modals  
export { 
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter
} from './Card';
export type { 
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardContentProps,
  CardFooterProps
} from './Card';

export { 
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  SimpleDialog
} from './Dialog';
export type { 
  DialogProps,
  DialogContentProps,
  DialogFooterProps,
  SimpleDialogProps
} from './Dialog';

export { 
  ConfirmDialog,
  useConfirmDialog,
  confirmDelete,
  confirmDiscard,
  confirmLogout
} from './ConfirmDialog';
export type { ConfirmDialogProps } from './ConfirmDialog';

export { 
  ToastProvider,
  useToast,
  toast,
  showToast,
  useRegisterGlobalToast
} from './Toast';
export type { 
  ToastVariant,
  ToastData,
  ToastProviderProps
} from './Toast';

// Phase 3 - Data & Display Components
export { 
  Badge,
  CountBadge,
  StatusBadge,
  BadgeGroup
} from './Badge';
export type { 
  BadgeProps,
  CountBadgeProps,
  StatusBadgeProps,
  BadgeGroupProps
} from './Badge';

export { 
  Tag,
  HashTag,
  ColorTag,
  TagGroup,
  TagInput
} from './Tag';
export type { 
  TagProps,
  HashTagProps,
  ColorTagProps,
  TagGroupProps,
  TagInputProps
} from './Tag';

export { 
  Avatar,
  AvatarGroup,
  UserAvatar,
  BotAvatar,
  TeamAvatar
} from './Avatar';
export type { 
  AvatarProps,
  AvatarGroupProps,
  UserAvatarProps,
  BotAvatarProps,
  TeamAvatarProps
} from './Avatar';

export { 
  ProgressRing,
  ProgressBar,
  LoadingSpinner,
  ProgressSteps
} from './ProgressRing';
export type { 
  ProgressRingProps,
  ProgressBarProps,
  LoadingSpinnerProps,
  ProgressStepsProps
} from './ProgressRing';

export { 
  HeatMapCalendar,
  ActivityCalendar
} from './HeatMapCalendar';
export type { 
  HeatMapData,
  HeatMapCalendarProps,
  ActivityCalendarProps
} from './HeatMapCalendar';

// Phase 4 - Custom & Composite Components
export { 
  FilterDropdown,
  FilterButton,
  FilterBar
} from './FilterDropdown';
export type { 
  FilterOption,
  FilterDropdownProps,
  FilterButtonProps,
  FilterBarProps
} from './FilterDropdown';

export { 
  ContextMenu,
  ContextMenuTrigger,
  useContextMenu
} from './ContextMenu';
export type { 
  ContextMenuItem,
  ContextMenuProps,
  ContextMenuTriggerProps
} from './ContextMenu';

export { 
  Stepper,
  StepProgress,
  MiniStepper
} from './Stepper';
export type { 
  StepperStep,
  StepperProps,
  StepProgressProps,
  MiniStepperProps
} from './Stepper';

export { 
  Toggle,
  ToggleRow,
  ToggleGroup,
  ToggleCard,
  ToggleButton
} from './Toggle';
export type { 
  ToggleProps,
  ToggleRowProps,
  ToggleGroupProps,
  ToggleCardProps,
  ToggleButtonProps
} from './Toggle';

// Phase 5 - Layout Primitives
export { 
  Stack,
  VStack,
  HStack,
  Divider,
  Spacer,
  FormStack,
  ListStack,
  ButtonGroup
} from './Stack';
export type { 
  StackProps,
  VStackProps,
  HStackProps,
  DividerProps,
  SpacerProps,
  FormStackProps,
  ListStackProps,
  ButtonGroupProps
} from './Stack';

export { 
  Grid,
  GridItem,
  CardGrid,
  DashboardGrid,
  SidebarLayout,
  MasonryGrid,
  AutoGrid
} from './Grid';
export type { 
  GridProps,
  GridItemProps,
  CardGridProps,
  DashboardGridProps,
  SidebarLayoutProps,
  MasonryGridProps,
  AutoGridProps
} from './Grid';

export { 
  Box,
  Center,
  Square,
  Circle,
  Flex,
  AspectRatio
} from './Box';
export type { 
  BoxProps,
  CenterProps,
  SquareProps,
  CircleProps,
  FlexProps,
  AspectRatioProps
} from './Box';

export { 
  Container,
  Section,
  Page,
  Article,
  Hero
} from './Container';
export type { 
  ContainerProps,
  SectionProps,
  PageProps,
  ArticleProps,
  HeroProps
} from './Container';

export { 
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  FormSuccessMessage,
  FormHint,
  FormInput,
  FormTextarea,
  FormGroup,
  useFormControl
} from './FormControl';
export type { 
  FormControlProps,
  FormLabelProps,
  FormHelperTextProps,
  FormErrorMessageProps,
  FormSuccessMessageProps,
  FormHintProps,
  FormInputProps,
  FormTextareaProps,
  FormGroupProps
} from './FormControl';