# Information Architecture

## Primary navigation principle
Student Support is always the clearest and easiest primary route. Optional learning modules must not visually overpower it.

```text
Close AI
├── Landing
├── Onboarding
├── Dashboard
├── Student Support
│   ├── Support Chat
│   ├── Resource Directory
│   ├── Resource Detail
│   ├── Saved Resources
│   ├── My Next Steps
│   └── Human Support
├── Academic Study
│   ├── Courses
│   ├── Deadlines
│   └── Study Plan
├── Developer Path
│   ├── Learning Pathways
│   ├── Skills
│   ├── Projects
│   ├── Snippets
│   └── Visual Learning Lab
│       ├── DSA
│       ├── Algorithms
│       └── Database / DBMS
├── CP Coach
│   ├── Practice
│   ├── Recommendations
│   ├── Attempts
│   ├── Upsolving
│   └── Preferences
└── Settings
    ├── Profile
    ├── Modules
    ├── Language
    ├── Notifications
    ├── Privacy
    ├── Consent
    └── Data Controls
```

## Mobile navigation
Recommended primary bottom navigation:
- Home
- Support
- Learn
- CP
- Settings

`Learn` opens Academic Study / Developer Path / Visual Learning Lab based on enabled modules. Support must remain one tap away.

## Desktop navigation
A compact left sidebar:
- Home
- Student Support
- Academic Study (if enabled)
- Developer Path (if enabled)
- CP Coach (if enabled)
- Settings

Resource Directory and My Next Steps remain sub-navigation inside Student Support.

## Permission boundary
Maintainer/resource-review screens belong to a separate protected route group and must not appear in normal student navigation.
