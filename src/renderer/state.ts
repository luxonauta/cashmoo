import { useEffect, useState } from "react";
import { apiDashboard, apiGetUser, apiNotifications } from "./api";
import { DashboardData, NotificationRow, UserProfile } from "./types";

export function useUser(): [
  UserProfile | null,
  (name: string) => Promise<void>
] {
  const [user, setUser] = useState<UserProfile | null>(null);
  useEffect(() => {
    apiGetUser().then(setUser);
  }, []);
  async function updateName(name: string): Promise<void> {
    const row = await window.financeApi.setUserName(name);
    setUser(row);
  }
  return [user, updateName];
}

export function useDashboard(): DashboardData | null {
  const [data, setData] = useState<DashboardData | null>(null);
  useEffect(() => {
    apiDashboard().then(setData);
    const id = setInterval(() => apiDashboard().then(setData), 5000);
    return () => clearInterval(id);
  }, []);
  return data;
}

export function useNotifications(): NotificationRow[] {
  const [items, setItems] = useState<NotificationRow[]>([]);
  useEffect(() => {
    apiNotifications().then(setItems);
    const id = setInterval(() => apiNotifications().then(setItems), 10000);
    return () => clearInterval(id);
  }, []);
  return items;
}
