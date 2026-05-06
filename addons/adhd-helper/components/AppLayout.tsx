'use client';

import { useState, useEffect } from 'react';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, AppBar, Typography, useMediaQuery, useTheme, IconButton, Divider,
} from '@mui/material';
import {
  Menu as MenuIcon, Task as TaskIcon, Timer as TimerIcon,
  CalendarToday as CalendarIcon, CheckCircle as HabitIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NotificationBell } from '@/components/NotificationBell';
import { PWARegister } from '@/components/PWARegister';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Tasks', href: '/tasks', icon: <TaskIcon /> },
  { label: 'Focus Timer', href: '/focus', icon: <TimerIcon /> },
  { label: 'Daily Planner', href: '/planner', icon: <CalendarIcon /> },
  { label: 'Habits', href: '/habits', icon: <HabitIcon /> },
  { label: 'Brain Dump', href: '/notes', icon: <NotesIcon /> },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobileRaw = useMediaQuery(theme.breakpoints.down('sm'));
  const [mounted, setMounted] = useState(false);
  const isMobile = mounted ? isMobileRaw : false;
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const activeHref = mounted ? pathname : '';

  useEffect(() => {
    setMounted(true);
  }, []);

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: '#1a1a1a', display: 'flex', flexDirection: 'column' }}>
      <Box>
        <Toolbar>
          <Typography variant="h6" sx={{ color: '#7c4dff', fontWeight: 700 }}>
            ADHD Helper
          </Typography>
        </Toolbar>
        <Divider sx={{ bgcolor: '#333' }} />
        <List>
          {navItems.map((item) => (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={activeHref === item.href}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  '&.Mui-selected': { bgcolor: 'rgba(124, 77, 255, 0.15)' },
                  '&:hover': { bgcolor: 'rgba(124, 77, 255, 0.08)' },
                }}
              >
                <ListItemIcon sx={{ color: activeHref === item.href ? '#7c4dff' : '#aaa' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ p: 2, mt: 'auto' }}>
        <NotificationBell />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ display: { sm: 'none' }, bgcolor: '#1a1a1a', boxShadow: 'none' }}>
        <Toolbar>
          <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 2, color: '#fff' }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ color: '#7c4dff', fontWeight: 700, flexGrow: 1 }}>
            ADHD Helper
          </Typography>
          <NotificationBell />
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        sx={{
          width: isMobile ? 0 : DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, mt: { xs: 7, sm: 0 } }}>
        {children}
      </Box>
      <PWARegister />
    </Box>
  );
}
1