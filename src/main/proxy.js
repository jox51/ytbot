export function setupProxy(account) {
  if (account['PROXY IP'] && account['PROXY PORT']) {
    let proxyUrl = `http://${account['PROXY IP']}:${account['PROXY PORT']}`

    // Add authentication if provided
    if (account['PROXY USERNAME'] && account['PROXY PASSWORD']) {
      proxyUrl = `http://${encodeURIComponent(account['PROXY USERNAME'])}:${encodeURIComponent(account['PROXY PASSWORD'])}@${account['PROXY IP']}:${account['PROXY PORT']}`
    }

    return proxyUrl
  }

  return null // Return null if no proxy is set
}
