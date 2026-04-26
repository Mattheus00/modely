import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { parseISO, differenceInDays, startOfDay } from 'date-fns';

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  refreshNotifications: () => {}
});

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'concluído')
      .not('payment_date', 'is', null);

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    const today = startOfDay(new Date());
    
    // Filter jobs where payment_date is within 7 days from now
    const upcomingPayments = data.filter(job => {
      const paymentDate = startOfDay(parseISO(job.payment_date));
      const diff = differenceInDays(paymentDate, today);
      // Notify if payment is between today and 7 days from now
      // Also notify if it's already overdue (diff < 0)
      return diff <= 7;
    });

    setNotifications(upcomingPayments);
  };

  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every hour
    const interval = setInterval(fetchNotifications, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount: notifications.length,
      refreshNotifications: fetchNotifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
