import { Link } from '@tanstack/react-router'
import { Eye, EyeOff, Image as ImageIcon } from 'lucide-react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { AppApiError } from '@/api/client'
import { AccountSidebar } from '@/components/account/AccountSidebar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  changePasswordSchema,
  MAX_AVATAR_BYTES,
  updateAvatarSchema,
  updateProfileSchema,
  type Profile,
} from '@/contracts'
import { formatEth } from '@/lib/eth'
import { zodIssuesToFieldErrors } from '@/lib/validation'
import {
  useFavorites,
  useOrdersList,
  useProfile,
  useProfileMutations,
} from '@/state/queries'
import { useSession } from '@/state/session'

const presetSampleDataUrl =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

function ProfileDetailsSection({
  profile,
  avatarError,
  onAvatarFileChange,
  onUseSampleAvatar,
  avatarPending,
}: {
  profile: Profile
  avatarError: string | null
  onAvatarFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onUseSampleAvatar: () => void
  avatarPending: boolean
}) {
  const { updateProfile, changePassword } = useProfileMutations()
  const [name, setName] = useState(profile.name)
  const [username, setUsername] = useState(profile.username)
  const [email, setEmail] = useState(profile.email)
  const [bio, setBio] = useState(profile.bio)
  const [website, setWebsite] = useState(profile.website)
  const [ensDomain, setEnsDomain] = useState('kurio')
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = updateProfileSchema.safeParse({ name, username, email, bio, website })
    if (!parsed.success) {
      setProfileErrors(zodIssuesToFieldErrors(parsed.error))
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

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    })
    if (!parsed.success) {
      setPasswordErrors(zodIssuesToFieldErrors(parsed.error))
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

  return (
    <div className="flex flex-1 flex-col gap-[32px]">
      <h1 className="text-[16px] font-bold leading-[16px] text-text-primary">
        Perfil do colecionador
      </h1>

      <form onSubmit={(event) => void handleProfileSubmit(event)} noValidate className="flex flex-col gap-[24px]">
        <div className="grid grid-cols-1 gap-x-[28px] gap-y-[20px] sm:grid-cols-2">
          <div className="flex flex-col gap-[8px]">
            <label htmlFor="profile-name" className="flex items-center text-[15px] text-text-primary">
              <span>Nome de exibição</span>
              <span className="ml-0.5 text-[22px] leading-[29px] text-coral">*</span>
            </label>
            <input
              id="profile-name"
              data-testid="profile-name"
              value={name}
              aria-invalid={Boolean(profileErrors.name)}
              aria-describedby={profileErrors.name ? 'profile-name-error' : undefined}
              onChange={(event) => setName(event.target.value)}
              className="h-[40px] w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
            />
            {profileErrors.name ? (
              <p
                id="profile-name-error"
                role="alert"
                data-testid="profile-name-error"
                className="text-xs text-red-400"
              >
                {profileErrors.name}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-[8px]">
            <label htmlFor="profile-username" className="flex items-center text-[15px] text-text-primary">
              <span>Nome de usuário</span>
              <span className="ml-0.5 text-[22px] leading-[29px] text-coral">*</span>
            </label>
            <input
              id="profile-username"
              data-testid="profile-username"
              value={username}
              aria-invalid={Boolean(profileErrors.username)}
              aria-describedby={profileErrors.username ? 'profile-username-error' : undefined}
              onChange={(event) => setUsername(event.target.value)}
              className="h-[40px] w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
            />
            {profileErrors.username ? (
              <p
                id="profile-username-error"
                role="alert"
                data-testid="profile-username-error"
                className="text-xs text-red-400"
              >
                {profileErrors.username}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-[8px]">
            <label htmlFor="profile-email" className="flex items-center text-[15px] text-text-primary">
              <span>E-mail</span>
              <span className="ml-0.5 text-[22px] leading-[29px] text-coral">*</span>
            </label>
            <input
              id="profile-email"
              data-testid="profile-email"
              type="email"
              value={email}
              aria-invalid={Boolean(profileErrors.email)}
              aria-describedby={profileErrors.email ? 'profile-email-error' : undefined}
              onChange={(event) => setEmail(event.target.value)}
              className="h-[40px] w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
            />
            {profileErrors.email ? (
              <p
                id="profile-email-error"
                role="alert"
                data-testid="profile-email-error"
                className="text-xs text-red-400"
              >
                {profileErrors.email}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-[8px]">
            <label htmlFor="profile-ens-input" className="flex items-center text-[15px] text-text-primary">
              <span>Nome ENS</span>
              <span className="ml-1 text-[22px] leading-[29px] text-coral">*</span>
            </label>
            <div className="flex gap-[10px]">
              <select
                aria-label="Sufixo ENS"
                defaultValue=".eth"
                className="h-[40px] w-[78px] shrink-0 rounded-[3px] border border-border-subtle bg-bg-primary px-2 text-[15px] text-text-primary focus:border-accent focus:outline-none"
              >
                <option value=".eth">.eth</option>
                <option value=".xyz">.xyz</option>
              </select>
              <input
                id="profile-ens-input"
                value={ensDomain}
                onChange={(event) => setEnsDomain(event.target.value)}
                className="h-[40px] flex-1 rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-[8px]">
            <label htmlFor="profile-website" className="flex items-center text-[15px] text-text-primary">
              <span>Apelido da carteira</span>
              <span className="ml-0.5 text-[22px] leading-[29px] text-coral">*</span>
            </label>
            <input
              id="profile-website"
              data-testid="profile-website"
              placeholder="https://kurio.art"
              value={website}
              aria-invalid={Boolean(profileErrors.website)}
              aria-describedby={profileErrors.website ? 'profile-website-error' : undefined}
              onChange={(event) => setWebsite(event.target.value)}
              className="h-[40px] w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
            />
            {profileErrors.website ? (
              <p
                id="profile-website-error"
                role="alert"
                data-testid="profile-website-error"
                className="text-xs text-red-400"
              >
                {profileErrors.website}
              </p>
            ) : null}
            <textarea
              id="profile-bio"
              data-testid="profile-bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className="sr-only"
            />
          </div>

          <div className="flex flex-col gap-[8px]">
            <span className="text-[15px] leading-[29px] text-text-primary">Avatar</span>
            <div className="flex items-center gap-[20px]">
              <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-bg-elevated">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`Avatar de ${profile.name}`}
                    width={50}
                    height={50}
                    data-testid="profile-avatar-img"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-accent-bright" aria-hidden="true" />
                )}
              </div>

              <div className="flex items-center gap-[16px]">
                <button
                  type="button"
                  data-testid="profile-sample-avatar-btn"
                  disabled={avatarPending}
                  onClick={onUseSampleAvatar}
                  className="inline-flex h-[40px] w-[98px] items-center justify-center rounded-[3px] bg-accent text-[14px] font-bold text-bg-primary hover:bg-accent-hover cursor-pointer"
                >
                  Alterar
                </button>
                <label
                  htmlFor="profile-avatar-input"
                  className="text-[14px] text-text-primary hover:text-accent-bright cursor-pointer"
                >
                  Remover
                </label>
                <input
                  id="profile-avatar-input"
                  data-testid="profile-avatar-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onAvatarFileChange}
                  className="sr-only"
                />
              </div>
            </div>
            {avatarError ? (
              <p role="alert" data-testid="profile-avatar-error" className="text-xs text-red-400">
                {avatarError}
              </p>
            ) : null}
          </div>
        </div>

        {profileErrors.form ? (
          <p role="alert" className="text-xs text-red-400">
            {profileErrors.form}
          </p>
        ) : null}

        <div>
          <button
            type="submit"
            data-testid="profile-save-btn"
            disabled={updateProfile.isPending}
            className="inline-flex h-[40px] w-[131px] items-center justify-center rounded-[3px] bg-accent text-[14px] font-bold text-bg-primary hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
          >
            {updateProfile.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>

      <form
        onSubmit={(event) => void handlePasswordSubmit(event)}
        noValidate
        className="flex flex-col gap-[20px]"
      >
        <h2 className="text-[16px] font-medium leading-[16px] text-text-primary">Alterar senha</h2>

        <div className="flex flex-col gap-[10px] sm:w-[417px]">
          <label htmlFor="password-current" className="text-[15px] text-text-primary">
            Senha atual
          </label>
          <div className="relative">
            <input
              id="password-current"
              data-testid="password-current"
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              aria-invalid={Boolean(passwordErrors.currentPassword)}
              aria-describedby={passwordErrors.currentPassword ? 'password-current-error' : undefined}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="h-[40px] w-full rounded-[3px] border border-border-subtle bg-transparent pl-3 pr-10 text-[14px] text-text-primary focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              aria-label="Alternar visibilidade da senha"
              onClick={() => setShowPasswords((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
            >
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordErrors.currentPassword ? (
            <p
              id="password-current-error"
              role="alert"
              data-testid="password-current-error"
              className="text-xs text-red-400"
            >
              {passwordErrors.currentPassword}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-[10px] sm:w-[417px]">
          <label htmlFor="password-new" className="text-[15px] text-text-primary">
            Nova senha
          </label>
          <div className="relative">
            <input
              id="password-new"
              data-testid="password-new"
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              aria-invalid={Boolean(passwordErrors.newPassword)}
              aria-describedby={passwordErrors.newPassword ? 'password-new-error' : undefined}
              onChange={(event) => setNewPassword(event.target.value)}
              className="h-[40px] w-full rounded-[3px] border border-border-subtle bg-transparent pl-3 pr-10 text-[14px] text-text-primary focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              aria-label="Alternar visibilidade da nova senha"
              onClick={() => setShowPasswords((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
            >
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordErrors.newPassword ? (
            <p
              id="password-new-error"
              role="alert"
              data-testid="password-new-error"
              className="text-xs text-red-400"
            >
              {passwordErrors.newPassword}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-[10px] sm:w-[417px]">
          <label htmlFor="password-confirm" className="text-[15px] text-text-primary">
            Confirmar nova senha
          </label>
          <div className="relative">
            <input
              id="password-confirm"
              data-testid="password-confirm"
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              aria-invalid={Boolean(passwordErrors.confirmPassword)}
              aria-describedby={passwordErrors.confirmPassword ? 'password-confirm-error' : undefined}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-[40px] w-full rounded-[3px] border border-border-subtle bg-transparent pl-3 pr-10 text-[14px] text-text-primary focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              aria-label="Alternar visibilidade da confirmação de senha"
              onClick={() => setShowPasswords((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
            >
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordErrors.confirmPassword ? (
            <p
              id="password-confirm-error"
              role="alert"
              data-testid="password-confirm-error"
              className="text-xs text-red-400"
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

        <div>
          <button
            type="submit"
            data-testid="password-save-btn"
            disabled={changePassword.isPending}
            className="inline-flex h-[40px] items-center justify-center rounded-[3px] border border-accent px-5 text-[14px] font-bold text-accent-bright hover:bg-accent/15 disabled:opacity-50 cursor-pointer"
          >
            {changePassword.isPending ? 'Atualizando senha...' : 'Atualizar senha'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function ProfilePage() {
  const { logout } = useSession()
  const profileQuery = useProfile()
  const favoritesQuery = useFavorites()
  const ordersQuery = useOrdersList()
  const { updateAvatar } = useProfileMutations()

  const [avatarError, setAvatarError] = useState<string | null>(null)

  if (profileQuery.isLoading) {
    return (
      <div data-testid="profile-skeleton" className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-0">
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <Skeleton className="h-96 lg:col-span-3" />
          <Skeleton className="h-96 lg:col-span-9" />
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

  const favoriteIds = favoritesQuery.data?.nftIds ?? []
  const orders = ordersQuery.data ?? []

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pt-8 sm:px-6 lg:px-0">
      <div className="flex flex-col items-start gap-[28px] lg:flex-row">
        <AccountSidebar activeSection="profile" onLogout={() => void logout()} />

        <div className="flex w-full flex-1 flex-col gap-[32px]">
          <ProfileDetailsSection
            key={profile.updatedAt}
            profile={profile}
            avatarError={avatarError}
            onAvatarFileChange={handleAvatarFileChange}
            onUseSampleAvatar={() => void handleUseGeneratedAvatar()}
            avatarPending={updateAvatar.isPending}
          />

          <div
            id="profile-favorites-section"
            className="grid grid-cols-1 gap-6 border-t border-border-subtle pt-6 sm:grid-cols-2"
          >
            <div>
              <h2 className="text-[16px] font-bold text-text-primary">
                Lista de interesse ({favoriteIds.length})
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
                      className="rounded-[3px] border border-border-subtle bg-bg-secondary px-3 py-1.5 text-xs text-text-primary hover:border-accent"
                    >
                      {id}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div id="profile-activity-section">
              <h2 className="text-[16px] font-bold text-text-primary">
                Atividade ({orders.length})
              </h2>
              {orders.length === 0 ? (
                <p className="mt-2 text-xs text-text-secondary">Nenhum pedido registrado nesta conta.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-xs">
                  {orders.slice(0, 5).map((order) => (
                    <li
                      key={order.id}
                      className="flex items-center justify-between rounded-[3px] border border-border-subtle bg-bg-secondary px-3 py-2"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
