'use client';

import React from 'react';
import CalendarWithCelebrants from '@/components/calendar/CalendarWithCelebrants';

export default function AdminCalendarPage() {
  return (
    <div className="max-w-[1600px] mx-auto pb-12">
      <CalendarWithCelebrants isAdmin={true} />
    </div>
  );
}
