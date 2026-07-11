import { MainPage } from '@/pages/main'
import '@/app/styles/app.css'
import { AppErrorBoundary } from './app-error-boundary'

function App() {
  return (
    <AppErrorBoundary>
      <MainPage />
    </AppErrorBoundary>
  )
}

export default App
