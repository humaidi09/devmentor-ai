# Failure and Edge Cases

| Situation | Required behavior |
|---|---|
| No verified resource | State that no suitable verified resource was found; never invent one; offer broader search or verified human/general contact |
| Resource expired | Mark clearly; do not present as current |
| Campus not listed | Allow limited/demo mode; do not borrow another campus's rules |
| AI unavailable | Graceful fallback to resource directory/manual paths |
| API key missing | Demo/mock mode |
| Internet unavailable | Explain offline state; keep cached/local learning/demo content where available |
| Student refuses clarification | Respect choice; offer broad categories/general next steps |
| Student wants human immediately | Do not force chatbot interrogation |
| Codeforces unavailable | Keep local/manual CP tracking usable |
| Visualization unavailable | Provide text-step explanation |
| Unsupported visualization topic | State that interactive visualization is not available yet; do not fake it |
| Invalid visualization input | Explain error and keep previous valid state |
| Resource source link broken | Downgrade/review state rather than silently showing Verified |
| Reminder permission denied | Keep in-app task without nagging |
| Session expires mid-task | Preserve non-sensitive draft locally when safe; require re-auth before private data access |
