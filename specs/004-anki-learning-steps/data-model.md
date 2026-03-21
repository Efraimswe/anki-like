# Data Model: Learning Steps

## CardState (modified)

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| cardId | UUID | — | PK, FK to Card |
| phase | String | "new" | "new", "learning", "review", "relearning" |
| interval | Int | 0 | **Now in minutes** (was days). 1440 = 1 day |
| easeFactor | Float | 2.5 | Minimum 1.3 |
| repetitions | Int | 0 | Consecutive correct reviews |
| learningStep | Int | 0 | **NEW**. Current index in learning steps array |
| dueDate | DateTime | now() | Next review due date/time |
| updatedAt | DateTime | now() | Last modification |

## Migration Required

- Add `learning_step` column (Int, default 0) to `card_states` table
- Multiply all existing `interval` values by 1440 (days → minutes)
- Update SM-2 service to work in minutes throughout

## State Transitions

```
New → (first review) → Learning (step 0)
Learning (step N) + Good → Learning (step N+1) if more steps
Learning (final step) + Good → Review (graduated)
Learning (any step) + Easy → Review (graduated with bonus)
Learning (any step) + Again → Learning (step 0, reset)
Review + Again → Relearning (step 0)
Review + Hard/Good/Easy → Review (new interval)
Relearning (step N) + Good → Relearning (step N+1) if more steps
Relearning (final step) + Good → Review (graduated)
Relearning (any step) + Again → Relearning (step 0)
```

## Learning Steps Config

| Setting | Default | Unit |
|---------|---------|------|
| newSteps | [1, 10] | minutes |
| relearningSteps | [10] | minutes |
| graduatingInterval | 1440 | minutes (1 day) |
| easyGraduatingInterval | 5760 | minutes (4 days) |
