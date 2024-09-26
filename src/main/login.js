export async function loginToGoogle(hero, account, logs) {
  logs.push(`Logging in as ${account.EMAIL}`)

  try {
    // Navigate to Google sign-in page
    await hero.goto('https://accounts.google.com/signin', { timeoutMs: 4000 })

    console.log({ 'account at login': account })

    // Wait for and fill in the email input
    await hero.querySelector('input[type="email"]')
    await hero.waitForMillis(6500)
    await hero.type(account.EMAIL)
    await hero.waitForMillis(10000)

    // Click the "Next" button
    await hero.querySelector('#identifierNext').click()

    await hero.waitForMillis(6000)

    // Wait for and fill in the password input
    await hero.querySelector('input[type="password"]')
    await hero.waitForMillis(6000)
    await hero.type(account.PASSWORD)
    console.log({ password: account.PASSWORD })
    await hero.waitForMillis(6500)

    // Click the password "Next" button
    await hero.querySelector('#passwordNext').click()
    await hero.waitForMillis(5000)

    // Wait for navigation to complete
    // await hero.waitForLocation('https://myaccount.google.com/')

    logs.push('Logged in successfully')

    // Handle Recovery Email if prompted
    await handleRecoveryEmail(hero, account, logs)
  } catch (error) {
    logs.push(`Login error: ${error.message}`)
    throw error
  }
}

async function handleRecoveryEmail(hero, account, logs) {
  try {
    // Check if the recovery email prompt is present
    const recoveryEmailPrompt = await hero.xpathSelector(
      '//div[contains(text(), "Confirm your recovery email")]'
    )
    if (recoveryEmailPrompt) {
      logs.push('Recovery Email confirmation screen detected')
      await hero.waitForMillis(5000)

      // Click on the element containing "Confirm your recovery email"
      await recoveryEmailPrompt.click()
      await hero.waitForMillis(6800)

      // Wait for and fill in the recovery email input
      await hero.querySelector('input[type="email"]')
      await hero.waitForMillis(5000)
      await hero.type(account.RECOVERY_EMAIL)
      await hero.waitForMillis(30000)

      // Find the "Next" button by its text content using XPath
      const nextButton = await hero.xpathSelector('//span[text()="Next"]')
      if (nextButton) {
        await nextButton.click()
        await hero.waitForMillis(5000)
      } else {
        logs.push('Warning: Could not find the Next button for recovery email')
      }

      // Wait for navigation after confirming recovery email
      // await hero.waitForLocation('https://myaccount.google.com/');

      logs.push('Recovery email confirmed')
    }
  } catch (error) {
    logs.push(`Recovery email handling error: ${error.message}`)
    // We don't throw here as this is not a critical error
  }
}
