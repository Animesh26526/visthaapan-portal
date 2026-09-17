# VISTHAAPAN Portal - Frontend

This is the frontend foundation for the VISTHAAPAN Portal, designed for the Smart India Hackathon.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

## Folder Structure

- `/src/types` - TypeScript interfaces representing our Data Contracts (`Habitation`, `RelocationSite`, etc.). **(Person 2)**
- `/src/mock` - Hardcoded realistic JSON data used when `VITE_USE_MOCK_API` is active. **(Person 2)**
- `/src/services` - Domain-based API layer. Separated by feature (e.g., `habitations.service.ts`). **(Person 2)**
- `/src/stores` - Global client state using Zustand (e.g., selected habitation, active scenario). **(Person 2)**
- `/src/utils` - Pure calculation functions (e.g., capacity deficit math). **(Person 2)**
- `/src/components` & `/src/pages` - UI components and page layouts. **(Person 1)**

## How Mock Services Work & Future Transition

To allow parallel development, we are currently using an **Adapter Pattern** with mock data. 

In `src/services/config.ts`, there is an environment toggle:
```typescript
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';
```

When you call a service (e.g., `HabitationsService.getHabitations()`), it checks this boolean:
- **If TRUE:** It returns data from `src/mock/data.ts` with a simulated 500ms network delay.
- **If FALSE:** It executes a real `fetch()` call to the backend APIs.

**How we switch to the real backend:**
When the backend/AI team finishes the Appwrite/REST endpoints, we simply set `VITE_USE_MOCK_API=false` in our `.env` file and update the `fetch` URLs in the service files. **No React components will need to be rewritten.**

## How Person 1 Uses the Data

Person 1 (UI/UX) should use `React Query` hooks inside components to fetch data, rather than calling the services directly. 

**Example usage in a UI Component:**

```tsx
import { useQuery } from '@tanstack/react-query';
import { HabitationsService } from '../services/habitations.service';
import { useAppStore } from '../stores/useAppStore';

export const HabitationList = () => {
  // 1. Fetch data seamlessly (works for both mock and real backend!)
  const { data: habitations, isLoading } = useQuery({
    queryKey: ['habitations'],
    queryFn: HabitationsService.getHabitations
  });
  
  // 2. Access global state
  const setSelectedHabitation = useAppStore(state => state.setSelectedHabitation);

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {habitations?.map(hab => (
        <li key={hab.id} onClick={() => setSelectedHabitation(hab.id)}>
          {hab.name} - Risk: {hab.riskScore}
        </li>
      ))}
    </ul>
  );
};
```
