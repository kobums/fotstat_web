import { test, expect } from '@playwright/test'
import { mockApi } from './fixtures/mockApi'

test.describe('smoke: guest onboarding', () => {
  test('guest login lands on the empty team list', async ({ page }) => {
    await mockApi(page)

    await page.goto('/login')
    await page.getByRole('button', { name: '게스트로 시작하기' }).click()

    await expect(page).toHaveURL(/\/myteam$/)
    await expect(page.getByText('아직 팀이 없습니다')).toBeVisible()
  })

  test('a guest can create a team and see it in the list', async ({ page }) => {
    await mockApi(page)

    await page.goto('/login')
    await page.getByRole('button', { name: '게스트로 시작하기' }).click()
    await expect(page).toHaveURL(/\/myteam$/)

    await page.getByRole('button', { name: '팀 만들기' }).click()
    await page.getByLabel('팀 이름').fill('FC 서울')
    // exact: avoid matching a "… 추가" toolbar button as a substring.
    await page.getByRole('button', { name: '추가', exact: true }).click()

    // The modal closes on success, then the list refetches and renders the card.
    await expect(page.getByRole('dialog')).toBeHidden()
    // The list card is a <button> (the sidebar entry is a link), so this
    // uniquely targets the team that was just created.
    await expect(page.getByRole('button', { name: /FC 서울/ })).toBeVisible()
  })
})
