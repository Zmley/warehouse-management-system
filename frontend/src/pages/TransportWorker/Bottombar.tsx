import React from 'react'
import { BottomNavigation, BottomNavigationAction } from '@mui/material'
import ListAltIcon from '@mui/icons-material/ListAlt'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { useCart } from 'hooks/useCart'
import { useNavigate } from 'react-router-dom'

interface BottomBarProps {
  onTaskListClick: () => void
  onCreateTaskClick: () => void
}

const BottomBar: React.FC<BottomBarProps> = ({
  onTaskListClick,
  onCreateTaskClick
}) => {
  const { isCartEmpty } = useCart()
  const navigate = useNavigate()

  const handleCreateClick = () => {
    if (!isCartEmpty) {
      navigate('/my-task')
    } else {
      onCreateTaskClick()
    }
  }

  return (
    <BottomNavigation
      showLabels
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.1)'
      }}
    >
      <BottomNavigationAction
        label='Task List'
        icon={<ListAltIcon sx={{ fontSize: 24 }} />}
        onClick={onTaskListClick}
        sx={{ minWidth: '50%' }}
      />
      <BottomNavigationAction
        label='Create new task'
        icon={<AddCircleOutlineIcon sx={{ fontSize: 24 }} />}
        onClick={handleCreateClick}
        sx={{ minWidth: '50%' }}
      />
    </BottomNavigation>
  )
}

export default BottomBar
