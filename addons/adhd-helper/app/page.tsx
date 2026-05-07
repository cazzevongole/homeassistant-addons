'use client';

import { useState, useEffect } from 'react';
import { TasksPage } from '@/components/TasksPage';
import { FocusPage } from '@/components/FocusPage';
import { PlannerPage } from '@/components/PlannerPage';
import { HabitsPage } from '@/components/HabitsPage';
import { NotesPage } from '@/components/NotesPage';

const PAGES: Record<string, React.FC> = {
  tasks: TasksPage,
  focus: FocusPage,
  planner: PlannerPage,
  habits: HabitsPage,
  notes: NotesPage,
};

function getHash() {
  if (typeof window === 'undefined') return 'tasks';
  const hash = window.location.hash.replace('#', '');
  return PAGES[hash] ? hash : 'tasks';
}

export default function Home() {
  const [page, setPage] = useState(getHash());
  const PageComponent = PAGES[page] || TasksPage;

  useEffect(() => {
    const handler = () => setPage(getHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return <PageComponent />;
}
