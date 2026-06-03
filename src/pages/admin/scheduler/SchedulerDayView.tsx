import { SchedulerTimelineView } from "./SchedulerTimelineView";
import type {
  SchedulerDetail,
  SchedulerEmptySlotSelection,
} from "./premiumScheduler.helpers";
import type {
  SchedulerDaySummary,
  SchedulerOverlayItem,
} from "./premiumScheduler.shared";

type SchedulerDayViewProps = {
  daySummaries: SchedulerDaySummary[];
  headerHeight: number;
  hours: Array<{ hour: number; label: string }>;
  overlayItems: SchedulerOverlayItem[];
  rowHeight: number;
  onDayDetail: (detail: SchedulerDetail) => void;
  onEmptySlotSelect: (selection: SchedulerEmptySlotSelection) => void;
  onEventDetail: (detail: SchedulerDetail) => void;
};

export function SchedulerDayView(props: SchedulerDayViewProps) {
  return <SchedulerTimelineView {...props} viewMode="day" />;
}