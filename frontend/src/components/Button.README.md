# Button System - Complete Design Guide

A comprehensive, modern, and professional button system for the entire website.

## Features

✅ **7 Variants**: Primary, Secondary, Tertiary, Outline, Ghost, Link, Destructive  
✅ **3 Sizes**: Small, Medium, Large  
✅ **Icon Support**: Left and right icon positioning  
✅ **Loading States**: Built-in spinner animation  
✅ **Full Width**: Responsive full-width option  
✅ **Dark Mode**: Automatic dark mode support  
✅ **Accessibility**: WCAG compliant with focus states  
✅ **Responsive**: Mobile, tablet, laptop, desktop optimized  
✅ **Smooth Animations**: Professional transitions and hover effects  

## Installation

The Button component is already available in your project:

```jsx
import Button from './components/Button';
```

## Basic Usage

```jsx
import Button from './components/Button';

// Primary button (default)
<Button>Click Me</Button>

// With variant
<Button variant="secondary">Secondary</Button>

// With size
<Button size="large">Large Button</Button>

// With icons
<Button leftIcon={<Icon />}>With Icon</Button>
<Button rightIcon={<Icon />}>With Icon</Button>

// Loading state
<Button loading>Processing...</Button>

// Full width
<Button fullWidth>Full Width</Button>

// Disabled
<Button disabled>Disabled</Button>
```

## Variants

### Primary
The main call-to-action button with gradient background.

```jsx
<Button variant="primary">Primary Button</Button>
```

### Secondary
A softer alternative with light gradient.

```jsx
<Button variant="secondary">Secondary Button</Button>
```

### Tertiary
A white button with border, perfect for secondary actions.

```jsx
<Button variant="tertiary">Tertiary Button</Button>
```

### Outline
Transparent background with colored border.

```jsx
<Button variant="outline">Outline Button</Button>
```

### Ghost
Minimal button with transparent background, shows background on hover.

```jsx
<Button variant="ghost">Ghost Button</Button>
```

### Link
Text-only button styled as a link.

```jsx
<Button variant="link">Link Button</Button>
```

### Destructive
For dangerous actions like delete, with red gradient.

```jsx
<Button variant="destructive">Delete</Button>
```

## Sizes

### Small
```jsx
<Button size="small">Small Button</Button>
```

### Medium (Default)
```jsx
<Button size="medium">Medium Button</Button>
```

### Large
```jsx
<Button size="large">Large Button</Button>
```

## Icons

### Left Icon
```jsx
<Button leftIcon={<PlusIcon />}>Add Item</Button>
```

### Right Icon
```jsx
<Button rightIcon={<ArrowRightIcon />}>Continue</Button>
```

### Both Icons
```jsx
<Button 
  leftIcon={<DownloadIcon />} 
  rightIcon={<CheckIcon />}
>
  Download
</Button>
```

## Loading State

The button automatically shows a spinner when loading:

```jsx
<Button loading>Processing...</Button>
```

Icons are hidden when loading, and the button is disabled.

## Full Width

Make buttons span the full width of their container:

```jsx
<Button fullWidth>Full Width Button</Button>
```

## Disabled State

```jsx
<Button disabled>Disabled Button</Button>
```

## Complete Examples

### Form Submit Button
```jsx
<Button 
  type="submit" 
  variant="primary" 
  size="large" 
  fullWidth
  loading={isSubmitting}
>
  Submit Form
</Button>
```

### Delete Action
```jsx
<Button 
  variant="destructive" 
  leftIcon={<TrashIcon />}
  onClick={handleDelete}
>
  Delete Item
</Button>
```

### Navigation Button
```jsx
<Button 
  variant="ghost" 
  rightIcon={<ArrowRightIcon />}
  onClick={handleNext}
>
  Next Step
</Button>
```

### Icon-Only Button
```jsx
<Button 
  variant="ghost" 
  size="small"
  leftIcon={<SettingsIcon />}
  aria-label="Settings"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `string` | `'primary'` | Button variant: `'primary'`, `'secondary'`, `'tertiary'`, `'outline'`, `'ghost'`, `'link'`, `'destructive'` |
| `size` | `string` | `'medium'` | Button size: `'small'`, `'medium'`, `'large'` |
| `fullWidth` | `boolean` | `false` | Make button full width |
| `loading` | `boolean` | `false` | Show loading spinner |
| `disabled` | `boolean` | `false` | Disable button |
| `leftIcon` | `ReactNode` | `undefined` | Icon to display on the left |
| `rightIcon` | `ReactNode` | `undefined` | Icon to display on the right |
| `type` | `string` | `'button'` | Button type: `'button'`, `'submit'`, `'reset'` |
| `onClick` | `function` | `undefined` | Click handler |
| `className` | `string` | `''` | Additional CSS classes |
| `style` | `object` | `undefined` | Inline styles |
| `children` | `ReactNode` | `undefined` | Button content |

## Styling

The button system uses CSS custom properties for easy theming. All buttons automatically adapt to:

- **Light Mode**: Default styling
- **Dark Mode**: Automatic via `prefers-color-scheme: dark`
- **High Contrast**: Enhanced borders for accessibility
- **Reduced Motion**: Animations disabled for users who prefer it

## CSS Classes

You can also use the button classes directly in your HTML/CSS:

```html
<button class="btn btn-primary btn-medium">Button</button>
<button class="btn btn-secondary btn-large btn-full-width">Button</button>
```

### Available Classes

- Base: `.btn`
- Variants: `.btn-primary`, `.btn-secondary`, `.btn-tertiary`, `.btn-outline`, `.btn-ghost`, `.btn-link`, `.btn-destructive`
- Sizes: `.btn-small`, `.btn-medium`, `.btn-large`
- States: `.btn-loading`, `.btn-disabled`, `.btn-full-width`
- Icons: `.btn-icon`, `.btn-icon-left`, `.btn-icon-right`

## Accessibility

- ✅ Keyboard navigation support
- ✅ Focus-visible states with proper outlines
- ✅ ARIA labels support
- ✅ Screen reader friendly
- ✅ High contrast mode support
- ✅ Reduced motion support

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Best Practices

1. **Use Primary for main actions**: Save, Submit, Continue
2. **Use Secondary for alternative actions**: Cancel, Back
3. **Use Destructive for dangerous actions**: Delete, Remove
4. **Use Ghost for subtle actions**: Settings, More options
5. **Use Link for navigation**: Learn more, Read article
6. **Always provide loading states** for async actions
7. **Use appropriate sizes**: Large for CTAs, Small for compact spaces
8. **Include icons** when they add clarity
9. **Use fullWidth** for mobile-first forms

## Migration Guide

To migrate existing buttons to the new system:

### Before
```jsx
<button className="primary-button">Click Me</button>
```

### After
```jsx
<Button variant="primary">Click Me</Button>
```

Or using classes:
```jsx
<button className="btn btn-primary">Click Me</button>
```

## Examples Component

See `ButtonExamples.jsx` for a complete showcase of all button variants and states.
