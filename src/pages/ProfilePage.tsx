import { Link } from '@tanstack/react-router'
import { Camera, Heart, KeyRound, Receipt, Save, User as UserIcon } from 'lucide-react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { AppApiError } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  changePasswordSchema,
  MAX_AVATAR_BYTES,
  updateAvatarSchema,
  updateProfileSchema,
  type Profile,
} from '@/contracts'
import { formatEth } from '@/lib/eth'
import {
  useFavorites,
  useOrdersList,
  useProfile,
  useProfileMutations,
} from '@/state/queries'

const presetSampleDataUrl =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

function ProfileDetailsForm({ profile }: { profile: Profile }) {
  const { updateProfile } = useProfileMutations()
  const [name, setName] = useState(profile.name)
  const [username, setUsername] = useState(profile.username)
  const [email, setEmail] = useState(profile.email)
  const [bio, setBio] = useState(profile.bio)
  const [website, setWebsite] = useState(profile.website)
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = updateProfileSchema.safeParse({ name, username, email, bio, website })
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form')
        if (!next[key]) next[key] = issue.message
      }
      setProfileErrors(next)
      return
    }
    setProfileErrors({})

    try {
      await updateProfile.mutateAsync(parsed.data)
    } catch (error) {
      if (error instanceof AppApiError && error.fieldErrors) {
        setProfileErrors(error.fieldErrors)
      } else {
        setProfileErrors({
          form: error instanceof Error ? error.message : 'Não foi possível atualizar o perfil.',
        })
      }
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-white">Dados da Conta</h2>
      <form onSubmit={(event) => void handleProfileSubmit(event)} noValidate className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="profile-name">Nome</Label>
            <Input
              id="profile-name"
              data-testid="profile-name"
              value={name}
              aria-invalid={Boolean(profileErrors.name)}
              aria-describedby={profileErrors.name ? 'profile-name-error' : undefined}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 bg-bg-primary"
            />
            {profileErrors.name ? (
              <p
                id="profile-name-error"
                role="alert"
                data-testid="profile-name-error"
                className="mt-1 text-xs text-red-400"
              >
                {profileErrors.name}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="profile-username">Nome de usuário</Label>
            <Input
              id="profile-username"
              data-testid="profile-username"
              value={username}
              aria-invalid={Boolean(profileErrors.username)}
              aria-describedby={profileErrors.username ? 'profile-username-error' : undefined}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-1.5 bg-bg-primary font-mono"
            />
            {profileErrors.username ? (
              <p
                id="profile-username-error"
                role="alert"
                data-testid="profile-username-error"
                className="mt-1 text-xs text-red-400"
              >
                {profileErrors.username}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <Label htmlFor="profile-email">E-mail</Label>
          <Input
            id="profile-email"
            data-testid="profile-email"
            type="email"
            value={email}
            aria-invalid={Boolean(profileErrors.email)}
            aria-describedby={profileErrors.email ? 'profile-email-error' : undefined}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 bg-bg-primary"
          />
          {profileErrors.email ? (
            <p
              id="profile-email-error"
              role="alert"
              data-testid="profile-email-error"
              className="mt-1 text-xs text-red-400"
            >
              {profileErrors.email}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="profile-bio">Biografia</Label>
          <textarea
            id="profile-bio"
            data-testid="profile-bio"
            rows={3}
            value={bio}
            aria-invalid={Boolean(profileErrors.bio)}
            onChange={(event) => setBio(event.target.value)}
            className="mt-1.5 w-full rounded-[20px] border border-border-subtle bg-bg-primary p-4 text-sm text-white"
          />
          {profileErrors.bio ? (
            <p role="alert" className="mt-1 text-xs text-red-400">
              {profileErrors.bio}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="profile-website">Website</Label>
          <Input
            id="profile-website"
            data-testid="profile-website"
            placeholder="https://seu-portfolio.dev"
            value={website}
            aria-invalid={Boolean(profileErrors.website)}
            aria-describedby={profileErrors.website ? 'profile-website-error' : undefined}
            onChange={(event) => setWebsite(event.target.value)}
            className="mt-1.5 bg-bg-primary"
          />
          {profileErrors.website ? (
            <p
              id="profile-website-error"
              role="alert"
              data-testid="profile-website-error"
              className="mt-1 text-xs text-red-400"
            >
              {profileErrors.website}
            </p>
          ) : null}
        </div>

        {profileErrors.form ? (
          <p role="alert" className="text-xs text-red-400">
            {profileErrors.form}
          </p>
        ) : null}

        <Button type="submit" data-testid="profile-save-btn" disabled={updateProfile.isPending}>
          <Save className="h-4 w-4" aria-hidden="true" />
          {updateProfile.isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </form>
    </Card>
  )
}

export function ProfilePage() {
  const profileQuery = useProfile()
  const favoritesQuery = useFavorites()
  const ordersQuery = useOrdersList()
  const { updateAvatar, changePassword } = useProfileMutations()

  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  if (profileQuery.isLoading) {
    return (
      <div data-testid="profile-skeleton" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-64" />
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <Skeleton className="h-96 lg:col-span-7" />
          <Skeleton className="h-96 lg:col-span-5" />
        </div>
      </div>
    )
  }

  const profile = profileQuery.data
  if (!profile) return null

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('A imagem deve ter no máximo 1 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = String(reader.result ?? '')
      const parsed = updateAvatarSchema.safeParse({ dataUrl })
      if (!parsed.success) {
        setAvatarError(parsed.error.issues[0]?.message ?? 'Formato de imagem inválido.')
        return
      }
      setAvatarError(null)
      try {
        await updateAvatar.mutateAsync(parsed.data)
      } catch (error) {
        setAvatarError(error instanceof Error ? error.message : 'Falha ao atualizar avatar.')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleUseGeneratedAvatar = async () => {
    setAvatarError(null)
    await updateAvatar.mutateAsync({ dataUrl: presetSampleDataUrl })
  }

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    })
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form')
        if (!next[key]) next[key] = issue.message
      }
      setPasswordErrors(next)
      return
    }
    setPasswordErrors({})

    try {
      await changePassword.mutateAsync(parsed.data)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      if (error instanceof AppApiError && error.fieldErrors) {
        setPasswordErrors(error.fieldErrors)
      } else {
        setPasswordErrors({
          form: error instanceof Error ? error.message : 'Não foi possível alterar a senha.',
        })
      }
    }
  }

  const favoriteIds = favoritesQuery.data?.nftIds ?? []
  const orders = ordersQuery.data ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Perfil do Colecionador</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Gerencie seus dados públicos, imagem de perfil, segurança da conta e histórico.
          </p>
        </div>
        <Button variant="secondary" asChild>
          <Link to="/wallets">Gerenciar carteiras</Link>
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-white">Foto de Perfil</h2>
            <div className="mt-4 flex flex-wrap items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-accent-bright bg-bg-primary">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`Avatar de ${profile.name}`}
                    width={80}
                    height={80}
                    data-testid="profile-avatar-img"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-9 w-9 text-accent-bright" aria-hidden="true" />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Label
                    htmlFor="profile-avatar-input"
                    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border-subtle bg-bg-primary px-4 text-xs font-semibold text-white hover:bg-bg-elevated cursor-pointer"
                  >
                    <Camera className="h-4 w-4 text-accent-bright" aria-hidden="true" />
                    Enviar PNG, JPEG ou WEBP
                  </Label>
                  <input
                    id="profile-avatar-input"
                    data-testid="profile-avatar-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleAvatarFileChange}
                    className="sr-only"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    data-testid="profile-sample-avatar-btn"
                    disabled={updateAvatar.isPending}
                    onClick={() => void handleUseGeneratedAvatar()}
                  >
                    Gerar avatar digital
                  </Button>
                </div>
                <p className="text-xs text-text-muted">Tamanho máximo: 1 MB.</p>
                {avatarError ? (
                  <p role="alert" data-testid="profile-avatar-error" className="text-xs text-red-400">
                    {avatarError}
                  </p>
                ) : null}
              </div>
            </div>
          </Card>

          <ProfileDetailsForm key={profile.updatedAt} profile={profile} />
        </div>

        <div className="space-y-6 lg:col-span-5">
          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <KeyRound className="h-5 w-5 text-accent-bright" aria-hidden="true" />
              Alterar Senha
            </h2>
            <form onSubmit={(event) => void handlePasswordSubmit(event)} noValidate className="mt-4 space-y-4">
              <div>
                <Label htmlFor="password-current">Senha atual</Label>
                <Input
                  id="password-current"
                  data-testid="password-current"
                  type="password"
                  value={currentPassword}
                  aria-invalid={Boolean(passwordErrors.currentPassword)}
                  aria-describedby={passwordErrors.currentPassword ? 'password-current-error' : undefined}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="mt-1.5 bg-bg-primary"
                />
                {passwordErrors.currentPassword ? (
                  <p
                    id="password-current-error"
                    role="alert"
                    data-testid="password-current-error"
                    className="mt-1 text-xs text-red-400"
                  >
                    {passwordErrors.currentPassword}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="password-new">Nova senha</Label>
                <Input
                  id="password-new"
                  data-testid="password-new"
                  type="password"
                  value={newPassword}
                  aria-invalid={Boolean(passwordErrors.newPassword)}
                  aria-describedby={passwordErrors.newPassword ? 'password-new-error' : undefined}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="mt-1.5 bg-bg-primary"
                />
                {passwordErrors.newPassword ? (
                  <p
                    id="password-new-error"
                    role="alert"
                    data-testid="password-new-error"
                    className="mt-1 text-xs text-red-400"
                  >
                    {passwordErrors.newPassword}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="password-confirm">Confirmar nova senha</Label>
                <Input
                  id="password-confirm"
                  data-testid="password-confirm"
                  type="password"
                  value={confirmPassword}
                  aria-invalid={Boolean(passwordErrors.confirmPassword)}
                  aria-describedby={passwordErrors.confirmPassword ? 'password-confirm-error' : undefined}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-1.5 bg-bg-primary"
                />
                {passwordErrors.confirmPassword ? (
                  <p
                    id="password-confirm-error"
                    role="alert"
                    data-testid="password-confirm-error"
                    className="mt-1 text-xs text-red-400"
                  >
                    {passwordErrors.confirmPassword}
                  </p>
                ) : null}
              </div>

              {passwordErrors.form ? (
                <p role="alert" className="text-xs text-red-400">
                  {passwordErrors.form}
                </p>
              ) : null}

              <Button
                type="submit"
                variant="secondary"
                data-testid="password-save-btn"
                disabled={changePassword.isPending}
                className="w-full"
              >
                {changePassword.isPending ? 'Atualizando senha...' : 'Atualizar senha'}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <Heart className="h-5 w-5 text-accent-bright" aria-hidden="true" />
              Favoritos ({favoriteIds.length})
            </h2>
            {favoriteIds.length === 0 ? (
              <p className="mt-2 text-xs text-text-secondary">Nenhum NFT favoritado nesta conta.</p>
            ) : (
              <div data-testid="profile-favorites-list" className="mt-3 flex flex-wrap gap-2">
                {favoriteIds.map((id) => (
                  <Link
                    key={id}
                    to="/nft/$nftId"
                    params={{ nftId: id }}
                    data-testid={`profile-favorite-${id}`}
                    className="rounded-xl border border-border-subtle bg-bg-primary px-3 py-1.5 font-mono text-xs text-white hover:border-accent-bright"
                  >
                    {id}
                  </Link>
                ))}
              </div>
            )}

            <h2 className="mt-6 flex items-center gap-2 text-lg font-bold text-white">
              <Receipt className="h-5 w-5 text-accent-bright" aria-hidden="true" />
              Pedidos da Conta ({orders.length})
            </h2>
            {orders.length === 0 ? (
              <p className="mt-2 text-xs text-text-secondary">Nenhum pedido registrado nesta conta.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-xs font-mono">
                {orders.slice(0, 5).map((order) => (
                  <li
                    key={order.id}
                    className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-primary px-3 py-2"
                  >
                    <span>
                      {order.id} · {formatEth(order.totalEth)}
                    </span>
                    {order.status === 'confirmed' ? (
                      <Link
                        to="/orders/$orderId/confirmation"
                        params={{ orderId: order.id }}
                        className="text-accent-bright underline"
                      >
                        Ver recibo
                      </Link>
                    ) : (
                      <Badge variant={order.status === 'pending' ? 'accent' : 'danger'}>
                        {order.status}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
