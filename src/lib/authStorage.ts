const LAST_AUTH_METHOD_KEY = 'lastAuthMethod'

export type AuthMethod = 'google' | 'email'

export const authStorage = {
  /**
   * Save the last authentication method used
   */
  saveLastAuthMethod(method: AuthMethod): void {
    try {
      localStorage.setItem(LAST_AUTH_METHOD_KEY, method)
    } catch (error) {
      console.error('Failed to save last auth method:', error)
    }
  },

  /**
   * Get the last authentication method used
   */
  getLastAuthMethod(): AuthMethod | null {
    try {
      const method = localStorage.getItem(LAST_AUTH_METHOD_KEY)
      if (method === 'google' || method === 'email') {
        return method
      }
      return null
    } catch (error) {
      console.error('Failed to get last auth method:', error)
      return null
    }
  },

  /**
   * Clear the last authentication method
   */
  clearLastAuthMethod(): void {
    try {
      localStorage.removeItem(LAST_AUTH_METHOD_KEY)
    } catch (error) {
      console.error('Failed to clear last auth method:', error)
    }
  }
}
