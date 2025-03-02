declare module 'react-big-calendar' {
  import { Moment } from 'moment';
  import React from 'react';

  export interface Event {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: any;
  }

  export interface CalendarProps {
    localizer: any;
    events: Event[];
    startAccessor?: string | ((event: Event) => Date);
    endAccessor?: string | ((event: Event) => Date);
    style?: React.CSSProperties;
    onSelectEvent?: (event: Event) => void;
    views?: string[];
    defaultView?: string;
  }

  export function Calendar(props: CalendarProps): React.ReactElement;
  export function momentLocalizer(moment: typeof Moment): any;
}
