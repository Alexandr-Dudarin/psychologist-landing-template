import { SchedulerTimelineView } from "./SchedulerTimelineView";
import type { SchedulerDetail } from "./premiumScheduler.helpers";
import type { SchedulerDaySummary, SchedulerOverlayItem } from "./premiumScheduler.shared";

type SchedulerWeekViewProps = {
  daySummaries: SchedulerDaySummary[];
  headerHeight: number;
  hours: Array<{ hour: number; label: string }>;
  overlayItems: SchedulerOverlayItem[];
  rowHeight: number;
  onDayDetail: (detail: SchedulerDetail) => void;
  onEventDetail: (detail: SchedulerDetail) => void;
};

export function SchedulerWeekView(props: SchedulerWeekViewProps) {
  return <SchedulerTimelineView {...props} viewMode="week" />;
}
