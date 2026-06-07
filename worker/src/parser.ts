export interface ParsedTransaction {
  amount: number
  merchant: string
  cardLastFour: string
  date: string // YYYY-MM-DD
}

/**
 * Parses a Google Wallet push notification into transaction fields.
 *
 * Title: "CITY MARKET  6/2/26"  or  "For Luck  11:21"
 * Body:  "₪14.35 with Hever GMC ••1289"
 */
export function parseWalletNotification(
  title: string,
  body: string
): ParsedTransaction | null {
  const bodyMatch = body.match(/[₪﹩]?\s*([\d,]+\.?\d*)\s+with\s+(.+?)\s+[^\d\s]{1,4}(\d{4})/i)
  if (!bodyMatch) return null

  const amount = parseFloat(bodyMatch[1].replace(',', ''))
  const cardLastFour = bodyMatch[3]

  const parts = title.trim().split(/\s{2,}/)
  const merchant = parts[0].trim()
  const dateOrTime = parts[1]?.trim() ?? ''

  let date: string
  const dateMatch = dateOrTime.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
  if (dateMatch) {
    // D/M/YY → YYYY-MM-DD (Israeli convention)
    const [, d, m, y] = dateMatch
    const year = 2000 + parseInt(y)
    date = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  } else {
    // Time shown → today
    const now = new Date()
    date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  if (!merchant || isNaN(amount) || amount <= 0) return null

  return { amount, merchant, cardLastFour, date }
}
