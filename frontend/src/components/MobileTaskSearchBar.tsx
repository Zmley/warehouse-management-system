import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import {
  Box,
  InputBase,
  InputAdornment,
  Paper,
  Popper,
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
  /** Narrow field for toolbar row (e.g. beside Pending); suggestions use a wider min width */
  compact?: boolean
  /** Focus programmatically when expanding toolbar (parent should call .focus() on expand) */
  inputRef?: React.Ref<HTMLInputElement>
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
  noResultsText,
  compact = false,
  inputRef
}) => {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (q.length < 1) return []
    return options
      .filter(o => (o || '').toLowerCase().startsWith(q))
      .slice(0, maxSuggestions)
  }, [value, options, maxSuggestions])

  useEffect(() => {
    const onDoc = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (wrapRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setOpen(false)
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

  const showSuggestions = open && suggestions.length > 0
  const showNoResults = open && value.trim().length >= 1 && suggestions.length === 0
  const showDropdown = showSuggestions || showNoResults
  const anchorWidth = wrapRef.current?.getBoundingClientRect().width

  return (
    <Box
      ref={wrapRef}
      sx={{
        position: 'relative',
        mb: compact ? 0 : 1.25,
        px: compact ? 0 : 0.25,
        width: '100%',
        minWidth: 0,
        zIndex: open ? 1301 : 'auto'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          minHeight: compact ? 40 : 44,
          px: compact ? 0.75 : 1.25,
          borderRadius: compact ? '10px' : '12px',
          backgroundColor: 'rgba(120, 120, 128, 0.12)',
          border: '1px solid rgba(0,0,0,0.06)',
          transition: 'background-color 0.15s ease',
          '&:focus-within': {
            backgroundColor: 'rgba(120, 120, 128, 0.16)'
          }
        }}
      >
        <InputAdornment position='start' sx={{ mr: compact ? 0.25 : 0.5 }}>
          <SearchIcon
            sx={{
              fontSize: compact ? 18 : 22,
              color: 'text.secondary',
              opacity: 0.65
            }}
          />
        </InputAdornment>
        <InputBase
          fullWidth
          inputRef={inputRef}
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
              paddingTop: compact ? 8 : 10,
              paddingBottom: compact ? 8 : 10
            }
          }}
          sx={{
            flex: 1,
            minWidth: 0,
            '& input::placeholder': {
              color: 'text.secondary',
              opacity: 0.75,
              fontSize: compact ? 14 : 16
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

      <Popper
        open={showDropdown}
        anchorEl={wrapRef.current}
        placement='bottom-start'
        modifiers={[
          { name: 'offset', options: { offset: [0, 6] } },
          {
            name: 'preventOverflow',
            options: { padding: 8, altAxis: true }
          }
        ]}
        sx={{ zIndex: 2500 }}
      >
        <Paper
          ref={dropdownRef}
          elevation={showSuggestions ? 8 : 4}
          sx={{
            width: compact
              ? 'min(92vw, 320px)'
              : anchorWidth
                ? `${Math.round(anchorWidth)}px`
                : 'min(92vw, 420px)',
            maxWidth: 'calc(100vw - 16px)',
            borderRadius: 2,
            ...(showSuggestions
              ? {
                  maxHeight: Math.min(44 * maxSuggestions, 280),
                  overflow: 'auto',
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch'
                }
              : { px: 1.5, py: 1.25 })
          }}
        >
          {showSuggestions ? (
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
          ) : (
            <Typography variant='body2' color='text.secondary' sx={{ fontSize: 15 }}>
              {noResultsText ?? placeholder}
            </Typography>
          )}
        </Paper>
      </Popper>
    </Box>
  )
}

export default MobileTaskSearchBar
