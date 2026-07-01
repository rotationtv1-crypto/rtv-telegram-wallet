---
name: heygen-ecosystem
display_name: RTV HeyGen Ecosystem Master Mode
description: |
  Full HeyGen video layer for the RotationTV Network ecosystem.
  Routes video creation across all 6 RTV companies (RotationTVNetwork, RotationTVAI,
  RotationPay, EmergentLabs, Bigo Agency, White Industries).
  Handles avatar/video workflows, webhook callbacks to Base44, and 
  company-specific positioning and templates.
  Use when: generating branded videos for any RTV company, sending video updates
  to Slack/Discord/Telegram, creating avatar intro videos, RotationPay reports.
version: 1.0.0
allowed-tools: Bash, Read, Write
metadata:
  requires:
    env:
      - HEYGEN_API_KEY
  primaryEnv: HEYGEN_API_KEY
---
