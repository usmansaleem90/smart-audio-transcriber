import { defineStore } from 'pinia'

export const useBlogStore = defineStore('blog', {
  state: () => ({
    outline: null,
    article: null,
    loading: false,
    selectedTranscriptions: [],
    error: null
  }),

  actions: {
    async generateOutline({ prompt, ...metadata }) {
      this.loading = true
      this.error = null
      
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_APP_GPT_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4', // or 'gpt-3.5-turbo' depending on your needs
            messages: [{
              role: 'user',
              content: prompt
            }],
            temperature: 0.7,
            max_tokens: 2000
          })
        })

        if (!response.ok) {
          throw new Error('Failed to generate outline')
        }

        const data = await response.json()
        const outlineJson = JSON.parse(data.choices[0].message.content)
        
        // Update the store with the generated outline
        this.outline = outlineJson
      } catch (error) {
        console.error('Error in generateOutline:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async generateArticle() {
      this.loading = true
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000))
        this.article = "Generated article content..."
      } finally {
        this.loading = false
      }
    }
  }
}) 