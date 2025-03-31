import React from 'react'
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material'
import { Home, Inventory2, Storefront, PeopleAlt } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

const Sidebar: React.FC = () => {
  const navigate = useNavigate()

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  return (
    <Drawer
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          backgroundColor: '#1F4E79', // Blue color for the sidebar
          color: 'white'
        }
      }}
      variant='permanent'
      anchor='left'
    >
      <List>
        {/* Tasks Section */}
        <ListItemButton onClick={() => handleNavigation('/tasks')}>
          <ListItemIcon>
            <Home sx={{ color: 'white' }} />
          </ListItemIcon>
          <ListItemText primary='Tasks' sx={{ color: 'white' }} />
        </ListItemButton>

        {/* Inventory Section */}
        <ListItemButton onClick={() => handleNavigation('/inventory')}>
          <ListItemIcon>
            <Inventory2 sx={{ color: 'white' }} />
          </ListItemIcon>
          <ListItemText primary='Inventory' sx={{ color: 'white' }} />
        </ListItemButton>

        {/* Products Section */}
        <ListItemButton onClick={() => handleNavigation('/products')}>
          <ListItemIcon>
            <Storefront sx={{ color: 'white' }} />
          </ListItemIcon>
          <ListItemText primary='Products' sx={{ color: 'white' }} />
        </ListItemButton>

        {/* Users Section */}
        <ListItemButton onClick={() => handleNavigation('/users')}>
          <ListItemIcon>
            <PeopleAlt sx={{ color: 'white' }} />
          </ListItemIcon>
          <ListItemText primary='Users' sx={{ color: 'white' }} />
        </ListItemButton>
      </List>

      <Divider sx={{ backgroundColor: 'white' }} />
    </Drawer>
  )
}

export default Sidebar
