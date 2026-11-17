import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export interface NotificationItem {
  id: string
  tone: 'info' | 'success' | 'warning' | 'error'
  title: string
  description?: string
}

interface NotificationsContextValue {
  items: NotificationItem[]
  notify: (item: Omit<NotificationItem, 'id'>) => void
  dismiss: (id: string) => void
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const notify = useCallback(
    (item: Omit<NotificationItem, 'id'>) => {
      const id = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
      setItems((current) => [...current.slice(-3), { ...item, id }])
      setTimeout(() => {
        dismiss(id)
      }, 5500)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ items, notify, dismiss }), [items, notify, dismiss])

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
