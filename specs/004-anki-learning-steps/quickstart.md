# Quickstart: Testing Learning Steps

## Scenario 1: Again → Learning Steps

1. Start a review session for a deck with due cards
2. Click "Again" on a card
3. Verify the card's interval hint showed "1m" before clicking
4. Verify the card reappears after ~1 minute in the same session
5. Click "Good" → verify hint shows "10m", card scheduled for 10 min
6. Click "Good" again → card graduates to review phase (1 day interval)

## Scenario 2: Easy Skips Learning

1. Start a review on a learning-phase card
2. Click "Easy" → card should skip remaining steps
3. Verify card is scheduled for 4 days (easy graduating interval)

## Scenario 3: Interval Hints Display

1. Reveal a card in review phase
2. Verify all 4 buttons show interval hints:
   - Again: "1m" (or "10m" for relearning)
   - Hard: calculated based on current interval
   - Good: calculated based on current interval × ease factor
   - Easy: Good interval × 1.3
