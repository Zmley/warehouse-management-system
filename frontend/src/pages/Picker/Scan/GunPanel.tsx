import { useEffect, useMemo, useRef, useState } from 'react'
import { Paper, Box, TextField, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

export default function GunPanel({
  onScan,
  error,
  setError
}: {
  onScan: (code: string) => void
  error: string | null
  setError: (e: string | null) => void
}) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const END_KEYS = useMemo(() => new Set(['Enter', 'Tab']), [])
  const IDLE_SUBMIT_MS = 140
  const idleRef = useRef<number | null>(null)
  const submittingRef = useRef(false)

  const submit = (raw: string) => {
    if (submittingRef.current) return
    const text = raw.replace(/[\r\n\t]+/g, '').trim()
    if (!text) return
    submittingRef.current = true
    setError(null)
    onScan(text)
    setValue('')
    setTimeout(() => {
      submittingRef.current = false
      inputRef.current?.focus()
    }, 120)
  }

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    const v = e.target.value
    setValue(v)
    if (idleRef.current) window.clearTimeout(idleRef.current)
    idleRef.current = window.setTimeout(() => {
      if (v.trim()) submit(v)
      idleRef.current = null
    }, IDLE_SUBMIT_MS)
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
    if (END_KEYS.has(e.key)) {
      e.preventDefault()
      if (idleRef.current) {
        window.clearTimeout(idleRef.current)
        idleRef.current = null
      }
      submit(value)
    }
  }

  useEffect(() => {
    inputRef.current?.focus()
    return () => {
      if (idleRef.current) window.clearTimeout(idleRef.current)
    }
  }, [])

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid #e6ebf2',
        bgcolor: 'rgba(255,255,255,0.9)'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <TextField
          inputRef={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t('scan.gun.placeholder')}
          variant='outlined'
          size='small'
          sx={{ width: '100%', maxWidth: 420 }}
          autoFocus
          inputProps={{
            autoCapitalize: 'none',
            autoCorrect: 'off',
            spellCheck: 'false',
            style: { textAlign: 'center', fontWeight: 700, letterSpacing: 0.5 }
          }}
        />
      </Box>
      {error && (
        <Typography
          color='error'
          mt={1.25}
          fontWeight='bold'
          textAlign='center'
        >
          {error}
        </Typography>
      )}
    </Paper>
  )
}
