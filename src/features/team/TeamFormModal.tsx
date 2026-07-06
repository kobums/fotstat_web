import { useState, type FormEvent } from 'react'
import Button from '../../components/Button/Button'
import Modal from '../../components/Modal/Modal'
import TextField from '../../components/TextField/TextField'
import { ApiError } from '../../core/api/client'
import type { Team } from '../../core/api/types'
import { useCreateTeam, useUpdateTeam } from './useTeams'
import styles from './TeamFormModal.module.css'

interface Props {
  team?: Team | null
  onClose: () => void
}

// Mounted only while open (see parent), so useState initializes from props
// without needing an effect to sync.
export default function TeamFormModal({ team, onClose }: Props) {
  const [name, setName] = useState(team?.name ?? '')
  const [duration, setDuration] = useState(String(team?.duration ?? 45))
  const [error, setError] = useState<string | null>(null)
  const [durationError, setDurationError] = useState<string | null>(null)
  const create = useCreateTeam()
  const update = useUpdateTeam()
  const editing = !!team

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('팀 이름을 입력해주세요.')
      return
    }
    setError(null)
    const dur = Number(duration)
    if (!Number.isInteger(dur) || dur < 1 || dur > 120) {
      setDurationError('쿼터 기본 시간은 1~120분 사이여야 합니다.')
      return
    }
    setDurationError(null)
    try {
      if (editing && team) {
        await update.mutateAsync({ id: team.id, name: trimmed, duration: dur })
      } else {
        await create.mutateAsync({ name: trimmed, duration: dur })
      }
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '저장에 실패했습니다.')
    }
  }

  return (
    <Modal open title={editing ? '팀 수정' : '팀 추가'} onClose={onClose}>
      <form onSubmit={onSubmit} className={styles.form}>
        <TextField label="팀 이름" value={name} onChange={e => setName(e.target.value)} placeholder="FC 서울" autoFocus error={error ?? undefined} />
        <TextField
          label="쿼터 기본 시간 (분)"
          type="number"
          inputMode="numeric"
          min={1}
          max={120}
          value={duration}
          onChange={e => setDuration(e.target.value)}
          placeholder="45"
          error={durationError ?? undefined}
        />
        <Button type="submit" loading={create.isPending || update.isPending}>
          {editing ? '저장' : '추가'}
        </Button>
      </form>
    </Modal>
  )
}
