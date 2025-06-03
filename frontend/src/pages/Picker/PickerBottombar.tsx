import React from 'react'
import { BottomNavigation, BottomNavigationAction } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import AssignmentIcon from '@mui/icons-material/Assignment'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import ArchiveIcon from '@mui/icons-material/Archive'

interface PickerBottomBarProps {
  selectedView: 'task' | 'archived'
  onTaskListClick: () => void
  onCreateTaskClick: () => void
  onArchivedClick: () => void
}

const PickerBottombar: React.FC<PickerBottomBarProps> = ({
  selectedView,
  onTaskListClick,
  onCreateTaskClick,
  onArchivedClick
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
        boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.1)',
        zIndex: 100
      }}
    >
      <BottomNavigationAction
        label={t('pickerBottomBar.taskList')}
        icon={<AssignmentIcon />}
        value='task'
        onClick={onTaskListClick}
        sx={{ minWidth: '33.33%' }}
      />

      <BottomNavigationAction
        label={t('pickerBottomBar.createTask')}
        icon={<AddCircleIcon />}
        value=''
        onClick={onCreateTaskClick || (() => navigate('/picker-scan-bin'))}
        sx={{ minWidth: '33.33%' }}
      />

      <BottomNavigationAction
        label={t('pickerBottomBar.archivedTask')}
        icon={<ArchiveIcon />}
        value='archived'
        onClick={onArchivedClick}
        sx={{ minWidth: '33.33%' }}
      />
    </BottomNavigation>
  )
}

export default PickerBottombar
