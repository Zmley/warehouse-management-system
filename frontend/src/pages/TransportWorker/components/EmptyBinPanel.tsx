import { useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { useBin } from 'hooks/useBin'
import { useTranslation } from 'react-i18next'
import { useEmptyBinSearch } from 'hooks/useEmptyBinSearch'

type EmptyBin = { binID: string; binCode: string }

const EmptyBinPanel: React.FC = () => {
  const { t } = useTranslation()
  const { emptyBins, isLoading, fetchEmptyBins } = useBin()
  const { q, setQ, displayBins, showSpinner, refresh } = useEmptyBinSearch({
    emptyBins: emptyBins as EmptyBin[],
    isLoading,
    fetchEmptyBins
  })

  const title = useMemo(() => t('emptyBins.title'), [t])

  return (
    <Card
      variant='outlined'
      sx={{
        mb: 0.5,
        borderRadius: 2,
        backgroundColor: '#fff',
        border: '1px solid #EEE',
        boxShadow: '0 2px 8px #00000012'
      }}
    >
      <CardContent
        sx={{
          px: 1,
          py: 0.5,
          '&:last-child': { pb: 0.5 }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            minHeight: 28,
            mb: 0.5
          }}
        >
          <Typography
            fontWeight={900}
            fontSize={14}
            lineHeight={1}
            letterSpacing={0.3}
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 999,
              background: 'linear-gradient(180deg, #F9FAFB 0%, #EFF6FF 100%)',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            {title}
          </Typography>

          <TextField
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t('emptyBins.search')}
            size='small'
            variant='outlined'
            inputProps={{ 'aria-label': 'search-empty-bins' }}
            sx={{
              width: 160,
              '& .MuiInputBase-root': { height: 28, borderRadius: 999 },
              '& .MuiInputBase-input': { fontSize: 12.5, py: 0 }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchRoundedIcon sx={{ fontSize: 16, color: '#6B7280' }} />
                </InputAdornment>
              )
            }}
          />

          <IconButton
            size='small'
            onClick={refresh}
            disabled={isLoading}
            aria-label='refresh-empty-bins'
            sx={{
              width: 28,
              height: 28,
              p: 0,
              borderRadius: 999,
              border: '1px solid #E5E7EB',
              backgroundColor: '#fff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              '&:hover': { backgroundColor: '#F3F4F6' }
            }}
          >
            {isLoading ? (
              <CircularProgress size={12} thickness={5} />
            ) : (
              <RefreshRoundedIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </Box>

        <Box
          sx={{
            overflowX: 'auto',
            overflowY: 'hidden',
            '::-webkit-scrollbar': { height: 0 },
            scrollbarWidth: 'none'
          }}
        >
          {showSpinner ? (
            <Box display='flex' justifyContent='center' py={0.5}>
              <CircularProgress size={16} thickness={5} />
            </Box>
          ) : displayBins.length === 0 ? (
            <Typography color='text.secondary' fontSize={12} sx={{ px: 0.5 }}>
              {t('emptyBins.none')}
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'stretch',
                border: '1px solid #E5E7EB',
                borderRadius: 1.5,
                overflow: 'hidden',
                height: 36,
                whiteSpace: 'nowrap',
                backgroundColor: '#FFFFFF'
              }}
            >
              {displayBins.map((b, idx) => (
                <Box
                  key={b.binID}
                  sx={{
                    flex: '0 0 auto',
                    minWidth: 92,
                    px: 1.25,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderLeft: idx === 0 ? 'none' : '1px solid #E5E7EB'
                  }}
                  title={b.binCode}
                >
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: 18,
                      letterSpacing: 0.3,
                      lineHeight: 1,
                      color: '#111827',
                      textAlign: 'center',
                      userSelect: 'none'
                    }}
                  >
                    {b.binCode}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default EmptyBinPanel
