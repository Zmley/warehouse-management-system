import React from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#4592FF'
    }
  },
  typography: {
    fontFamily: 'Roboto',
    allVariants: {
      color: '#282F36'
    },
    body1: {
      fontSize: 14,
      lineHeight: '20px'
    },
    body2: {
      fontSize: 20,
      lineHeight: '43px'
    },
    h1: {
      fontSize: 60,
      fontWeight: 900,
      lineHeight: '85px'
    },
    h2: {
      fontSize: 40,
      fontWeight: 700,
      lineHeight: '57px'
    },
    h5: {
      fontSize: 22,
      fontWeight: 700,
      lineHeight: '31px'
    },
    h6: {
      fontSize: 20,
      fontWeight: 600,
      lineHeight: '28px'
    }
  }
})
interface Props {
  children: any
}
const MuiThemeProvider = ({ children }: Props) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

export default MuiThemeProvider
