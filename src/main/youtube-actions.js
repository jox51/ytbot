import { updateActionStatus } from './utils'

export async function writeComment(hero, comment, logs) {
  try {
    const placeHolderCommentXPath = '//*[@id="placeholder-area"]'

    await hero.interact({ scroll: [800, 650] })
    await hero.waitForMillis(4500)

    const commentInput = await hero.xpathSelector(placeHolderCommentXPath)

    // await hero.type(comment)
    await hero.waitForMillis(3000)

    if (commentInput) {
      // Click on the comment input to focus it
      await commentInput.click()
      await hero.waitForMillis(3000)
      // Type the comment
      await hero.type(comment)
      await hero.waitForMillis(15000)

      logs.push('Comment typed successfully')

      // Find and click the "Comment" button
      const commentButton = await hero.querySelector('#submit-button')
      console.log('commentButton', commentButton)
      if (commentButton) {
        await commentButton.click()
        console.log('commentButton clicked')
        await hero.waitForMillis(5000)
        // await sortCommentsByNewest(hero, logs)
        logs.push('Comment submitted successfully')
        return true
      } else {
        logs.push('Warning: Could not find the Comment button')
      }
    } else {
      logs.push('Warning: Could not find the comment input field')
    }
  } catch (error) {
    logs.push(`Error writing comment: ${error.message}`)
    throw error
  }
}

export async function sortCommentsByNewest(hero, logs) {
  try {
    // Wait for and click the Sort by button (second occurrence)
    const sortButtonXPath = '(//*[@id="icon-label"])[2]'
    await hero.xpathSelector(sortButtonXPath, { visible: true, timeout: 10000 }).click()
    const sortButton = await hero.xpathSelector(sortButtonXPath)

    if (sortButton) {
      await sortButton.click()
      await hero.waitForMillis(1000) // Wait for the dropdown to appear

      // Find and click the "Newest first" option
      const newestOptionXPath = '//*[@id="item-with-badge"]/div[contains(text(), "Newest first")]'
      const newestOption = await hero.xpathSelector(newestOptionXPath)

      if (newestOption) {
        await newestOption.click()
        logs.push('Comments sorted by newest')
        await hero.waitForMillis(10000)
      } else {
        logs.push('Warning: Could not find the "Newest first" option')
      }
    } else {
      logs.push('Warning: Could not find the Sort by button')
    }
  } catch (error) {
    logs.push(`Error sorting comments: ${error.message}`)
    throw error
  }
}

export async function searchYouTube(hero, keywords, comment, logs, account, number, sendLogs) {
  try {
    const searchUrl = `www.youtube.com/results?search_query=${encodeURIComponent(keywords)}`

    await hero.goto('https://' + searchUrl)
    logs.push(`Searched for: ${keywords}`)
    await hero.waitForMillis(10000)

    let videoIndex = 2
    let commentPosted = false

    while (!commentPosted && videoIndex <= 6) {
      // Try up to 5 videos
      const videoXPath = `(//*[@id="title-wrapper"]/h3)[${videoIndex}]`
      const videoHrefXpath = `(//*[@id="video-title"]/@href)[${videoIndex}]`

      const video = await hero.xpathSelector(videoXPath)
      const videoHref = await hero.xpathSelector(videoHrefXpath).value

      if (video) {
        await hero.waitForMillis(5000)
        await video.click()
        logs.push(`Clicked on video #${videoIndex} in search results`)
        await hero.waitForMillis(9000) // Wait for video page to load

        // Check if comments are turned off
        const commentsOffXPath = '//*[@id="message"]/span'
        const commentsOffElement = await hero.xpathSelector(commentsOffXPath)
        const commentsOff = commentsOffElement ? await commentsOffElement.textContent : null
        const isCommentsOff = commentsOff === 'Comments are turned off.'

        if (isCommentsOff) {
          logs.push(`Comments are turned off for video #${videoIndex}. Trying next video.`)
          await hero.goBack()
          await hero.waitForMillis(5000)
          videoIndex++
          continue
        }

        const commentSuccess = await writeComment(hero, comment, logs)

        logs.push(`Action: ${comment}`)
        if (commentSuccess) {
          const postedUrl = 'youtube.com' + videoHref
          logs.push(`Comment posted to ${postedUrl}`)
          try {
            await updateActionStatus(account, 'Done', postedUrl, number, logs, sendLogs)
            logs.push(`Comment posted to ${postedUrl}`)
            logs.push(`Updated status for ${account} to Done`)
            sendLogs()
            commentPosted = true
          } catch (updateError) {
            logs.push(`Error updating action status: ${updateError.message}`)
            console.error('Error updating action status:', updateError)
          }
        } else {
          logs.push(`Failed to post comment on video #${videoIndex}. Trying next video.`)
          await hero.goBack()
          await hero.waitForMillis(5000)
          videoIndex++
        }
      } else {
        logs.push(`Warning: Could not find video #${videoIndex} in search results`)
        break
      }
    }

    if (!commentPosted) {
      logs.push('Failed to post comment after trying 5 videos')
      try {
        await updateActionStatus(account, 'Failed', '', number)
        logs.push(`Updated status for ${account} to Failed`)
      } catch (updateError) {
        logs.push(`Error updating action status: ${updateError.message}`)
        console.error('Error updating action status:', updateError)
      }
    }
  } catch (error) {
    logs.push(`Error searching YouTube: ${error.message}`)
    throw error
  }
}

// You can add more YouTube-related functions here in the future
