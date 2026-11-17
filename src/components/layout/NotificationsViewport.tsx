import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useNotifications } from '@/state/notifications'

export function NotificationsViewport() {
  const { items, dismiss } = useNotifications()

  return (
    <div
      aria-label="Notificações do sistema"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
    >
      {items.map((item) => {
        const isAssertive = item.tone === 'error' || item.tone === 'warning'
        const Icon =
          item.tone === 'success'
            ? CheckCircle2
            : item.tone === 'error'
              ? AlertCircle
              : item.tone === 'warning'
                ? AlertTriangle
                : Info

        const borderClass =
          item.tone === 'success'
            ? 'border-emerald-500/70 bg-bg-secondary'
            : item.tone === 'error'
              ? 'border-red-500/80 bg-bg-secondary'
              : item.tone === 'warning'
                ? 'border-amber-500/80 bg-bg-secondary'
                : 'border-accent-bright/70 bg-bg-secondary'

        return (
          <div
            key={item.id}
            role={isAssertive ? 'alert' : 'status'}
            aria-live={isAssertive ? 'assertive' : 'polite'}
            data-testid="toast-notification"
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 text-white shadow-xl ${borderClass}`}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent-bright" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-xs text-text-secondary">{item.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label={`Fechar notificação: ${item.title}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-elevated hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
