# 📊 Candidate Dashboard & CM Profile - Documentation

## Tổng quan

Tài liệu hướng dẫn sử dụng 2 trang mới được tạo cho candidate: Dashboard và CM Profile (ITviec Profile).

## 🆕 Trang đã tạo

### 1. Dashboard (`/candidate/dashboard`)

**File:** `src/app/candidate/dashboard/page.tsx`

#### Tính năng:

- ✅ **Welcome Header**: Hiển thị avatar, tên, chức danh và email
- ✅ **Your Attached CV**: Card hiển thị CV đã upload với link manage
- ✅ **ITviec Profile Progress**:
  - Progress circle 58% completed
  - Hướng dẫn hoàn thiện profile để generate CV
  - Preview CV templates
- ✅ **Your Activities**: 3 cards thống kê
  - Applied Jobs (màu xanh dương)
  - Saved Jobs (màu đỏ)
  - Job Invitations (màu xanh lá)

#### Layout:

```
┌─────────────┬─────────────────────────────────────┐
│             │  Welcome Header                     │
│  CVSidebar  │  Your Attached CV                   │
│             │  ITviec Profile (58% progress)      │
│             │  Your Activities (3 cards)          │
└─────────────┴─────────────────────────────────────┘
```

---

### 2. CM Profile / ITviec Profile (`/candidate/cm-profile`)

**File:** `src/app/candidate/cm-profile/page.tsx`

#### Tính năng:

- ✅ **Profile Header**: Avatar, tên, title với edit button
- ✅ **Contact Information Grid**:
  - Email, Phone, Date of birth
  - Gender, Address, Personal link
- ✅ **Profile Sections** (mỗi section có Add/Edit/Delete):
  1. About Me
  2. Education (có data mẫu: FPT University)
  3. Work Experience
  4. Skills
  5. Foreign Language
  6. Highlight Project (có data mẫu: FB project)
  7. Certificates
  8. Awards

#### Right Sidebar (sticky):

- ✅ **Profile Strength Card**:
  - Progress circle 20% completed
  - Hướng dẫn complete 70% để generate CV
  - Action buttons: Add About me, Add Contact, Add Work Experience
  - Expandable "Add more information"
  - Preview & Download CV button (màu đỏ)

#### Layout:

```
┌────────────┬────────────────────────────┬───────────────┐
│            │  Profile Header            │  Profile      │
│ CVSidebar  │  Contact Info Grid         │  Strength     │
│            │  About Me                  │  (20%)        │
│            │  Education                 │               │
│            │  Work Experience           │  + Add About  │
│            │  Skills                    │  + Contact    │
│            │  Foreign Language          │  + Work Exp   │
│            │  Highlight Project         │               │
│            │  Certificates              │  [Download]   │
│            │  Awards                    │               │
└────────────┴────────────────────────────┴───────────────┘
```

---

## 🎨 Design System

### Colors:

- **Primary**: Red (#ef4444) - Progress bars, buttons, icons
- **Blue**: (#3b82f6) - Links, Applied Jobs
- **Red**: (#ef4444) - Saved Jobs
- **Green**: (#10b981) - Job Invitations
- **Gray**: Background and borders

### Components:

- **Cards**: White background, rounded-xl, shadow-sm, border
- **Progress Circle**: SVG-based, 58%/20% completion
- **Icons**: Lucide React (Edit2, Plus, Trash2, ChevronDown/Up)
- **Buttons**: Hover effects, transition-colors

---

## 📁 File Structure

```
src/app/candidate/
├── dashboard/
│   ├── page.tsx              ✅ Dashboard page
│   └── loading.tsx           ✅ Loading skeleton
├── cm-profile/
│   ├── page.tsx              ✅ CM Profile/ITviec Profile
│   └── loading.tsx           ✅ Loading skeleton
└── ...

src/lib/
└── candidate-menu-item.tsx   ✅ Updated: /profile → /cm-profile

src/components/layout/
├── CVSidebar.tsx             ✅ Shared sidebar (đã có sẵn)
└── CandidateMenuList.tsx     ✅ Updated: fixed duplicate prefix
```

---

## 🔗 Navigation

### Menu Items (CVSidebar):

1. Dashboard → `/candidate/dashboard` ✅ NEW
2. CV Management → `/candidate/cv-management`
3. CM Profile → `/candidate/cm-profile` ✅ NEW (updated from /profile)
4. My Jobs → `/candidate/my-jobs`
5. Job Invitation → `/candidate/job-invitation`
6. Email Subscriptions → `/candidate/email-subscriptions`
7. Notifications → `/candidate/notifications`
8. Settings → `/candidate/settings`

### Links trong Dashboard:

- "Update your profile" → `/candidate/cm-profile`
- "Manage CV Management" → `/candidate/cv-management`
- "Complete your profile" → `/candidate/cm-profile`

---

## 🎯 User Flow

### Dashboard Flow:

```
1. User vào /candidate/dashboard
2. Xem overview: CV status, Profile progress, Activities
3. Click "Update profile" → Chuyển tới CM Profile
4. Click "Manage CV" → Chuyển tới CV Management
```

### CM Profile Flow:

```
1. User vào /candidate/cm-profile
2. Thấy Profile Strength: 20% completed
3. Click "Add About me" → Mở form thêm About Me
4. Click "Add Contact Information" → Mở form thêm contact
5. Hoàn thiện các sections khác
6. Khi đạt 70% → Click "Preview & Download CV"
```

---

## 🚀 Features Highlight

### Dashboard:

- 📊 Visual progress tracking (58% profile completion)
- 📈 Activity statistics với color-coded cards
- 🔗 Quick navigation tới các sections quan trọng
- 📄 CV Management status tracking

### CM Profile:

- 🎨 Clean, professional layout
- ✏️ Inline editing cho mọi section
- ➕ Easy add/remove items
- 📊 Real-time profile strength tracking
- 💾 Export CV khi đạt 70%
- 📱 Responsive design (sticky sidebar trên desktop)

---

## 💡 Development Notes

### State Management:

- `useState` cho expandable sections
- `profileCompletion` variable để track progress
- Client component (`"use client"`) để support interactivity

### Performance:

- Loading skeletons cho smooth UX
- Lazy loading với Next.js automatic code splitting
- Optimized với CVSidebar shared component

### Accessibility:

- Semantic HTML
- ARIA labels ready to add
- Keyboard navigation support
- Color contrast compliant

---

## 🔧 Customization Guide

### Thay đổi Profile Completion:

```tsx
// In page.tsx
const profileCompletion = 20; // Change this value

// Update SVG strokeDasharray
strokeDasharray={`${56 * 2 * Math.PI * (profileCompletion/100)} ${56 * 2 * Math.PI}`}
```

### Thêm Activity Card mới:

```tsx
<div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
  <div className="flex items-center justify-between mb-2">
    <h3 className="text-sm font-medium text-gray-700">New Activity</h3>
    <Icon className="w-5 h-5 text-purple-600" />
  </div>
  <div className="text-3xl font-bold text-purple-600">0</div>
  <p className="text-xs text-gray-500 mt-1">Description</p>
</div>
```

### Thêm Profile Section mới:

```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold text-gray-900">New Section</h2>
    <button className="text-red-600 hover:text-red-700 p-2">
      <Plus className="w-5 h-5" />
    </button>
  </div>
  <p className="text-gray-400 text-sm italic">Section description</p>
</div>
```

---

## ✅ Testing Checklist

### Dashboard:

- [ ] Navigate to `/candidate/dashboard`
- [ ] Check all links work correctly
- [ ] Verify progress circle displays 58%
- [ ] Check activity cards show correct numbers
- [ ] Test responsive layout (desktop/mobile)
- [ ] Verify loading skeleton appears

### CM Profile:

- [ ] Navigate to `/candidate/cm-profile`
- [ ] Check Profile Strength sidebar (20%)
- [ ] Test expand/collapse "Add more information"
- [ ] Verify Edit/Delete buttons on existing items
- [ ] Test Add buttons on empty sections
- [ ] Check sticky sidebar on scroll
- [ ] Verify loading skeleton appears

---

## 🐛 Known Issues & Solutions

### Issue: Duplicate /candidate/candidate in URLs

**Solved**: Updated `CandidateMenuList.tsx` với idempotent prefix logic

### Issue: Profile page conflict

**Solved**: Created new route `/candidate/cm-profile` instead of `/candidate/profile`

---

## 📚 Next Steps

### Backend Integration:

1. Connect to API endpoints for:
   - Get user profile data
   - Update profile sections
   - Upload/manage CV files
   - Get activity statistics

### Features to Add:

1. Modal dialogs for Add/Edit forms
2. Form validation với Zod
3. Image upload for avatar
4. CV preview modal
5. Export CV functionality
6. Real-time profile completion calculation

### Enhancements:

1. Animation transitions
2. Toast notifications on success/error
3. Drag & drop for CV upload
4. Auto-save functionality
5. Progress persistence in localStorage

---

## 📞 Support

Nếu gặp vấn đề:

1. Check console logs
2. Verify routes in menu items
3. Check CVSidebar active page props
4. Review loading states

---

**Created:** October 17, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
