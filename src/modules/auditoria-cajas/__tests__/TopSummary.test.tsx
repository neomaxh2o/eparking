import React from 'react'
import { render, screen } from '@testing-library/react'
import TopSummary from '../components/TopSummary'

test('renders summary and refresh', ()=>{
  render(<TopSummary summary={{ totalCajas: 5, abiertas: 2, lastUpdated: 'now' }} onRefresh={()=>{}} setAutoRefreshInterval={()=>{}} />)
  expect(screen.getByText(/Totales/)).toBeInTheDocument()
})
