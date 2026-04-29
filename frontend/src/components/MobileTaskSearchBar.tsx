import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import {
  Box,
  InputBase,
  InputAdornment,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Typography
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'

type Props = {
  /** Shown in field; not submitted until Enter / pick suggestion / search tap */
  value: string
  onChange: (v: string) => void
  onSubmit: (v: string) => void
  onClear: () => void
  options: string[]
  placeholder: string
  disabled?: boolean
  /** Max suggestion rows */
  maxSuggestions?: number
  noResultsText?: string
}

/**
 * Mobile-first search: iOS-style rounded field, 16px text (avoids iOS zoom),
 * bottom sheet–like suggestion list, large touch targets.
 */
const MobileTaskSearchBar: React.FC<Props> = ({
  value,
  onChange,
  onSubmit,
  onClear,
  options,
  placeholder,
  disabled,
  maxSuggestions = 8,
  noResultsText
}) => {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (q.length < 1) return []
    return options
      .filter(o => (o || '').toLowerCase().startsWith(q))
      .slice(0, maxSuggestions)
  }, [value, options, maxSuggestions])

  useEffect(() => {
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('touchstart', onDoc, { passive: true })
    document.addEventListener('mousedown', onDoc)
    return () => {
      document.removeEventListener('touchstart', onDoc)
      document.removeEventListener('mousedown', onDoc)
    }
  }, [])

  const submit = useCallback(() => {
    setOpen(false)
    onSubmit(value.trim())
  }, [onSubmit, value])

  const pick = useCallback(
    (code: string) => {
      onChange(code)
      setOpen(false)
      onSubmit(code.trim())
    },
    [onChange, onSubmit]
  )

  const clear = useCallback(() => {
    onChange('')
    setOpen(false)
    onClear()
  }, [onChange, onClear])

  return (
    <Box ref={wrapRef} sx={{ position: 'relative', mb: 1.25, px: 0.25 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          minHeight: 44,
          px: 1.25,
          borderRadius: '12px',
          backgroundColor: 'rgba(120, 120, 128, 0.12)',
          border: '1px solid rgba(0,0,0,0.06)',
          transition: 'background-color 0.15s ease',
          '&:focus-within': {
            backgroundColor: 'rgba(120, 120, 128, 0.16)'
          }
        }}
      >
        <InputAdornment position='start' sx={{ mr: 0.5 }}>
          <SearchIcon sx={{ fontSize: 22, color: 'text.secondary', opacity: 0.65 }} />
        </InputAdornment>
        <InputBase
          fullWidth
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={e => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            if (value.trim().length >= 1) setOpen(true)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
          inputProps={{
            'aria-label': placeholder,
            enterKeyHint: 'search',
            inputMode: 'search',
            autoCapitalize: 'none',
            autoCorrect: 'off',
            spellCheck: false,
            style: {
              fontSize: 16,
              lineHeight: 1.35,
              paddingTop: 10,
              paddingBottom: 10
            }
          }}
          sx={{
            flex: 1,
            '& input::placeholder': {
              color: 'text.secondary',
              opacity: 0.75,
              fontSize: 16
            }
          }}
        />
        {value.trim().length > 0 && (
          <IconButton
            size='small'
            onClick={clear}
            aria-label='Clear'
            sx={{
              p: 0.75,
              color: 'text.secondary',
              '&:active': { opacity: 0.7 }
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        )}
      </Box>

      {open && suggestions.length > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 'calc(100% + 6px)',
            zIndex: 10,
            borderRadius: 2,
            maxHeight: Math.min(44 * maxSuggestions, 280),
            overflow: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <List dense disablePadding>
            {suggestions.map(code => (
              <ListItemButton
                key={code}
                onClick={() => pick(code)}
                sx={{ minHeight: 48, py: 1.25, px: 1.5 }}
              >
                <ListItemText
                  primary={code}
                  primaryTypographyProps={{
                    fontSize: 16,
                    fontWeight: 500
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      {open && value.trim().length >= 1 && suggestions.length === 0 && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 'calc(100% + 6px)',
            zIndex: 10,
            borderRadius: 2,
            px: 1.5,
            py: 1.25
          }}
        >
          <Typography variant='body2' color='text.secondary' sx={{ fontSize: 15 }}>
            {noResultsText ?? placeholder}
          </Typography>
        </Paper>
      )}
    </Box>
  )
}

export default MobileTaskSearchBar
