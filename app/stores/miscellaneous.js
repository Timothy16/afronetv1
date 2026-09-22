// stores/miscellaneous.js
import { defineStore } from 'pinia'


export const useMiscellaneous = defineStore('miscellaneous', {
  state: () => ({
    countries: [],
    currencies : []
  }),

  actions: {
    async getCountries() {
      // Countries rarely change: fetch once per app load
      if (this.countries.length) return
      try {
        const response = await $fetch('/api/get-country', {
            method: 'GET',
        })
        
        this.countries = (response?.data || []).sort((a, b) => a.name.localeCompare(b.name))
       
      } catch (error) {
        console.error('Error fetching countries:', error)
        
      } finally {
        
      }
    },
    async getCurrencies() {
      try {
        const response = await $fetch('/api/get-currencies', {
            method: 'GET',
        })
        
       
        this.currencies = response.data.sort((a, b) => a.name.localeCompare(b.name))
        
      } catch (error) {
        console.error('Error fetching currencies:', error)
        
      } finally {
        
      }
  },
  }
})
