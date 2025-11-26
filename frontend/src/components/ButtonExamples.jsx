import React, { useState } from 'react';
import Button from './Button';
import './Button.css';

/**
 * Button Examples Component
 * 
 * This component demonstrates all button variants, sizes, and states.
 * Use this as a reference for implementing buttons across your application.
 */
const ButtonExamples = () => {
  const [loading, setLoading] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '40px', fontSize: '32px', fontWeight: 'bold' }}>
        Button System Examples
      </h1>

      {/* Variants Section */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
          Button Variants
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="tertiary">Tertiary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      {/* Sizes Section */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
          Button Sizes
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
          <Button variant="primary" size="small">Small</Button>
          <Button variant="primary" size="medium">Medium</Button>
          <Button variant="primary" size="large">Large</Button>
        </div>
      </section>

      {/* Icons Section */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
          Buttons with Icons
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <Button 
            variant="primary" 
            leftIcon={<span>➕</span>}
          >
            Add Item
          </Button>
          <Button 
            variant="secondary" 
            rightIcon={<span>→</span>}
          >
            Continue
          </Button>
          <Button 
            variant="outline" 
            leftIcon={<span>🔍</span>}
            rightIcon={<span>→</span>}
          >
            Search
          </Button>
        </div>
      </section>

      {/* States Section */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
          Button States
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <Button variant="primary">Normal</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="primary" loading={loading} onClick={handleLoadingDemo}>
            {loading ? 'Loading...' : 'Click to Load'}
          </Button>
        </div>
      </section>

      {/* Full Width Section */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
          Full Width Buttons
        </h2>
        <div style={{ marginBottom: '24px', maxWidth: '500px' }}>
          <Button variant="primary" fullWidth style={{ marginBottom: '12px' }}>
            Full Width Primary
          </Button>
          <Button variant="outline" fullWidth>
            Full Width Outline
          </Button>
        </div>
      </section>

      {/* Real-World Examples */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
          Real-World Examples
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <Button variant="primary" size="large" leftIcon={<span>🛒</span>}>
            Add to Cart
          </Button>
          <Button variant="outline" leftIcon={<span>💾</span>}>
            Save Draft
          </Button>
          <Button variant="ghost" rightIcon={<span>✕</span>}>
            Cancel
          </Button>
          <Button variant="destructive" leftIcon={<span>🗑️</span>}>
            Delete
          </Button>
          <Button variant="link">
            Learn More →
          </Button>
        </div>
      </section>

      {/* Usage Code Examples */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
          Usage Examples
        </h2>
        <div style={{ background: '#f5f5f5', padding: '24px', borderRadius: '12px', fontFamily: 'monospace', fontSize: '14px' }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`// Basic usage
<Button variant="primary">Click Me</Button>

// With icon
<Button variant="primary" leftIcon={<Icon />}>
  Add Item
</Button>

// Loading state
<Button variant="primary" loading={isLoading}>
  Submit
</Button>

// Full width
<Button variant="primary" fullWidth>
  Submit Form
</Button>

// All variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="tertiary">Tertiary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button variant="destructive">Delete</Button>

// All sizes
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>
<Button size="large">Large</Button>`}
          </pre>
        </div>
      </section>
    </div>
  );
};

export default ButtonExamples;

