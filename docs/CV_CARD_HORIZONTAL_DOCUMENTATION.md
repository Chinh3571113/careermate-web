# CV Card Horizontal Component

## 📋 Overview
Component thẻ CV dạng ngang (horizontal layout) được thiết kế theo CareerMate design system, hiển thị thông tin CV một cách ngắn gọn và dễ quét.

## 🎨 Design Specifications

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│  ┌────┐  ┌───────────────────────────────────────────┐ │
│  │    │  │ [Uploaded] [Private]                      │ │
│  │ 📄 │  │ CV_John_Doe_2025.pdf  [Default]          │ │
│  │    │  │ Nov 8, 2025 • 1.2 MB  [Set Default] [Sync] ⋮│ │
│  └────┘  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Dimensions
- **Card height**: 140-160px (desktop)
- **Thumbnail**: 96px × 96px (desktop), full width on mobile
- **Border radius**: `rounded-xl` (12px)
- **Padding**: `p-4` (16px)
- **Gap**: `gap-4` (16px) between thumbnail and content

### Colors
- **Background**: `#ffffff` (white)
- **Border**: `border-gray-200` (default), `border-[#3a4660]` (hover/default)
- **Ring**: `ring-2 ring-[#3a4660]` (when default)
- **Shadow**: `shadow-sm` (default), `shadow-md` (hover)
- **Primary color**: `#3a4660`

### Badges
- **Uploaded**: `bg-blue-100 text-blue-700`
- **Builder**: `bg-purple-100 text-purple-700`
- **Draft**: `bg-orange-100 text-orange-700`
- **Private/Public**: `bg-gray-100 text-gray-700`
- **Default**: `bg-[#3a4660] text-white`

## 🔧 Props Interface

```typescript
interface CVCardHorizontalProps {
  cv: CV;                      // Required: CV data object
  isDefault?: boolean;         // Optional: Highlight as default CV
  onSetDefault?: () => void;   // Optional: Set as default callback
  onPreview?: () => void;      // Optional: Preview CV callback
  onSync?: () => void;         // Optional: Sync to profile callback
  onDelete?: () => void;       // Optional: Delete CV callback
}
```

## 📦 CV Data Interface

```typescript
interface CV {
  id: string;
  name: string;
  source: "upload" | "builder" | "draft";
  fileUrl: string;
  parsedStatus: "processing" | "ready" | "failed";
  isDefault: boolean;
  privacy: "private" | "public";
  updatedAt: string;  // ISO date string
  fileSize?: string;  // e.g., "1.2 MB"
}
```

## 🚀 Usage Examples

### Basic Usage
```tsx
import { CVCardHorizontal } from "@/components/cv-management";

<CVCardHorizontal
  cv={cvData}
  isDefault={false}
  onPreview={() => handlePreview(cvData)}
  onSync={() => handleSync(cvData)}
  onDelete={() => handleDelete(cvData.id)}
/>
```

### Default CV in Gradient Container
```tsx
{defaultCV && (
  <div className="bg-gradient-to-r from-[#3a4660] to-gray-400 rounded-xl p-6 shadow-md">
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-white mb-1">
        Default CV
      </h2>
      <p className="text-sm text-white/90">
        This CV will be used automatically when applying for jobs
      </p>
    </div>

    <CVCardHorizontal
      cv={defaultCV}
      isDefault
      onPreview={() => handlePreview(defaultCV)}
      onSync={() => handleSync(defaultCV)}
    />
  </div>
)}
```

### In CV List
```tsx
<div className="space-y-4">
  {cvList.map((cv) => (
    <CVCardHorizontal
      key={cv.id}
      cv={cv}
      isDefault={cv.isDefault}
      onSetDefault={() => handleSetDefault(cv)}
      onPreview={() => handlePreview(cv)}
      onSync={() => handleSync(cv)}
      onDelete={() => handleDelete(cv.id)}
    />
  ))}
</div>
```

## 🎯 Features

### Visual Features
- ✅ **Responsive Design**: Stack vertically on mobile, horizontal on desktop
- ✅ **Hover Effects**: Border color change + shadow elevation
- ✅ **Default Highlight**: Ring border when `isDefault={true}`
- ✅ **Processing State**: Animated spinner when CV is processing
- ✅ **Badge System**: Source, privacy, and default status badges
- ✅ **Icon Placeholder**: SVG document icon with hover effect

### Interactive Features
- ✅ **Click to Preview**: Click thumbnail or title to preview CV
- ✅ **Set Default**: Button to set CV as default (hidden for default CV)
- ✅ **Sync to Profile**: Sync CV data to user profile
- ✅ **Dropdown Menu**: Preview, Download, Rename, Delete actions
- ✅ **Disabled State**: Sync button disabled when CV is processing

### Accessibility
- ✅ **Hover States**: Clear visual feedback on interactive elements
- ✅ **Focus States**: Keyboard navigation support
- ✅ **Title Tooltips**: Full filename on hover (truncated text)
- ✅ **Disabled Tooltips**: Explanatory message for disabled sync

## 📱 Responsive Behavior

### Desktop (≥640px)
- Horizontal layout: `flex-row`
- Thumbnail: 96px fixed width
- Card height: 140px
- All actions visible

### Mobile (<640px)
- Vertical layout: `flex-col`
- Thumbnail: Full width, 96px height
- Card height: Auto
- Actions may wrap to new line

## 🎨 Styling Classes

### Container
```tsx
className={`
  w-full rounded-xl overflow-hidden bg-white 
  transition-all duration-300
  border shadow-sm hover:shadow-md hover:border-[#3a4660]
  ${isDefault ? "ring-2 ring-[#3a4660] border-[#3a4660]" : "border-gray-200"}
`}
```

### Thumbnail
```tsx
className="
  flex-shrink-0 w-full sm:w-24 h-24 sm:h-full 
  bg-gradient-to-br from-gray-50 to-gray-100 
  rounded-lg flex items-center justify-center 
  cursor-pointer group 
  hover:from-gray-100 hover:to-gray-200 
  transition-colors
"
```

### Action Buttons
```tsx
// Set Default Button
className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"

// Sync Button
className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-[#3a4660] to-gray-400 hover:from-[#3a4660] hover:to-[#3a4660] rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
```

## 🔄 State Management

### Processing State
```tsx
{cv.parsedStatus === "processing" ? (
  <div className="text-center">
    <div className="w-8 h-8 border-3 border-gray-200 border-t-[#3a4660] rounded-full animate-spin"/>
    <p className="text-[10px] text-gray-500">Processing...</p>
  </div>
) : (
  // Show document icon
)}
```

### Menu State
```tsx
const [showMenu, setShowMenu] = useState(false);

// Click outside to close
{showMenu && (
  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
)}
```

## 🎭 Variants

### Default CV (Highlighted)
```tsx
<CVCardHorizontal
  cv={cv}
  isDefault={true}  // Ring border + default badge
/>
```

### Regular CV
```tsx
<CVCardHorizontal
  cv={cv}
  isDefault={false}  // Normal border
/>
```

### Processing CV
```tsx
<CVCardHorizontal
  cv={{ ...cv, parsedStatus: "processing" }}  // Shows spinner
/>
```

## 📊 Component Hierarchy

```
CVCardHorizontal
├── Container (flex row/col)
│   ├── Thumbnail Section
│   │   ├── Processing Spinner (conditional)
│   │   └── Document Icon SVG
│   └── Info Section
│       ├── Top Row: Badges
│       │   ├── Source Badge (Uploaded/Builder/Draft)
│       │   └── Privacy Badge (Private/Public)
│       ├── Middle Row: Title & Default Badge
│       │   ├── CV Name (truncated)
│       │   └── Default Badge (conditional)
│       └── Bottom Row: Metadata & Actions
│           ├── Date & File Size
│           ├── Set Default Button (conditional)
│           ├── Sync Button
│           └── Dropdown Menu
│               ├── Preview
│               ├── Download
│               ├── Rename
│               └── Delete
```

## 🧪 Testing Checklist

- [ ] Desktop layout (≥640px): Horizontal orientation
- [ ] Mobile layout (<640px): Vertical stacking
- [ ] Hover effects on thumbnail and buttons
- [ ] Default CV ring border displays correctly
- [ ] Processing spinner shows when `parsedStatus === "processing"`
- [ ] Sync button disabled when processing
- [ ] Click thumbnail/title triggers preview
- [ ] Dropdown menu opens/closes correctly
- [ ] Click outside closes dropdown
- [ ] All badges display with correct colors
- [ ] Text truncation works for long filenames
- [ ] Responsive button layout on small screens

## 🔗 Related Components

- `CVCard.tsx` - Original vertical card component
- `CVGrid.tsx` - Grid layout for multiple cards
- `CVTabs.tsx` - Tab navigation for CV categories
- `PreviewModal.tsx` - Modal for CV preview
- `EmptyState.tsx` - Empty state when no CVs

## 📝 Notes

- Gradient container should wrap the card when displaying default CV
- Component handles Firebase data structure
- All actions are optional props (can be undefined)
- SVG icons are inline for better performance
- Responsive breakpoint: `sm:` (640px)
- Uses CareerMate color scheme: `#3a4660` primary

## 🎉 Benefits vs Original Card

| Feature | Vertical Card | Horizontal Card |
|---------|--------------|-----------------|
| Space efficiency | Low (240px wide) | High (full width) |
| Information density | Medium | High |
| Mobile experience | Good | Better (native) |
| Scanability | Medium | High |
| Actions visibility | Hidden in menu | Always visible |
| Best use case | Grid layout | List layout, Featured |

---

**Status**: ✅ **PRODUCTION READY**  
**Version**: 1.0.0  
**Last Updated**: November 21, 2025
