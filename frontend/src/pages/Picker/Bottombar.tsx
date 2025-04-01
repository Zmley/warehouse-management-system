import React from 'react'
import { BottomNavigation, BottomNavigationAction } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import AssignmentIcon from '@mui/icons-material/Assignment'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import ArchiveIcon from '@mui/icons-material/Archive'

interface PickerBottomBarProps {
  onTaskListClick?: () => void
  onArchivedClick?: () => void
}

const PickerBottomBar: React.FC<PickerBottomBarProps> = ({
  onTaskListClick,
  onArchivedClick
}) => {
  const navigate = useNavigate()

  return (
    <BottomNavigation
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
        label='Task List'
        icon={<AssignmentIcon />}
        onClick={onTaskListClick || (() => navigate('/task-list'))}
        sx={{ minWidth: '33.33%' }}
      />

      <BottomNavigationAction
        label='Create Task'
        icon={<AddCircleIcon />}
        onClick={() => navigate('/picker-scan-bin')}
        sx={{ minWidth: '33.33%' }}
      />

      <BottomNavigationAction
        label='Archived Task'
        icon={<ArchiveIcon />}
        onClick={onArchivedClick || (() => navigate('/archived-tasks'))}
        sx={{ minWidth: '33.33%' }}
      />
    </BottomNavigation>
  )
}

export default PickerBottomBar
