import React from 'react'
import { BottomNavigation, BottomNavigationAction } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import AssignmentIcon from '@mui/icons-material/Assignment'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import ArchiveIcon from '@mui/icons-material/Archive'
import SearchIcon from '@mui/icons-material/Search'

interface PickerBottomBarProps {
  selectedView: 'task' | 'archived' | 'inventory'
  onTaskListClick: () => void
  onCreateTaskClick: () => void
  onArchivedClick: () => void
  onInventoryClick?: () => void
}

const PickerBottombar: React.FC<PickerBottomBarProps> = ({
  selectedView,
  onTaskListClick,
  onCreateTaskClick,
  onArchivedClick,
  onInventoryClick
}) => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <BottomNavigation
      value={selectedView}
      showLabels
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        boxShadow: '0px -2px 4px #0000001A',
        zIndex: 100
      }}
    >
      <BottomNavigationAction
        label={t('pickerBottomBar.taskList')}
        icon={<AssignmentIcon />}
        value='task'
        onClick={onTaskListClick}
        sx={{ minWidth: '25%' }}
      />

      <BottomNavigationAction
        label={t('pickerBottomBar.createTask')}
        icon={<AddCircleIcon />}
        value=''
        onClick={onCreateTaskClick || (() => navigate('/picker-scan-bin'))}
        sx={{ minWidth: '25%' }}
      />

      <BottomNavigationAction
        label={t('pickerBottomBar.queryProduct')}
        icon={<SearchIcon />}
        value='inventory'
        onClick={onInventoryClick}
        sx={{ minWidth: '25%' }}
      />

      <BottomNavigationAction
        label={t('pickerBottomBar.archivedTask')}
        icon={<ArchiveIcon />}
        value='archived'
        onClick={onArchivedClick}
        sx={{ minWidth: '25%' }}
      />
    </BottomNavigation>
  )
}

export default PickerBottombar
