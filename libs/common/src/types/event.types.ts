export interface EventSummary {
  id: string;
  slug: string;
  name: string;
  city: string;
  venue: string;
  startsAt: string;
  teaser: string;
  remainingInventory: number;
}

export interface EventDetails extends EventSummary {
  description: string;
  highlights: string[];
}
