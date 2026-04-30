import type { ReactElement } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'

import { BaseColorsPage } from '@/pages/BaseColorsPage'
import { CollectionsPage } from '@/pages/CollectionsPage'
import { DictionariesPage } from '@/pages/DictionariesPage'
import { PalettesPage } from '@/pages/PalettesPage'

import { DEFAULT_DICTIONARY_KEY, workbenchPaths } from './navigation'
import { AdminShell } from './components/AdminShell'

// 管理台顶层页面，负责声明工作台内部的真实路由和默认跳转规则。
export function AdminWorkbench(): ReactElement {
  return (
    <AdminShell>
      <Routes>
        <Route element={<Navigate replace to={workbenchPaths.baseColors} />} path="/" />
        <Route element={<BaseColorsPage />} path={workbenchPaths.baseColors} />
        <Route element={<PalettesPage />} path={workbenchPaths.palettes} />
        <Route element={<CollectionsPage />} path={workbenchPaths.collections} />
        <Route element={<Navigate replace to={workbenchPaths.dictionaries()} />} path="/dictionaries" />
        <Route element={<DictionariesRoute />} path="/dictionaries/:dictionaryKey" />
        <Route element={<Navigate replace to={workbenchPaths.baseColors} />} path="*" />
      </Routes>
    </AdminShell>
  )
}

// 字典路由入口，负责把 URL 参数映射成当前字典页上下文，并在切换字典时同步地址栏。
function DictionariesRoute(): ReactElement {
  const navigate = useNavigate()
  const { dictionaryKey } = useParams<{ dictionaryKey: string }>()

  return (
    <DictionariesPage
      activeDictionaryKey={dictionaryKey ?? DEFAULT_DICTIONARY_KEY}
      onActiveDictionaryKeyChange={(nextDictionaryKey) => {
        navigate(workbenchPaths.dictionaries(nextDictionaryKey))
      }}
    />
  )
}