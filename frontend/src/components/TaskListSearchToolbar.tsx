import React, { useEffect, useRef } from 'react'
import { Box, Typography, IconButton, keyframes } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import { useTranslation } from 'react-i18next'
import MobileTaskSearchBar from 'components/MobileTaskSearchBar'

const expandIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-10px) scaleX(0.92);
  }
  to {
    opacity: 1;
    transform: translateX(0) scaleX(1);
  }
`

export type TaskListSearchToolbarProps = {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  value: string
  onChange: (v: string) => void
  onSubmit: (q: string) => void
  onClear: () => void
  options: string[]
  disabled?: boolean
  showOutOfStock: boolean
  onToggleOutOfStock: () => void
  /** Worker: category tabs in the middle (replaces static pull hint) */
  centerSlot?: React.ReactNode
}

/**
 * Collapsed: [🔍] [center: pull hint | custom slot] [Pending ›]
 * Expanded: search field + [✕]
 */
const TaskListSearchToolbar: React.FC<TaskListSearchToolbarProps> = ({
  expanded,
  onExpandedChange,
  value,
  onChange,
  onSubmit,
  onClear,
  options,
  disabled,
  showOutOfStock,
  onToggleOutOfStock,
  centerSlot
}) => {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!expanded) return
    const t1 = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
    const t2 = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 220)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [expanded])

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: 40,
        mb: 1.25
      }}
    >
      {!expanded ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            minHeight: 40
          }}
        >
          <IconButton
            size='small'
            onClick={() => onExpandedChange(true)}
            sx={{
              flexShrink: 0,
              backgroundColor: '#f0f0f0',
              width: 40,
              height: 40,
              borderRadius: '50%'
            }}
            aria-label={t('taskList.openSearch')}
          >
            <SearchIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
          </IconButton>
          {centerSlot != null ? (
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                px: 0.25
              }}
            >
              {centerSlot}
            </Box>
          ) : (
            <Typography
              sx={{
                flex: 1,
                minWidth: 0,
                textAlign: 'center',
                fontSize: 11,
                fontStyle: 'italic',
                color: 'text.secondary',
                lineHeight: 1.25,
                px: 0.5
              }}
              noWrap
            >
              {t('taskList.pullToRefresh')}
            </Typography>
          )}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              flexShrink: 0
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 'bold',
                color: showOutOfStock ? '#d32f2f' : '#2563eb',
                whiteSpace: 'nowrap'
              }}
            >
              {showOutOfStock
                ? t('taskList.status.outOfStock')
                : t('taskList.status.pending')}
            </Typography>
            <IconButton
              size='small'
              onClick={onToggleOutOfStock}
              sx={{
                backgroundColor: '#f0f0f0',
                borderRadius: '50%',
                width: 24,
                height: 24
              }}
              aria-label={
                showOutOfStock
                  ? t('taskList.status.pending')
                  : t('taskList.status.outOfStock')
              }
            >
              {showOutOfStock ? (
                <ArrowBackIosNewIcon fontSize='small' />
              ) : (
                <ArrowForwardIosIcon fontSize='small' />
              )}
            </IconButton>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            minHeight: 40,
            minWidth: 0,
            transformOrigin: 'left center',
            animation: `${expandIn} 0.32s cubic-bezier(0.33, 1, 0.68, 1) forwards`
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <MobileTaskSearchBar
              compact
              inputRef={inputRef}
              value={value}
              onChange={onChange}
              onSubmit={onSubmit}
              onClear={onClear}
              options={options}
              placeholder={t('taskList.searchPlaceholder')}
              noResultsText={t('taskList.searchNoMatch')}
              disabled={disabled}
            />
          </Box>
          <IconButton
            size='small'
            onClick={() => onExpandedChange(false)}
            sx={{
              flexShrink: 0,
              backgroundColor: '#f0f0f0',
              width: 40,
              height: 40,
              borderRadius: '50%'
            }}
            aria-label={t('taskList.closeSearch')}
          >
            <CloseIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
          </IconButton>
        </Box>
      )}
    </Box>
  )
}

export default TaskListSearchToolbar
