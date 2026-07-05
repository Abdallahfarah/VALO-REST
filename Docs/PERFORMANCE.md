Purpose
Defines performance requirements.
Target
Support thousands of restaurants.
Support tens of thousands of concurrent users.
Performance Standards
Dashboard load
<2 seconds
POS interactions
<100 milliseconds perceived response
Order synchronization
Near real-time
Search
Instant for normal datasets
Pagination
Mandatory
Caching
Aggressive where safe
Realtime
Only for active operational data
Historical data
Loaded on demand
Optimization Rules
No unnecessary re-renders.
No duplicate API requests.
Lazy load non-critical modules.
Virtualize long lists.
Optimize database indexes.
Optimize queries.
Compress assets.
Use code splitting.
Minimize bundle size.
Use optimistic updates where appropriate.
Always measure before optimizing.
