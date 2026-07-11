import { MainPage } from '@/pages/main'
import '@/app/styles/App.css'
import { AppErrorBoundary } from './app-error-boundary'

function App() {
  return (
    <AppErrorBoundary>
      <MainPage />
    </AppErrorBoundary>
  )
}

export default App
