# Gritio device test plan

Record: device, OS version, build, date, tester.
Start each run with Settings > Development > Erase everything.

## 1. First launch and onboarding

- [ ] Splash writes "Gritio", then onboarding appears
- [ ] Skipping the name works, and greetings have no name
- [ ] Skipping focus areas and the routine step works
- [ ] "Maybe later" on notifications works, and the app is fully usable
- [ ] Denying the notification prompt shows the calm note, and the app is fully usable
- [ ] Close and reopen: onboarding does not return

## 2. Goals

- [ ] Create a goal from a template, then from scratch (title only)
- [ ] Add, edit, reorder, complete and delete steps and milestones
- [ ] Progress text matches the steps ("4 of 9 steps")
- [ ] Schedule a step onto today, complete it from Today, goal progress updates
- [ ] "Mark this goal complete?" appears once when the last item is done
- [ ] Archive, restore, complete, reopen, delete (delete names what it removes)
- [ ] Limit: 10 active goals enforced, message and way forward are clear, archived and completed do not count

## 3. Habits

- [ ] Create a habit in one tap (name only), then one with minimum and target versions
- [ ] Complete from Today, the Habits tab and the habit page: all agree
- [ ] Minimum version asks "What did you do?"
- [ ] History calendar: add, change and remove a past day, future days are locked
- [ ] Missing days shows the supportive "Welcome back", never red or a lost streak
- [ ] Archive, restore, delete (shows the completion count)
- [ ] Limit: 10 active habits enforced

## 4. Today and tasks

- [ ] Empty day shows the friendly empty state, no fake items
- [ ] Add, edit, complete, postpone and delete a task
- [ ] Swipe right completes, swipe left moves, tap opens details
- [ ] Review plan moves unfinished tasks, nothing is auto completed

## 5. Notifications (repeat on a development build)

- [ ] Turn on a task reminder 2 minutes ahead: it arrives
- [ ] Complete the task first: no reminder arrives
- [ ] Habit reminder arrives, completing today's habit cancels only today's
- [ ] Daily planning and evening reflection arrive and open the right screen
- [ ] Denied permission: Reminders screen explains it, Open settings works, the app keeps working
- [ ] Revoke permission in phone settings, return: reminders clear, no crash
- [ ] Restart the app: reminders are still correct, no duplicates (developer tools counts match)
- [ ] Notification center lists reminders that went off, tap opens the right place

## 6. Celebrations

- [ ] All today's items done (2 or more): celebration once, not again after undo and redo
- [ ] Finish a milestone, complete a goal, reach a streak milestone, complete a weekly review
- [ ] Turn Celebrations off: nothing appears
- [ ] Reduce motion on: no confetti

## 7. Progress, reflections and rules

- [ ] Empty state before any data, numbers match what you did after
- [ ] Week and month views, earlier periods, tap a bar
- [ ] Weekly review: complete, edit, skip (skipping saves nothing)
- [ ] Reflection: write, leave without saving (it is kept), clear everything (entry removed)
- [ ] Personal rules: add, edit, reorder, delete, "Rule for today" appears on Today

## 8. Backup

- [ ] Create a backup, save it somewhere, change data, restore: data matches the backup
- [ ] A text file, a file with the version changed to 99, and a file with a goal removed are all refused, and nothing changes
- [ ] After restore, reminders match (developer tools) and no celebration appears

## 9. App Lock (repeat on a development build)

- [ ] Turn on: confirmation prompt, then locks on cold start
- [ ] Short trip to the background does not lock, over a minute does
- [ ] Share sheet and file picker do not lock you out
- [ ] Cancel the prompt: gentle message and Unlock button

## 10. Offline

- [ ] Airplane mode: repeat sections 2, 3, 4, 7 and 8 quickly, everything works

## 11. Dates and time

- [ ] Move the phone date forward a day: Today shows the new day, earlier tasks appear as unfinished, habits and reminders follow
- [ ] Change time zone: no duplicate habit days, reminders stay sensible
- [ ] Leave the app open across midnight: Today updates when you return

## 12. Accessibility (repeat on a development build)

- [ ] Largest text size: no clipped labels, sheets scroll
- [ ] TalkBack or VoiceOver: complete a task, schedule a step, change a time, close a sheet
- [ ] Swipe row actions are available in the actions menu
- [ ] Reduce motion on: count-ups and sheets are instant

## 13. Dark mode and small screens

- [ ] Walk every screen in dark mode
- [ ] Small phone or largest display size: forms with the keyboard open stay usable

## Result

Pass / fail per section, plus anything odd, with a screenshot if you can.
