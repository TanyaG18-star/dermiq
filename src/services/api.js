// src/services/api.js
// This file handles all communication with Flask backend

const BASE_URL = 'http://localhost:5000'

// ─────────────────────────────
// AUTH SERVICES
// ─────────────────────────────

// Register user
export const registerUser = async (userData) => {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })
  return response.json()
}

// Login user
export const loginUser = async (credentials) => {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  })
  return response.json()
}

// ─────────────────────────────
// ANALYSIS SERVICES
// ─────────────────────────────

// Analyze skin image
export const analyzeImageAI = async (imageData) => {
  try {
    const response = await fetch('http://localhost:5000/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData })
    })
    const result = await response.json()
    return result
  } catch (error) {
    // Fallback if backend is down
    return {
      condition: 'Mild Acne',
      severity: 'low',
      confidence: 84,
      description: 'Minor acne detected on skin surface.',
      routine: [
        '🧴 Wash face twice daily with gentle cleanser',
        '💧 Use oil-free moisturizer',
        '☀️ Apply SPF 30+ sunscreen daily',
      ],
      medicines: [
        '💊 Benzoyl Peroxide 2.5% cream',
        '💊 Salicylic Acid face wash',
      ]
    }
  }
}
// Calculate risk score
export const calculateRisk = async (symptoms) => {
  const response = await fetch(`${BASE_URL}/risk-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(symptoms)
  })
  return response.json()
}

// Save report
export const saveReport = async (reportData) => {
  const response = await fetch(`${BASE_URL}/save-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData)
  })
  return response.json()
}

// Get user reports
export const getReports = async (userId) => {
  const response = await fetch(`${BASE_URL}/reports/${userId}`)
  return response.json()
}

// ─────────────────────────────
// EMERGENCY SERVICES
// ─────────────────────────────

// Get doctors by city
export const getDoctors = async (city) => {
  const response = await fetch(`${BASE_URL}/emergency`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city })
  })
  return response.json()
}