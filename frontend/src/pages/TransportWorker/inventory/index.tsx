import React, { useState, Suspense } from 'react'
import { Box, Button, ButtonGroup } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import { useTranslation } from 'react-i18next'

import InventorySearch from './searchInventory'
import InventoryEdit from './Inventory'
import MobileReceive from './Receiving/MobileReceive'

type TabKey = 'search' | 'edit' | 'receive'

const InventoryIndex: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('search')
  const { t } = useTranslation()

  const labelSearch = t('inventoryIndex.searchTab', '库存查询')
  const labelEdit = t('inventoryIndex.editTab', '库存编辑')
  const labelReceive = t('inventoryIndex.receiveTab', '收货')

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        m: 0,
        p: 0,
        bgcolor: 'transparent'
      }}
    >
      {/* 顶部按钮组 */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          width: '100%',
          bgcolor: '#F7F9FC',
          px: 0,
          py: 0.5,
          borderBottom: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        <ButtonGroup
          variant='contained'
          color='primary'
          fullWidth
          sx={{
            width: '100%',
            boxShadow: 'none',
            borderRadius: 0,
            '& .MuiButtonGroup-grouped': {
              flex: 1,
              minWidth: 0
            }
          }}
        >
          {/* 库存查询 */}
          <Button
            startIcon={<SearchIcon />}
            onClick={() => setTab('search')}
            variant={tab === 'search' ? 'contained' : 'text'}
            sx={{
              borderRadius: 0,
              py: 1.25,
              fontWeight: 700,
              boxShadow: 'none',
              ...(tab !== 'search' && { color: '#1f2937' })
            }}
            aria-pressed={tab === 'search'}
            aria-label={labelSearch}
          >
            {labelSearch}
          </Button>

          {/* 库存编辑 */}
          <Button
            startIcon={<EditIcon />}
            onClick={() => setTab('edit')}
            variant={tab === 'edit' ? 'contained' : 'text'}
            sx={{
              borderRadius: 0,
              py: 1.25,
              fontWeight: 700,
              boxShadow: 'none',
              ...(tab !== 'edit' && { color: '#1f2937' })
            }}
            aria-pressed={tab === 'edit'}
            aria-label={labelEdit}
          >
            {labelEdit}
          </Button>

          {/* 收货按钮 */}
          <Button
            startIcon={<LocalShippingIcon />}
            onClick={() => setTab('receive')}
            variant={tab === 'receive' ? 'contained' : 'text'}
            sx={{
              borderRadius: 0,
              py: 1.25,
              fontWeight: 700,
              boxShadow: 'none',
              ...(tab !== 'receive' && { color: '#1f2937' })
            }}
            aria-pressed={tab === 'receive'}
            aria-label={labelReceive}
          >
            {labelReceive}
          </Button>
        </ButtonGroup>
      </Box>

      {/* 内容区域 */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          p: 0,
          m: 0,
          bgcolor: '#F7F9FC'
        }}
      >
        <Suspense fallback={null}>
          {tab === 'search' && <InventorySearch />}
          {tab === 'edit' && <InventoryEdit />}
          {tab === 'receive' && <MobileReceive />} {/* ✅ 新增 */}
        </Suspense>
      </Box>
    </Box>
  )
}

export default InventoryIndex
