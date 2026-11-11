# LeakFinder
LeakFinder – Subscription Spend Tracker is a project in FinTech, modeled after Rocket Money, to help users stop losing money on forgotten OTT, app, and gym subscriptions.

# LeakFinder — Subscription Spend Tracker

A responsive Personal Finance web application built for the 1-Month Core OJT (**Frontend Development Basics**). Inspired by Rocket Money (Truebill), **LeakFinder** helps students managing pocket money, young salaried professionals, and families sharing OTT plans identify ₹500–₹2,000/month in forgotten or underused subscriptions.

## Tech Stack
- **Frontend:** HTML5, CSS3 (Custom Grid/Flexbox), Bootstrap 5.3
- **Logic & Persistence:** Vanilla JavaScript (ES6+), `localStorage` with `sample-data.json` fallback seed
- **Deployment:** GitHub Pages / Vercel ready

## Project Structure
```text
leakfinder-ojt/
├── index.html          # Main responsive Bootstrap 5 dashboard & form modal
├── css/
│   └── styles.css      # Custom Flexbox/Grid tweaks & mobile viewport polish
├── js/
│   ├── data.js         # Default sample data & localStorage initialization
│   └── app.js          # DOM rendering, form validation, role checks & CRUD logic
├── sample-data.json    # Backup JSON seed file for demo resets
└── README.md           # Project overview, setup steps & demo checklist
