---
name: frontend-skill
description: Build responsive pages, reusable components, layouts, and styling for modern web applications.
---

# Frontend Skill – UI, Components & Styling

## Instructions

1. **Pages & Routing**
   - Build application pages using Next.js App Router
   - Structure layouts, nested routes, and templates
   - Implement loading states and error boundaries
   - Ensure SEO-friendly metadata and structure

2. **Components**
   - Create reusable, modular React components
   - Separate presentational and logic components
   - Implement form components and UI controls
   - Follow consistent component naming and structure

3. **Layout & Responsiveness**
   - Design responsive layouts using Flexbox and Grid
   - Support mobile, tablet, and desktop breakpoints
   - Implement navigation, headers, footers, and sidebars
   - Ensure accessibility (ARIA, keyboard navigation)

4. **Styling**
   - Apply modern styling using Tailwind CSS or CSS Modules
   - Maintain consistent design system and spacing
   - Implement dark/light themes if required
   - Optimize for performance and minimal CSS bloat

## Best Practices
- Mobile-first design
- Reuse components, avoid duplication
- Keep UI state predictable
- Optimize images and fonts
- Follow accessibility standards (WCAG)

## Example Structure
```tsx
export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-bold">Welcome</h1>
    </main>
  );
}
