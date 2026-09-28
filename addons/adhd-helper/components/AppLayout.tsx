'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, AppBar, Typography, IconButton, Divider, BottomNavigation,
  BottomNavigationAction, Avatar, Menu, MenuItem, ListItemAvatar,
} from '@mui/material';
import {
  Today as TodayIcon, Task as TaskIcon, Timer as TimerIcon,
  CalendarMonth as CalendarIcon, EventRepeat as HabitIcon,
  StickyNote2 as NotesIcon, MilitaryTech as TrophyIcon,
  Menu as MenuIcon, Logout as LogoutIcon,
} from '@mui/icons-material';
import { useStore } from '@/lib/store';

const DRAWER_WIDTH = 250;

const NAV = [
  { label: 'Oggi', href: '/', icon: <TodayIcon /> },
  { label: 'Task', href: '/tasks', icon: <TaskIcon /> },
  { label: 'Focus', href: '/focus', icon: <TimerIcon /> },
  { label: 'Planner', href: '/planner', icon: <CalendarIcon /> },
  { label: 'Abitudini', href: '/habits', icon: <HabitIcon /> },
  { label: 'Note', href: '/notes', icon: <NotesIcon /> },
  { label: 'Progressi', href: '/progressi', icon: <TrophyIcon /> },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, profile, signOut } = useStore();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const activeIdx = NAV.findIndex((n) =>
    n.href === '/' ? pathname === '/' : pathname.startsWith(n.href),
  );

  const initials = (profile?.display_name || profile?.email || 'U')
    .split(/[\s@.]/)[0]
    .slice(0, 2)
    .toUpperCase();

  const userMenu = (
    <>
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14 }}>
          {initials}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={profile?.display_name || profile?.email || 'Utente'}
        secondary={profile ? `Lv. ${profile.level} · ${profile.xp} XP · 🔥 ${profile.streak_days}` : '…'}
      />
    </>
  );

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#161616' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
          ADHD Helper
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {NAV.map((item) => (
          <ListItem key={item.href} disablePadding>
            <ListItemButton
              component={Link}
              href={item.href}
              selected={activeIdx >= 0 && NAV[activeIdx]?.href === item.href}
              sx={{ '&.Mui-selected': { bgcolor: 'rgba(124, 77, 255, 0.16)' } }}
            >
              <ListItemIcon sx={{ color: activeIdx >= 0 && NAV[activeIdx]?.href === item.href ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <ListItem>
        {userMenu}
        <IconButton
          size="small"
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          aria-label="Menu account"
        >
          <LogoutIcon fontSize="small" />
        </IconButton>
      </ListItem>
    </Box>
  );

  if (!session) {
    return <Box sx={{ minHeight: '100vh' }}>{children}</Box>;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      {/* Desktop sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Mobile app bar */}
      <AppBar position="fixed" sx={{ display: { sm: 'none' }, bgcolor: '#161616', boxShadow: 'none' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700, flexGrow: 1 }}>
            ADHD Helper
          </Typography>
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="Menu account">
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 13 }}>
              {initials}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile bottom navigation */}
      <BottomNavigation
        value={Math.max(0, activeIdx)}
        sx={{
          display: { xs: 'flex', sm: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: '#161616',
          borderTop: '1px solid #2a2a2a',
          zIndex: 1200,
        }}
        showLabels
      >
        {NAV.slice(0, 5).map((item) => (
          <BottomNavigationAction
            key={item.href}
            component={Link}
            href={item.href}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 3 }, minWidth: 0 }}>
        {children}
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MenuItem disabled>
          {profile?.email}
        </MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); signOut().then(() => router.push('/auth')); }}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          Esci
        </MenuItem>
      </Menu>
    </Box>
  );
}
