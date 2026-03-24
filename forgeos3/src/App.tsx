import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout } from './components/layout/AuthLayout'
import { Landing } from './pages/Landing'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { Dashboard } from './pages/Dashboard'
import { BuilderConsole } from './pages/BuilderConsole'
import { RegistryManager } from './pages/RegistryManager'
import { PolicyStudio } from './pages/PolicyStudio'
import { SentinelStudio } from './pages/SentinelStudio'
import { ApprovalsPanel } from './pages/ApprovalsPanel'
import { Settings } from './pages/Settings'
import { ToolGateway } from './pages/ToolGateway'
import { LoopGuard } from './pages/LoopGuard'
import { AuditTrail } from './pages/AuditTrail'
import { SandboxLayer } from './pages/SandboxLayer'
import { AttackSimulator } from './pages/AttackSimulator'
import { SecurityPulse } from './pages/SecurityPulse'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route element={<AuthLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/builder" element={<BuilderConsole />} />
          <Route path="/registry" element={<RegistryManager />} />
          <Route path="/policy" element={<PolicyStudio />} />
          <Route path="/gateway" element={<ToolGateway />} />
          <Route path="/loopguard" element={<LoopGuard />} />
          <Route path="/sandbox" element={<SandboxLayer />} />
          <Route path="/sentinel" element={<SentinelStudio />} />
          <Route path="/audit" element={<AuditTrail />} />
          <Route path="/approvals" element={<ApprovalsPanel />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/attack-simulator" element={<AttackSimulator />} />
          <Route path="/security-pulse" element={<SecurityPulse />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}