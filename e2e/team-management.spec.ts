import { test, expect } from '@playwright/test'
import { mockApi } from './fixtures/mockApi'

const TEAM = { id: 1, user: 1, name: 'FC 서울' }

test.describe('team management', () => {
  // Seed an authenticated session before the app loads (AuthProvider restores
  // it from localStorage), so these specs can start inside a team.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('fotstat.token', 'e2e-token')
      localStorage.setItem(
        'fotstat.user',
        JSON.stringify({ id: 1, name: '게스트', email: 'guest:1' }),
      )
    })
  })

  test('adds a player to the squad', async ({ page }) => {
    await mockApi(page, { teams: [TEAM] })

    await page.goto('/teams/1/squad')
    await expect(page.getByText('선수가 없습니다')).toBeVisible()

    await page.getByRole('button', { name: '선수 추가' }).click()
    await page.getByLabel('이름').fill('손흥민')
    await page.getByLabel('등번호').fill('7')
    // exact: don't also match the "선수 추가" toolbar button (substring).
    await page.getByRole('button', { name: '추가', exact: true }).click()

    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.getByText('손흥민')).toBeVisible()
  })

  test('adds a match to the schedule', async ({ page }) => {
    await mockApi(page, { teams: [TEAM] })

    await page.goto('/teams/1/matches')
    await expect(page.getByText('경기가 없습니다')).toBeVisible()

    await page.getByRole('button', { name: '경기 추가' }).click()
    await page.getByLabel('상대팀').fill('수원 FC')
    await page.getByRole('button', { name: '추가', exact: true }).click()

    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.getByText('vs 수원 FC')).toBeVisible()
  })
})
