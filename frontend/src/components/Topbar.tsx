import React, { useState } from 'react'
import {
  Box,
  IconButton,
  Typography,
  Switch,
  FormControlLabel
} from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import ProfileDrawer from 'pages/Profile'

interface TopBarProps {
  userName: string
}

const TopBar: React.FC<TopBarProps> = ({ userName }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { i18n, t } = useTranslation()

  const isZh = i18n.language === 'zh'

  const handleLanguageToggle = () => {
    const newLang = isZh ? 'en' : 'zh'
    i18n.changeLanguage(newLang)
    localStorage.setItem('i18nextLng', newLang)
  }

  return (
    <>
      <Box
        sx={{
          height: 56,

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          backgroundColor: '#f9fafb',
          boxShadow: '0px 2px 3px #0000000F'
        }}
      >
        {/* Left menu icon */}
        <IconButton onClick={() => setDrawerOpen(true)}>
          <MenuIcon sx={{ fontSize: 24, color: '#333' }} />
        </IconButton>

        {/* Center title */}
        <Typography
          variant='subtitle1'
          sx={{
            fontWeight: 600,
            color: '#333',
            flex: 1,
            textAlign: 'center'
          }}
        >
          {t('topbar.greeting', { name: userName })}
        </Typography>

        {/* Right language toggle */}
        <FormControlLabel
          control={
            <Switch
              size='small'
              checked={!isZh}
              onChange={handleLanguageToggle}
              color='primary'
            />
          }
          label={isZh ? '中文' : 'English'}
          labelPlacement='start'
          sx={{
            ml: 1,
            mr: -1,
            '& .MuiFormControlLabel-label': {
              fontSize: 12,
              fontWeight: 600,
              color: '#2563eb'
            }
          }}
        />
      </Box>

      <ProfileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}

export default TopBar
