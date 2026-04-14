import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { CharactersPage } from './pages/CharactersPage'
import { CampaignsPage } from './pages/CampaignsPage'
import { CharacterSheetPage } from './pages/CharacterSheetPage'
import { PartiesPage } from './pages/PartiesPage'
import { DicePage } from './pages/DicePage'
import { DMSuitePage } from './pages/DMSuitePage'
import { DMSuiteTopicPage } from './pages/DMSuiteTopicPage'
import { DMCheatSheetsPage } from './pages/DMCheatSheetsPage'
import { DMEncounterTrackerPage } from './pages/DMEncounterTrackerPage'
import { DMLootGeneratorPage } from './pages/DMLootGeneratorPage'
import { MapsPage } from './pages/MapsPage'
import { ForumPage } from './pages/ForumPage'
import { ReferencesPage } from './pages/ReferencesPage'
import { AdventuringGearPage } from './pages/AdventuringGearPage'
import { AdventuringGearCategoryPage } from './pages/AdventuringGearCategoryPage'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="characters" element={<CharactersPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="character-sheet" element={<CharacterSheetPage />} />
        <Route path="adventuring-gear" element={<AdventuringGearPage />} />
        <Route path="adventuring-gear/:slug" element={<AdventuringGearCategoryPage />} />
        <Route path="parties" element={<PartiesPage />} />
        <Route path="dice" element={<DicePage />} />
        <Route path="dm-suite" element={<DMSuitePage />} />
        <Route path="dm-suite/:slug" element={<DMSuiteTopicPage />} />
        <Route path="dm-cheat-sheets" element={<DMCheatSheetsPage />} />
        <Route path="dm-encounter-tracker" element={<DMEncounterTrackerPage />} />
        <Route path="dm-loot-generator" element={<DMLootGeneratorPage />} />
        <Route path="maps" element={<MapsPage />} />
        <Route path="forum" element={<ForumPage />} />
        <Route path="references" element={<ReferencesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
